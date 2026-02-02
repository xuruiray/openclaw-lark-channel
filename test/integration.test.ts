/**
 * Integration Tests
 * 
 * These tests verify the full flow of message processing.
 * Note: Requires a mock or test Lark server for full testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { MessageQueue } from '../src/queue.js';
import { buildCard, selectMessageType } from '../src/card-builder.js';
import { WebhookHandler, decryptPayload, shouldRespondInGroup } from '../src/webhook.js';
import { LarkClient } from '../src/client.js';

// Test database path
const TEST_DB_PATH = path.join(os.tmpdir(), `lark-integration-test-${Date.now()}.db`);

describe('Integration Tests', () => {
  describe('Full Message Flow', () => {
    let queue: MessageQueue;

    beforeEach(() => {
      queue = new MessageQueue(TEST_DB_PATH);
    });

    afterEach(() => {
      queue.close();
      try {
        fs.unlinkSync(TEST_DB_PATH);
        fs.unlinkSync(`${TEST_DB_PATH}-wal`);
        fs.unlinkSync(`${TEST_DB_PATH}-shm`);
      } catch {
        // Ignore
      }
    });

    it('should process a full inbound-to-outbound flow', () => {
      // 1. Simulate receiving a message from Lark
      const inboundResult = queue.enqueueInbound({
        messageId: 'integration_test_1',
        chatId: 'oc_test_chat',
        sessionKey: 'lark:oc_test_chat',
        messageText: 'What is the weather today?',
        attachments: null,
      });

      expect(inboundResult.enqueued).toBe(true);

      // 2. Simulate processing the message
      const inboundMessages = queue.dequeueInbound(1);
      expect(inboundMessages.length).toBe(1);
      
      const msg = inboundMessages[0];
      queue.markInboundProcessing(msg.id);

      // 3. Simulate getting a response and marking complete
      const response = 'The weather is sunny today!';
      queue.markInboundCompleted(msg.id, response);

      // 4. Queue the reply for outbound
      const outboundResult = queue.enqueueOutbound('reply', {
        runId: `inbound-${msg.message_id}`,
        sessionKey: msg.session_key,
        chatId: msg.chat_id,
        content: response,
      });

      expect(outboundResult.enqueued).toBe(true);

      // 5. Process outbound queue
      const outboundMessages = queue.dequeueOutbound(1);
      expect(outboundMessages.length).toBe(1);
      
      const outMsg = outboundMessages[0];
      expect(outMsg.content).toBe(response);
      expect(outMsg.queue_type).toBe('reply');

      // 6. Mark as sent
      queue.markOutboundProcessing(outMsg.id);
      queue.markOutboundCompleted(outMsg.id, 'lark_msg_response_1');

      // 7. Verify queue is empty
      const remaining = queue.dequeueOutbound(10);
      expect(remaining.length).toBe(0);
    });

    it('should handle message with image attachment', () => {
      const result = queue.enqueueInbound({
        messageId: 'img_test_1',
        chatId: 'oc_test_chat',
        sessionKey: 'lark:oc_test_chat',
        messageText: '[User sent an image]',
        attachments: [
          { mimeType: 'image/png', content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' },
        ],
      });

      expect(result.enqueued).toBe(true);

      const messages = queue.dequeueInbound(1);
      expect(messages.length).toBe(1);
      
      const attachments = JSON.parse(messages[0].attachments_json!);
      expect(attachments).toHaveLength(1);
      expect(attachments[0].mimeType).toBe('image/png');
    });

    it('should deduplicate messages correctly', () => {
      // First message
      const first = queue.enqueueOutbound('reply', {
        sessionKey: 'lark:oc_chat',
        chatId: 'oc_chat',
        content: 'Dedup test message',
      });
      expect(first.enqueued).toBe(true);

      // Same content, same chat - should be rejected
      const duplicate = queue.enqueueOutbound('reply', {
        sessionKey: 'lark:oc_chat',
        chatId: 'oc_chat',
        content: 'Dedup test message',
      });
      expect(duplicate.enqueued).toBe(false);
      expect(duplicate.reason).toBe('duplicate_pending');

      // Same content, different chat - should be accepted
      const differentChat = queue.enqueueOutbound('reply', {
        sessionKey: 'lark:oc_other_chat',
        chatId: 'oc_other_chat',
        content: 'Dedup test message',
      });
      expect(differentChat.enqueued).toBe(true);
    });
  });

  describe('Card Building Integration', () => {
    it('should build appropriate card for long response', () => {
      const longResponse = `
# Analysis Report

## Summary
This is a comprehensive analysis of the data provided.

### Key Findings
- **Finding 1**: Lorem ipsum dolor sit amet
- **Finding 2**: Consectetur adipiscing elit
- **Finding 3**: Sed do eiusmod tempor

### Recommendations
1. Implement changes to process A
2. Monitor metrics for process B
3. Review documentation for process C

---
Generated at: ${new Date().toISOString()}
      `.trim();

      const type = selectMessageType(longResponse);
      expect(type).toBe('interactive');

      const card = buildCard({ text: longResponse, sessionKey: 'lark:test' });
      
      expect(card.config?.wide_screen_mode).toBe(true);
      expect(card.elements?.length).toBeGreaterThan(0);
      
      // Should have a header (extracted from # Analysis Report)
      expect(card.header).toBeDefined();
    });

    it('should handle short text message correctly', () => {
      const shortResponse = 'Got it!';
      
      const type = selectMessageType(shortResponse);
      expect(type).toBe('text');
    });

    it('should skip NO_REPLY messages', () => {
      expect(selectMessageType('NO_REPLY')).toBe('skip');
      expect(selectMessageType('HEARTBEAT_OK')).toBe('skip');
    });
  });

  describe('Webhook Processing', () => {
    it('should correctly determine group response behavior', () => {
      // Direct mention - always respond
      expect(shouldRespondInGroup('hello', [{ key: '@bot' }], true)).toBe(true);
      
      // Question without mention, requireMention=true
      expect(shouldRespondInGroup('What is this?', [], true)).toBe(false);
      
      // Question without mention, requireMention=false
      expect(shouldRespondInGroup('What is this?', [], false)).toBe(true);
      
      // Statement without mention
      expect(shouldRespondInGroup('Just chatting', [], false)).toBe(false);
    });
  });

  describe('Error Recovery', () => {
    let queue: MessageQueue;

    beforeEach(() => {
      queue = new MessageQueue(TEST_DB_PATH);
    });

    afterEach(() => {
      queue.close();
      try {
        fs.unlinkSync(TEST_DB_PATH);
        fs.unlinkSync(`${TEST_DB_PATH}-wal`);
        fs.unlinkSync(`${TEST_DB_PATH}-shm`);
      } catch {
        // Ignore
      }
    });

    it('should retry failed messages with backoff', () => {
      const result = queue.enqueueInbound({
        messageId: 'retry_test_1',
        chatId: 'oc_chat',
        sessionKey: 'lark:oc_chat',
        messageText: 'Test retry',
        attachments: null,
      });

      // Simulate failure
      const messages = queue.dequeueInbound(1);
      queue.markInboundProcessing(messages[0].id);
      queue.markInboundRetry(messages[0].id, 'Gateway timeout');

      // Should not be immediately available
      const immediate = queue.dequeueInbound(1);
      expect(immediate.length).toBe(0);

      // Check stats
      const stats = queue.getStats();
      expect(stats.inbound.pending).toBe(1); // Waiting for retry
    });
  });
});
