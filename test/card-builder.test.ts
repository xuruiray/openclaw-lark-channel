/**
 * Card Builder Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildCard,
  selectMessageType,
  detectColor,
  extractTitle,
} from '../src/card-builder.js';

describe('Card Builder', () => {
  describe('detectColor', () => {
    it('should detect red for urgent/critical content', () => {
      expect(detectColor('🚨 URGENT: Server down!')).toBe('red');
      expect(detectColor('CRITICAL error occurred')).toBe('red');
      expect(detectColor('❌ Task failed')).toBe('red');
      expect(detectColor('紧急：系统故障')).toBe('red');
    });

    it('should detect orange for warnings', () => {
      expect(detectColor('⚠️ Warning: Low disk space')).toBe('orange');
      expect(detectColor('Caution required')).toBe('orange');
      expect(detectColor('注意：内存不足')).toBe('orange');
    });

    it('should detect green for success', () => {
      expect(detectColor('✅ Task completed')).toBe('green');
      expect(detectColor('🟢 All systems operational')).toBe('green');
      expect(detectColor('Success! Deployment done')).toBe('green');
      expect(detectColor('成功：任务完成')).toBe('green');
    });

    it('should detect indigo for research/analysis', () => {
      expect(detectColor('📊 Quarterly Report')).toBe('indigo');
      expect(detectColor('Research findings')).toBe('indigo');
      expect(detectColor('分析报告')).toBe('indigo');
    });

    it('should default to blue', () => {
      expect(detectColor('Hello, how are you?')).toBe('blue');
      expect(detectColor('Regular message')).toBe('blue');
    });
  });

  describe('extractTitle', () => {
    it('should extract emoji-prefixed titles', () => {
      expect(extractTitle('🧠 Thinking about this...\nMore content')).toBe('🧠 Thinking about this...');
      expect(extractTitle('✅ Done!\nDetails here')).toBe('✅ Done!');
    });

    it('should extract bold text titles', () => {
      expect(extractTitle('**Important Update**\nContent')).toBe('Important Update');
    });

    it('should extract markdown headers', () => {
      expect(extractTitle('# Main Title\nContent')).toBe('Main Title');
      expect(extractTitle('## Section Title\nContent')).toBe('Section Title');
    });

    it('should return null for content without title', () => {
      expect(extractTitle('Just regular text\nNo title here')).toBeNull();
    });

    it('should truncate long titles', () => {
      const longTitle = '🧠 ' + 'A'.repeat(100);
      const result = extractTitle(longTitle + '\nContent');
      expect(result!.length).toBeLessThanOrEqual(50);
    });
  });

  describe('selectMessageType', () => {
    it('should skip NO_REPLY and HEARTBEAT_OK', () => {
      expect(selectMessageType('NO_REPLY')).toBe('skip');
      expect(selectMessageType('HEARTBEAT_OK')).toBe('skip');
      expect(selectMessageType(null)).toBe('skip');
      expect(selectMessageType(undefined)).toBe('skip');
      expect(selectMessageType('')).toBe('skip');
    });

    it('should use text for short messages', () => {
      expect(selectMessageType('Hi!')).toBe('text');
      expect(selectMessageType('Short reply here')).toBe('text');
    });

    it('should use interactive for longer messages', () => {
      const longMessage = 'This is a longer message that spans multiple lines.\n'.repeat(5);
      expect(selectMessageType(longMessage)).toBe('interactive');
    });

    it('should use interactive for multiline messages', () => {
      expect(selectMessageType('Line 1\nLine 2\nLine 3')).toBe('interactive');
    });
  });

  describe('buildCard', () => {
    it('should build a basic card', () => {
      const card = buildCard({ text: 'Hello, world!' });

      expect(card.config?.wide_screen_mode).toBe(true);
      expect(card.elements?.length).toBeGreaterThan(0);
      expect(card.elements?.[0]).toHaveProperty('tag', 'div');
    });

    it('should add header for titled content', () => {
      const card = buildCard({ text: '🧠 Thinking\nAbout the problem...' });

      expect(card.header).toBeDefined();
      expect(card.header?.title?.content).toBe('🧠 Thinking');
    });

    it('should use explicit title', () => {
      const card = buildCard({
        text: 'Content without title marker',
        title: 'Custom Title',
      });

      expect(card.header?.title?.content).toBe('Custom Title');
    });

    it('should use explicit color', () => {
      const card = buildCard({
        text: 'Regular text',
        title: 'Alert',
        color: 'red',
      });

      expect(card.header?.template).toBe('red');
    });

    it('should add note with timestamp and session key', () => {
      const card = buildCard({
        text: 'Test message',
        sessionKey: 'lark:oc_abc',
        showTimestamp: true,
        showSessionKey: true,
      });

      const note = card.elements?.find((el) => el.tag === 'note');
      expect(note).toBeDefined();
    });

    it('should truncate long content', () => {
      const longText = 'A'.repeat(35000);
      const card = buildCard({ text: longText });

      const div = card.elements?.find((el) => el.tag === 'div') as { text?: { content?: string } };
      expect(div?.text?.content?.length).toBeLessThanOrEqual(30100); // 30000 + truncation message
      expect(div?.text?.content).toContain('truncated');
    });

    it('should convert markdown headers to bold', () => {
      const card = buildCard({ text: '# Header\nContent' });

      const div = card.elements?.find((el) => el.tag === 'div') as { text?: { content?: string } };
      expect(div?.text?.content).toContain('**');
      expect(div?.text?.content).not.toContain('# ');
    });
  });
});
