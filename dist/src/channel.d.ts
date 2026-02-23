/**
 * Lark Channel Plugin
 *
 * First-class OpenClaw channel plugin for Lark (Feishu) with:
 * - Guaranteed message delivery (SQLite persistence)
 * - Unlimited retries with exponential backoff
 * - Full bidirectional messaging support
 * - Interactive cards with rich formatting
 * - Image upload/download support
 */
import type { LarkChannelConfig, ResolvedLarkAccount, LarkRuntimeState, LarkProbeResult } from './types.js';
export declare function resolveLarkAccount(params: {
    cfg: {
        channels?: {
            lark?: LarkChannelConfig;
        };
    };
    accountId?: string;
}): ResolvedLarkAccount;
export declare function listLarkAccountIds(cfg: {
    channels?: {
        lark?: LarkChannelConfig;
    };
}): string[];
interface ChannelPluginContext {
    cfg: {
        channels?: {
            lark?: LarkChannelConfig;
        };
        gateway?: {
            port?: number;
            auth?: {
                token?: string;
            };
        };
    };
    account: ResolvedLarkAccount;
    runtime?: LarkRuntimeState;
    abortSignal?: AbortSignal;
    log?: {
        info: (msg: string) => void;
        debug?: (msg: string) => void;
    };
}
export declare const larkPlugin: {
    id: string;
    meta: {
        quickstartAllowFrom: boolean;
        id: string;
        label: string;
        selectionLabel: string;
        detailLabel: string;
        docsPath: string;
        blurb: string;
        order: number;
    };
    capabilities: {
        chatTypes: readonly ["direct", "group"];
        reactions: boolean;
        threads: boolean;
        media: boolean;
        nativeCommands: boolean;
        blockStreaming: boolean;
    };
    reload: {
        configPrefixes: string[];
    };
    configSchema: import("openclaw/plugin-sdk").ChannelConfigSchema;
    config: {
        listAccountIds: (cfg: {
            channels?: {
                lark?: LarkChannelConfig;
            };
        }) => string[];
        resolveAccount: (cfg: {
            channels?: {
                lark?: LarkChannelConfig;
            };
        }, accountId?: string) => ResolvedLarkAccount;
        defaultAccountId: () => string;
        isConfigured: (account: ResolvedLarkAccount) => boolean;
        describeAccount: (account: ResolvedLarkAccount) => {
            accountId: string;
            name: string;
            enabled: boolean;
            configured: boolean;
            tokenSource: "config" | "file" | "env" | "none";
        };
        resolveAllowFrom: ({ cfg, accountId }: {
            cfg: {
                channels?: {
                    lark?: LarkChannelConfig;
                };
            };
            accountId?: string;
        }) => string[];
        formatAllowFrom: ({ allowFrom }: {
            allowFrom: string[];
        }) => string[];
    };
    security: {
        resolveDmPolicy: ({ accountId, account }: {
            cfg: {
                channels?: {
                    lark?: LarkChannelConfig;
                };
            };
            accountId?: string;
            account: ResolvedLarkAccount;
        }) => {
            policy: "open" | "pairing" | "allowlist";
            allowFrom: string[];
            policyPath: string;
            allowFromPath: string;
            approveHint: string;
            normalizeEntry: (raw: string) => string;
        };
        collectWarnings: ({ account }: {
            account: ResolvedLarkAccount;
            cfg: {
                channels?: {
                    lark?: LarkChannelConfig;
                };
            };
        }) => string[];
    };
    messaging: {
        normalizeTarget: (target: string) => string;
        targetResolver: {
            looksLikeId: (target: string) => boolean;
            hint: string;
        };
    };
    outbound: {
        deliveryMode: "direct";
        chunker: (text: string, limit: number) => string[];
        chunkerMode: "markdown";
        textChunkLimit: number;
        sendText: ({ to, text }: {
            to: string;
            text: string;
            accountId?: string;
        }) => Promise<{
            skipped?: boolean;
            messageId?: string;
            error?: string;
            channel: "lark";
        }>;
        sendMedia: ({ to, text, mediaUrl }: {
            to: string;
            text?: string;
            mediaUrl: string;
            accountId?: string;
        }) => Promise<{
            channel: "lark";
            error: string;
            messageId?: undefined;
        } | {
            channel: "lark";
            messageId: string | undefined;
            error: string | undefined;
        }>;
    };
    status: {
        defaultRuntime: LarkRuntimeState;
        collectStatusIssues: (accounts: Array<{
            accountId?: string;
            configured?: boolean;
            enabled?: boolean;
        }>) => {
            channel: string;
            accountId: string;
            kind?: string;
            message: string;
            fix?: string;
        }[];
        buildChannelSummary: ({ snapshot }: {
            snapshot: LarkRuntimeState & {
                configured?: boolean;
                tokenSource?: string;
                probe?: LarkProbeResult;
            };
        }) => {
            configured: boolean;
            tokenSource: string;
            running: boolean;
            mode: "webhook";
            lastStartAt: number | null;
            lastStopAt: number | null;
            lastError: string | null;
            probe: LarkProbeResult | undefined;
        };
        probeAccount: ({ account, timeoutMs }: {
            account: ResolvedLarkAccount;
            timeoutMs?: number;
        }) => Promise<LarkProbeResult>;
        buildAccountSnapshot: ({ account, runtime, probe }: {
            account: ResolvedLarkAccount;
            cfg: {
                channels?: {
                    lark?: LarkChannelConfig;
                };
            };
            runtime?: LarkRuntimeState;
            probe?: LarkProbeResult;
        }) => {
            accountId: string;
            name: string;
            enabled: boolean;
            configured: boolean;
            tokenSource: "config" | "file" | "env" | "none";
            running: boolean;
            lastStartAt: number | null;
            lastStopAt: number | null;
            lastError: string | null;
            mode: string;
            probe: LarkProbeResult | undefined;
            lastInboundAt: number | null;
            lastOutboundAt: number | null;
        };
    };
    gateway: {
        startAccount: (ctx: ChannelPluginContext) => Promise<void>;
    };
};
export type LarkPlugin = typeof larkPlugin;
export {};
//# sourceMappingURL=channel.d.ts.map