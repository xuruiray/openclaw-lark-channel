/**
 * Utility Functions
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
/**
 * Resolve user path (replace ~ with home directory)
 */
export function resolveUserPath(p) {
    return p.replace(/^~/, process.env.HOME ?? '/root');
}
/**
 * Generate a UUID v4
 */
export function uuid() {
    return crypto.randomUUID();
}
/**
 * Read a file, return null if doesn't exist or empty
 */
export function readFileOrNull(filePath) {
    try {
        const resolved = resolveUserPath(filePath);
        if (fs.existsSync(resolved)) {
            const content = fs.readFileSync(resolved, 'utf8').trim();
            return content || null;
        }
    }
    catch {
        // Ignore
    }
    return null;
}
/**
 * Ensure a directory exists
 */
export function ensureDir(dirPath) {
    const resolved = resolveUserPath(dirPath);
    if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
    }
}
/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncate(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}
/**
 * Format bytes as human-readable string
 */
export function formatBytes(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
/**
 * Parse JSON safely, return null on error
 */
export function parseJsonSafe(str) {
    try {
        return JSON.parse(str);
    }
    catch {
        return null;
    }
}
/**
 * Check if a string looks like a Lark chat ID
 */
export function looksLikeLarkChatId(str) {
    return /^oc_[a-f0-9]+$/i.test(str);
}
/**
 * Check if a string looks like a Lark user ID
 */
export function looksLikeLarkUserId(str) {
    return /^ou_[a-f0-9]+$/i.test(str) || /^on_[a-f0-9]+$/i.test(str);
}
//# sourceMappingURL=utils.js.map