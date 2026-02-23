/**
 * OpenClaw Lark Channel Plugin
 *
 * First-class channel integration for Lark (Feishu) with:
 * - Guaranteed message delivery (SQLite persistence)
 * - Unlimited retries with exponential backoff
 * - Full bidirectional messaging support
 * - Interactive cards with rich formatting
 * - Image upload/download support
 *
 * @author Boyang Wang
 * @license MIT
 */
import type { LarkPluginRuntime } from './src/runtime.js';
import { larkPlugin } from './src/channel.js';
export type { LarkChannelConfig, ResolvedLarkAccount, LarkCard } from './src/types.js';
export { larkPlugin } from './src/channel.js';
export { LarkClient, getLarkClient } from './src/client.js';
export { MessageQueue, getQueue, closeQueue } from './src/queue.js';
export { buildCard, selectMessageType, detectColor } from './src/card-builder.js';
export { WebhookHandler, decryptPayload, shouldRespondInGroup } from './src/webhook.js';
export { LarkConfigSchema } from './src/config-schema.js';
interface OpenClawPluginApi {
    runtime: LarkPluginRuntime;
    registerChannel: (params: {
        plugin: typeof larkPlugin;
    }) => void;
}
declare const plugin: {
    id: string;
    name: string;
    description: string;
    version: string;
    configSchema: import("openclaw/plugin-sdk").ChannelConfigSchema;
    register(api: OpenClawPluginApi): void;
};
export default plugin;
//# sourceMappingURL=index.d.ts.map