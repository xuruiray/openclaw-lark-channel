/**
 * Persistent Message Queue - GUARANTEED DELIVERY
 *
 * Handles ALL message flows with guaranteed delivery:
 * - Inbound: Lark → Gateway (user messages)
 * - Outbound: Gateway → Lark (replies + mirrors)
 *
 * Uses SQLite for durability - NO messages lost during:
 * - Service restarts
 * - WebSocket disconnections
 * - Gateway restarts
 * - Lark API failures
 *
 * UNLIMITED retries with exponential backoff (capped at 5 minutes)
 */
import type { InboundMessage, OutboundMessage, QueueStats, EnqueueResult, Attachment } from './types.js';
export declare class MessageQueue {
    private db;
    private dbPath;
    private cleanupInterval;
    private stmtEnqueueOutbound;
    private stmtDequeueOutbound;
    private stmtCheckOutboundDupe;
    private stmtCheckSentDupe;
    private stmtUpdateOutbound;
    private stmtMarkOutboundProcessing;
    private stmtRecordSent;
    private stmtEnqueueInbound;
    private stmtDequeueInbound;
    private stmtUpdateInbound;
    private stmtMarkInboundProcessing;
    private stmtCheckInboundExists;
    constructor(dbPath?: string);
    private initializeSchema;
    /**
     * Reset any messages that were in 'processing' state when the service stopped.
     * This prevents messages from getting stuck after a restart.
     */
    private resetStuckMessages;
    private hashContent;
    private calculateBackoff;
    private hasExceededMaxRetries;
    /**
     * Queue an outbound message (reply or mirror) for delivery to Lark
     */
    enqueueOutbound(queueType: 'reply' | 'mirror', params: {
        runId?: string;
        sessionKey: string;
        chatId: string;
        content: string;
    }): EnqueueResult;
    /**
     * Dequeue outbound messages ready for processing
     */
    dequeueOutbound(limit?: number): OutboundMessage[];
    /**
     * Mark outbound message as being processed
     */
    markOutboundProcessing(id: number): void;
    /**
     * Mark outbound message as completed
     */
    markOutboundCompleted(id: number, larkMessageId: string | null): void;
    /**
     * Mark outbound message for retry (120 retries max with exponential backoff up to 120 min)
     * After max retries, mark as failed_permanent but KEEP in DB for manual review
     */
    markOutboundRetry(id: number, errorMessage: string): void;
    /**
     * Queue an inbound message from Lark for processing by Gateway
     */
    enqueueInbound(params: {
        messageId: string;
        chatId: string;
        sessionKey: string;
        messageText: string;
        attachments?: Attachment[] | null;
    }): EnqueueResult;
    /**
     * Dequeue inbound messages ready for processing
     */
    dequeueInbound(limit?: number): InboundMessage[];
    /**
     * Mark inbound message as being processed
     */
    markInboundProcessing(id: number): void;
    /**
     * Mark inbound message as completed (got response from Gateway)
     */
    markInboundCompleted(id: number, responseText: string): void;
    /**
     * Mark inbound message for retry (120 retries max with exponential backoff up to 120 min)
     * After max retries, mark as failed_permanent but KEEP in DB
     */
    markInboundRetry(id: number, errorMessage: string): void;
    getStats(): QueueStats;
    cleanup(): void;
    private cleanupMediaFiles;
    recoverStuck(): void;
    close(): void;
    get path(): string;
}
export declare function getQueue(dbPath?: string, accountId?: string): MessageQueue;
export declare function closeQueue(accountId?: string): void;
//# sourceMappingURL=queue.d.ts.map