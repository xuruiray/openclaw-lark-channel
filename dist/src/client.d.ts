/**
 * Lark API Client
 *
 * Typed wrapper around Lark SDK with:
 * - Token caching and auto-refresh
 * - Image upload/download
 * - Message sending (text, post, interactive)
 * - Error handling
 */
import * as LarkSDK from '@larksuiteoapi/node-sdk';
import type { LarkSendResult, LarkImageUploadResult, LarkCard, LarkProbeResult, ParsedPostContent, ImageAttachment } from './types.js';
export declare class LarkClient {
    private sdk;
    private appId;
    private appSecret;
    private domain;
    private tokenCache;
    private imageCacheDir;
    constructor(params: {
        appId: string;
        appSecret: string;
        domain?: 'lark' | 'feishu';
    });
    getTenantToken(): Promise<string | null>;
    probe(timeoutMs?: number): Promise<LarkProbeResult>;
    getMessage(messageId: string): Promise<{
        msg_type?: string;
        body?: {
            content?: string;
        };
        sender?: {
            id?: string;
            sender_type?: string;
        };
    } | null>;
    /**
     * Send a text message
     */
    sendText(chatId: string, text: string): Promise<LarkSendResult>;
    /**
     * Send an interactive card message
     */
    sendCard(chatId: string, card: LarkCard): Promise<LarkSendResult>;
    /**
     * Send a post (rich text) message
     */
    sendPost(chatId: string, content: object): Promise<LarkSendResult>;
    /**
     * Send an image message
     */
    sendImage(chatId: string, imageKey: string): Promise<LarkSendResult>;
    /**
     * Download an image from a message
     */
    downloadImage(imageKey: string, messageId: string): Promise<ImageAttachment | null>;
    /**
     * Upload an image and get image_key
     */
    uploadImage(buffer: Buffer, _filename?: string): Promise<LarkImageUploadResult>;
    /**
     * Upload image from URL
     */
    uploadImageFromUrl(url: string): Promise<LarkImageUploadResult>;
    /**
     * Download a file attachment from a message (zip, pdf, doc, etc.)
     * API: GET /im/v1/messages/{message_id}/resources/{file_key}?type=file
     */
    downloadFile(fileKey: string, messageId: string, fileName?: string): Promise<{
        base64: string;
        mimeType: string;
        fileName: string;
        sizeBytes: number;
    } | null>;
    /**
     * Download an audio message from Lark
     * Audio content format: { "file_key": "...", "duration": 1000 }
     */
    downloadAudio(fileKey: string, messageId: string, duration?: number): Promise<{
        base64: string;
        mimeType: string;
        durationMs: number;
        sizeBytes: number;
    } | null>;
    /**
     * Parse post (rich text) content
     */
    parsePostContent(content: string | object): ParsedPostContent;
    get client(): LarkSDK.Client;
}
export declare function getLarkClient(accountId?: string): LarkClient;
export declare function setLarkClient(client: LarkClient, accountId?: string): void;
//# sourceMappingURL=client.d.ts.map