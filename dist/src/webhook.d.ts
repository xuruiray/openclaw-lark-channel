/**
 * Lark Webhook Handler
 *
 * HTTP server for receiving Lark events:
 * - URL verification
 * - Message events (text, post, image)
 * - Encryption/decryption support
 * - Immediate persistence (no message loss)
 */
import type { Server } from 'node:http';
import type { LarkMessageEvent } from './types.js';
import type { MessageQueue } from './queue.js';
import type { LarkClient } from './client.js';
/**
 * Decrypt an encrypted Lark event payload
 */
export declare function decryptPayload(encrypt: string, encryptKey: string): unknown;
/**
 * Check if bot should respond to this group message
 */
export declare function shouldRespondInGroup(text: string, mentions: Array<{
    key?: string;
}>, requireMention: boolean): boolean;
export interface WebhookConfig {
    port: number;
    bind?: string;
    encryptKey?: string;
    queue: MessageQueue;
    client: LarkClient;
    onMessage?: (event: LarkMessageEvent) => void;
    sessionKeyPrefix?: string;
    groupRequireMention?: boolean;
    groupAllowlist?: Set<string>;
}
export declare class WebhookHandler {
    private config;
    private server;
    private readonly mediaDir;
    constructor(config: WebhookConfig);
    /**
     * Save a file attachment to disk and return the path.
     * This allows the agent to access files via the read tool.
     */
    private saveFileAttachment;
    /**
     * Check if server is running
     */
    isRunning(): boolean;
    /**
     * Start the HTTP server (idempotent - won't fail if already running)
     */
    start(): Promise<void>;
    /**
     * Stop the HTTP server
     */
    stop(): Promise<void>;
    /**
     * Handle incoming HTTP request
     */
    private handleRequest;
    /**
     * Handle card callback HTTP request (separate endpoint: /webhook/card)
     * This is configured as "Message Card Request URL" in Lark Open Platform
     */
    private handleCardRequest;
    /**
     * Handle card action callback (button clicks, form submissions)
     * Returns card update or toast to Lark
     */
    private handleCardCallback;
    /**
     * Handle a message event
     */
    private handleMessageEvent;
    /**
     * Get the underlying HTTP server
     */
    getServer(): Server | null;
}
//# sourceMappingURL=webhook.d.ts.map