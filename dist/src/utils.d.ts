/**
 * Utility Functions
 */
/**
 * Resolve user path (replace ~ with home directory)
 */
export declare function resolveUserPath(p: string): string;
/**
 * Generate a UUID v4
 */
export declare function uuid(): string;
/**
 * Read a file, return null if doesn't exist or empty
 */
export declare function readFileOrNull(filePath: string): string | null;
/**
 * Ensure a directory exists
 */
export declare function ensureDir(dirPath: string): void;
/**
 * Sleep for a given number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Truncate text to a maximum length with ellipsis
 */
export declare function truncate(text: string, maxLength: number): string;
/**
 * Format bytes as human-readable string
 */
export declare function formatBytes(bytes: number): string;
/**
 * Parse JSON safely, return null on error
 */
export declare function parseJsonSafe<T>(str: string): T | null;
/**
 * Check if a string looks like a Lark chat ID
 */
export declare function looksLikeLarkChatId(str: string): boolean;
/**
 * Check if a string looks like a Lark user ID
 */
export declare function looksLikeLarkUserId(str: string): boolean;
//# sourceMappingURL=utils.d.ts.map