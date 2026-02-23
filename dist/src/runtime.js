/**
 * Lark Runtime State Management
 *
 * Manages the runtime state for the Lark channel plugin,
 * including the OpenClaw plugin API reference.
 */
// ─── State ───────────────────────────────────────────────────────
let runtime = null;
const accountRuntimes = new Map();
// ─── Runtime Access ──────────────────────────────────────────────
export function setLarkRuntime(api) {
    runtime = api;
}
export function getLarkRuntime() {
    if (!runtime) {
        throw new Error('Lark runtime not initialized');
    }
    return runtime;
}
// ─── Account Runtime ─────────────────────────────────────────────
export function getAccountRuntime(accountId) {
    return accountRuntimes.get(accountId);
}
export function setAccountRuntime(accountId, state) {
    const existing = accountRuntimes.get(accountId);
    const newState = {
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
export function clearAccountRuntime(accountId) {
    accountRuntimes.delete(accountId);
}
export function listAccountRuntimes() {
    return new Map(accountRuntimes);
}
// ─── Default Runtime State ───────────────────────────────────────
export function createDefaultRuntimeState(accountId) {
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
//# sourceMappingURL=runtime.js.map