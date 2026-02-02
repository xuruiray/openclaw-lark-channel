/**
 * Lark Runtime State Management
 * 
 * Manages the runtime state for the Lark channel plugin,
 * including the OpenClaw plugin API reference.
 */

import type { LarkRuntimeState } from './types.js';

// ─── Types ───────────────────────────────────────────────────────

export interface LarkPluginRuntime {
  channel: {
    text: {
      chunkMarkdownText: (text: string, limit: number) => string[];
    };
  };
  config: {
    writeConfigFile: (cfg: unknown) => Promise<void>;
  };
  logging: {
    shouldLogVerbose: () => boolean;
  };
}

// ─── State ───────────────────────────────────────────────────────

let runtime: LarkPluginRuntime | null = null;

const accountRuntimes = new Map<string, LarkRuntimeState>();

// ─── Runtime Access ──────────────────────────────────────────────

export function setLarkRuntime(api: LarkPluginRuntime): void {
  runtime = api;
}

export function getLarkRuntime(): LarkPluginRuntime {
  if (!runtime) {
    throw new Error('Lark runtime not initialized');
  }
  return runtime;
}

// ─── Account Runtime ─────────────────────────────────────────────

export function getAccountRuntime(accountId: string): LarkRuntimeState | undefined {
  return accountRuntimes.get(accountId);
}

export function setAccountRuntime(accountId: string, state: Partial<LarkRuntimeState>): void {
  const existing = accountRuntimes.get(accountId);
  const newState: LarkRuntimeState = {
    accountId,
    running: false,
    lastStartAt: null,
    lastStopAt: null,
    lastError: null,
    lastInboundAt: null,
    lastOutboundAt: null,
    webhookServer: null,
    consumersRunning: false,
    ...existing,
    ...state,
  };
  accountRuntimes.set(accountId, newState);
}

export function clearAccountRuntime(accountId: string): void {
  accountRuntimes.delete(accountId);
}

export function listAccountRuntimes(): Map<string, LarkRuntimeState> {
  return new Map(accountRuntimes);
}

// ─── Default Runtime State ───────────────────────────────────────

export function createDefaultRuntimeState(accountId: string): LarkRuntimeState {
  return {
    accountId,
    running: false,
    lastStartAt: null,
    lastStopAt: null,
    lastError: null,
    lastInboundAt: null,
    lastOutboundAt: null,
    webhookServer: null,
    consumersRunning: false,
  };
}
