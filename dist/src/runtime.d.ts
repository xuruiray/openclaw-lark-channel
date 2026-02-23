/**
 * Lark Runtime State Management
 *
 * Manages the runtime state for the Lark channel plugin,
 * including the OpenClaw plugin API reference.
 */
import type { LarkRuntimeState } from './types.js';
export interface LarkPluginRuntime {
    channel: {
        text: {
            chunkMarkdownText: (text: string, limit: number) => string[];
        };
        reply: {
            dispatchReplyWithBufferedBlockDispatcher: (params: {
                ctx: Record<string, unknown>;
                cfg: Record<string, unknown>;
                dispatcherOptions: {
                    responsePrefix?: string;
                    responsePrefixContextProvider?: () => Record<string, unknown>;
                    deliver: (payload: {
                        text?: string;
                        mediaUrl?: string;
                    }, info: {
                        kind: string;
                    }) => Promise<void>;
                    onSkip?: (payload: unknown, info: {
                        reason: string;
                    }) => void;
                    onError?: (err: Error, info: {
                        kind: string;
                    }) => void;
                    onReplyStart?: () => void;
                };
                replyOptions?: {
                    skillFilter?: unknown;
                    onPartialReply?: (payload: {
                        text?: string;
                    }) => void;
                    onReasoningStream?: (payload: {
                        text?: string;
                    }) => void;
                    disableBlockStreaming?: boolean;
                    onModelSelected?: (ctx: {
                        provider: string;
                        model: string;
                        thinkLevel?: string;
                    }) => void;
                    images?: Array<{
                        type: 'image';
                        data: string;
                        mimeType: string;
                    }>;
                };
            }) => Promise<{
                queuedFinal?: boolean;
            }>;
            finalizeInboundContext: (ctx: Record<string, unknown>) => Record<string, unknown>;
            createReplyDispatcherWithTyping: (options: unknown) => unknown;
        };
        routing: {
            resolveAgentRoute: (params: {
                cfg: Record<string, unknown>;
                channel: string;
                accountId?: string;
                peer?: {
                    kind: 'group' | 'dm';
                    id: string;
                };
            }) => {
                sessionKey: string;
                mainSessionKey: string;
                agentId: string;
                accountId?: string;
            };
        };
        session: {
            resolveStorePath: () => string | null;
            recordInboundSession: (params: {
                storePath: string | null;
                sessionKey: string;
                ctx: Record<string, unknown>;
                updateLastRoute?: {
                    sessionKey: string;
                    channel: string;
                    to: string;
                    accountId?: string;
                };
                onRecordError?: (err: Error) => void;
            }) => Promise<void>;
        };
    };
    config: {
        loadConfig: () => Record<string, unknown>;
        writeConfigFile: (cfg: unknown) => Promise<void>;
    };
    logging: {
        shouldLogVerbose: () => boolean;
    };
}
export declare function setLarkRuntime(api: LarkPluginRuntime): void;
export declare function getLarkRuntime(): LarkPluginRuntime;
export declare function getAccountRuntime(accountId: string): LarkRuntimeState | undefined;
export declare function setAccountRuntime(accountId: string, state: Partial<LarkRuntimeState>): void;
export declare function clearAccountRuntime(accountId: string): void;
export declare function listAccountRuntimes(): Map<string, LarkRuntimeState>;
export declare function createDefaultRuntimeState(accountId: string): LarkRuntimeState;
//# sourceMappingURL=runtime.d.ts.map