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
import fs from 'node:fs';
import path from 'node:path';
// ─── Client Class ────────────────────────────────────────────────
export class LarkClient {
    sdk;
    appId;
    appSecret;
    domain;
    tokenCache = { token: null, expireTime: 0 };
    imageCacheDir;
    constructor(params) {
        this.appId = params.appId;
        this.appSecret = params.appSecret;
        this.domain = params.domain ?? 'lark';
        this.sdk = new LarkSDK.Client({
            appId: this.appId,
            appSecret: this.appSecret,
            domain: this.domain === 'feishu' ? LarkSDK.Domain.Feishu : LarkSDK.Domain.Lark,
            appType: LarkSDK.AppType.SelfBuild,
        });
        // Image cache directory
        this.imageCacheDir = path.join(process.env.HOME ?? '/root', '.openclaw', 'lark-images');
        try {
            if (!fs.existsSync(this.imageCacheDir)) {
                fs.mkdirSync(this.imageCacheDir, { recursive: true });
            }
        }
        catch {
            // Ignore
        }
    }
    // ─── Token Management ──────────────────────────────────────────
    async getTenantToken() {
        const now = Date.now() / 1000;
        if (this.tokenCache.token && this.tokenCache.expireTime > now) {
            return this.tokenCache.token;
        }
        try {
            const domain = this.domain === 'feishu'
                ? 'https://open.feishu.cn'
                : 'https://open.larksuite.com';
            const res = await fetch(`${domain}/open-apis/auth/v3/tenant_access_token/internal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_id: this.appId,
                    app_secret: this.appSecret,
                }),
            });
            const data = await res.json();
            if (data.code === 0 && data.tenant_access_token) {
                this.tokenCache.token = data.tenant_access_token;
                this.tokenCache.expireTime = now + (data.expire ?? 7200) - 60; // Refresh 60s early
                return this.tokenCache.token;
            }
        }
        catch (e) {
            console.error('[LARK-TOKEN]', e.message);
        }
        return null;
    }
    // ─── Probe (Health Check) ──────────────────────────────────────
    async probe(timeoutMs = 5000) {
        const start = Date.now();
        try {
            const token = await this.getTenantToken();
            if (!token) {
                return { ok: false, error: 'Failed to get token' };
            }
            const domain = this.domain === 'feishu'
                ? 'https://open.feishu.cn'
                : 'https://open.larksuite.com';
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(`${domain}/open-apis/bot/v3/info`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal,
            });
            clearTimeout(timeout);
            const data = await res.json();
            if (data.code === 0 && data.bot) {
                return {
                    ok: true,
                    bot: {
                        id: data.bot.open_id,
                        name: data.bot.app_name,
                        avatar: data.bot.avatar_url,
                    },
                    elapsedMs: Date.now() - start,
                };
            }
            return { ok: false, error: data.msg ?? 'Unknown error', elapsedMs: Date.now() - start };
        }
        catch (e) {
            return { ok: false, error: e.message, elapsedMs: Date.now() - start };
        }
    }
    // ─── Message Reading ───────────────────────────────────────────
    async getMessage(messageId) {
        try {
            const res = await this.sdk.im.v1.message.get({ path: { message_id: messageId } });
            const items = res?.data?.items ?? [];
            if (items.length === 0)
                return null;
            const parent = items[0];
            const children = items.slice(1).filter((item) => item.upper_message_id === messageId);
            return { ...parent, children };
        }
        catch (e) {
            console.error(`[LARK-MSG] Failed to get message ${messageId}:`, e.message);
            return null;
        }
    }
    // ─── Message Sending ───────────────────────────────────────────
    /**
     * Send a text message
     */
    async sendText(chatId, text) {
        try {
            const res = await this.sdk.im.v1.message.create({
                params: { receive_id_type: 'chat_id' },
                data: {
                    receive_id: chatId,
                    msg_type: 'text',
                    content: JSON.stringify({ text }),
                },
            });
            if (res?.data?.message_id) {
                return { success: true, messageId: res.data.message_id };
            }
            return { success: false, error: 'No message_id in response' };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    /**
     * Send an interactive card message
     */
    async sendCard(chatId, card) {
        try {
            const res = await this.sdk.im.v1.message.create({
                params: { receive_id_type: 'chat_id' },
                data: {
                    receive_id: chatId,
                    msg_type: 'interactive',
                    content: JSON.stringify(card),
                },
            });
            if (res?.data?.message_id) {
                return { success: true, messageId: res.data.message_id };
            }
            return { success: false, error: 'No message_id in response' };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    /**
     * Send a post (rich text) message
     */
    async sendPost(chatId, content) {
        try {
            const res = await this.sdk.im.v1.message.create({
                params: { receive_id_type: 'chat_id' },
                data: {
                    receive_id: chatId,
                    msg_type: 'post',
                    content: JSON.stringify(content),
                },
            });
            if (res?.data?.message_id) {
                return { success: true, messageId: res.data.message_id };
            }
            return { success: false, error: 'No message_id in response' };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    /**
     * Send an image message
     */
    async sendImage(chatId, imageKey) {
        try {
            const res = await this.sdk.im.v1.message.create({
                params: { receive_id_type: 'chat_id' },
                data: {
                    receive_id: chatId,
                    msg_type: 'image',
                    content: JSON.stringify({ image_key: imageKey }),
                },
            });
            if (res?.data?.message_id) {
                return { success: true, messageId: res.data.message_id };
            }
            return { success: false, error: 'No message_id in response' };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    // ─── Image Operations ──────────────────────────────────────────
    /**
     * Download an image from a message
     */
    async downloadImage(imageKey, messageId) {
        try {
            const token = await this.getTenantToken();
            if (!token)
                return null;
            const domain = this.domain === 'feishu'
                ? 'https://open.feishu.cn'
                : 'https://open.larksuite.com';
            const url = `${domain}/open-apis/im/v1/messages/${messageId}/resources/${imageKey}?type=image`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok)
                return null;
            const buffer = Buffer.from(await res.arrayBuffer());
            console.log(`[LARK-IMG] Downloaded ${Math.round(buffer.byteLength / 1024)}KB: ${imageKey}`);
            return {
                content: buffer.toString('base64'),
                mimeType: res.headers.get('content-type') ?? 'image/png',
            };
        }
        catch (e) {
            console.error('[LARK-IMG-ERROR]', e.message);
            return null;
        }
    }
    /**
     * Upload an image and get image_key
     */
    async uploadImage(buffer, _filename) {
        try {
            const res = await this.sdk.im.v1.image.create({
                data: {
                    image_type: 'message',
                    image: buffer,
                },
            });
            if (res?.data?.image_key) {
                return { success: true, imageKey: res.data.image_key };
            }
            return { success: false, error: 'No image_key in response' };
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    /**
     * Upload image from URL
     */
    async uploadImageFromUrl(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                return { success: false, error: `Failed to fetch: ${res.status}` };
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            return this.uploadImage(buffer);
        }
        catch (e) {
            return { success: false, error: e.message };
        }
    }
    // ─── File Operations ─────────────────────────────────────────────
    /**
     * Download a file attachment from a message (zip, pdf, doc, etc.)
     * API: GET /im/v1/messages/{message_id}/resources/{file_key}?type=file
     */
    async downloadFile(fileKey, messageId, fileName) {
        try {
            const token = await this.getTenantToken();
            if (!token)
                return null;
            const domain = this.domain === 'feishu'
                ? 'https://open.feishu.cn'
                : 'https://open.larksuite.com';
            const url = `${domain}/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=file`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                console.error(`[LARK-FILE] Download failed: HTTP ${res.status} for ${fileKey}`);
                return null;
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            const sizeKB = Math.round(buffer.byteLength / 1024);
            console.log(`[LARK-FILE] Downloaded ${sizeKB}KB: ${fileName ?? fileKey}`);
            // Determine content type from response or file extension
            let mimeType = res.headers.get('content-type') ?? 'application/octet-stream';
            if (fileName) {
                const ext = fileName.split('.').pop()?.toLowerCase();
                const extMap = {
                    'zip': 'application/zip',
                    'pdf': 'application/pdf',
                    'doc': 'application/msword',
                    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'xls': 'application/vnd.ms-excel',
                    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'ppt': 'application/vnd.ms-powerpoint',
                    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'txt': 'text/plain',
                    'csv': 'text/csv',
                    'json': 'application/json',
                    'xml': 'application/xml',
                    'html': 'text/html',
                    'md': 'text/markdown',
                };
                if (ext && extMap[ext]) {
                    mimeType = extMap[ext];
                }
            }
            return {
                base64: buffer.toString('base64'),
                mimeType,
                fileName: fileName ?? fileKey,
                sizeBytes: buffer.byteLength,
            };
        }
        catch (e) {
            console.error('[LARK-FILE-ERROR]', e.message);
            return null;
        }
    }
    /**
     * Download an audio message from Lark
     * Audio content format: { "file_key": "...", "duration": 1000 }
     */
    async downloadAudio(fileKey, messageId, duration) {
        try {
            const token = await this.getTenantToken();
            if (!token)
                return null;
            const domain = this.domain === 'feishu'
                ? 'https://open.feishu.cn'
                : 'https://open.larksuite.com';
            const url = `${domain}/open-apis/im/v1/messages/${messageId}/resources/${fileKey}?type=file`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) {
                console.error(`[LARK-AUDIO] Download failed: HTTP ${res.status} for ${fileKey}`);
                return null;
            }
            const buffer = Buffer.from(await res.arrayBuffer());
            const sizeKB = Math.round(buffer.byteLength / 1024);
            const durationSec = duration ? Math.round(duration / 1000) : 0;
            console.log(`[LARK-AUDIO] Downloaded ${sizeKB}KB, ${durationSec}s: ${fileKey}`);
            return {
                base64: buffer.toString('base64'),
                mimeType: 'audio/ogg', // Lark audio is typically opus in ogg container
                durationMs: duration ?? 0,
                sizeBytes: buffer.byteLength,
            };
        }
        catch (e) {
            console.error('[LARK-AUDIO-ERROR]', e.message);
            return null;
        }
    }
    // ─── Content Parsing ───────────────────────────────────────────
    /**
     * Parse post (rich text) content
     */
    parsePostContent(content) {
        const texts = [];
        const imageKeys = [];
        try {
            const parsed = typeof content === 'string' ? JSON.parse(content) : content;
            const typedParsed = parsed;
            const blocks = typedParsed.content ?? typedParsed.zh_cn?.content ?? typedParsed.en_us?.content;
            if (!blocks)
                return { texts, imageKeys };
            for (const para of blocks) {
                if (!Array.isArray(para))
                    continue;
                for (const el of para) {
                    if (el.tag === 'text' && el.text)
                        texts.push(el.text);
                    if (el.tag === 'img' && el.image_key)
                        imageKeys.push(el.image_key);
                    if (el.tag === 'a' && el.text) {
                        texts.push(el.href ? `[${el.text}](${el.href})` : el.text);
                    }
                }
            }
        }
        catch {
            // Ignore parse errors
        }
        return { texts, imageKeys };
    }
    // ─── Getters ───────────────────────────────────────────────────
    get client() {
        return this.sdk;
    }
}
const clientRegistry = new Map();
const DEFAULT_ID = 'default';
export function getLarkClient(accountId) {
    const id = accountId ?? DEFAULT_ID;
    const client = clientRegistry.get(id);
    if (!client) {
        throw new Error(`LarkClient not initialized for account "${id}". Call setLarkClient first.`);
    }
    return client;
}
export function setLarkClient(client, accountId) {
    clientRegistry.set(accountId ?? DEFAULT_ID, client);
}
//# sourceMappingURL=client.js.map