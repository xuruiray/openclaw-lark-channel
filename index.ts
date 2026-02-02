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
import { buildChannelConfigSchema } from 'openclaw/plugin-sdk';
import { LarkConfigSchema } from './src/config-schema.js';

// Re-export types
export type { LarkChannelConfig, ResolvedLarkAccount, LarkCard } from './src/types.js';
export { larkPlugin } from './src/channel.js';
export { LarkClient, getLarkClient } from './src/client.js';
export { MessageQueue, getQueue, closeQueue } from './src/queue.js';
export { buildCard, selectMessageType, detectColor } from './src/card-builder.js';
export { WebhookHandler, decryptPayload, shouldRespondInGroup } from './src/webhook.js';
export { LarkConfigSchema } from './src/config-schema.js';

// ─── Plugin Definition ───────────────────────────────────────────

interface OpenClawPluginApi {
  runtime: LarkPluginRuntime;
  registerChannel: (params: { plugin: typeof larkPlugin }) => void;
}

const plugin = {
  id: 'lark',
  name: 'Lark',
  description: 'Lark (Feishu) channel plugin with guaranteed message delivery',
  version: '1.0.0',
  configSchema: buildChannelConfigSchema(LarkConfigSchema),

  register(api: OpenClawPluginApi) {
    // Import dynamically to avoid circular dependency
    import('./src/runtime.js').then(({ setLarkRuntime }) => {
      setLarkRuntime(api.runtime);
    });
    
    api.registerChannel({ plugin: larkPlugin });
  },
};

export default plugin;
