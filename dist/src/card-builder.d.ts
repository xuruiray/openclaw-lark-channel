/**
 * Lark Card Builder
 *
 * Builds interactive cards with:
 * - Automatic color detection (urgency)
 * - Markdown support
 * - Note/footer elements
 * - Proper truncation
 */
import type { LarkCard } from './types.js';
export type CardColor = 'blue' | 'green' | 'orange' | 'red' | 'indigo' | 'grey' | 'default';
/**
 * Detect appropriate header color based on content
 */
export declare function detectColor(text: string): CardColor;
/**
 * Extract a title from the content
 */
export declare function extractTitle(text: string): string | null;
export interface BuildCardOptions {
    text: string;
    sessionKey?: string;
    title?: string;
    color?: CardColor;
    showTimestamp?: boolean;
    showSessionKey?: boolean;
    maxLength?: number;
}
/**
 * Build an interactive card from text content
 */
export declare function buildCard(options: BuildCardOptions): LarkCard;
export type MessageType = 'skip' | 'text' | 'interactive';
/**
 * Select the appropriate message type based on content
 */
export declare function selectMessageType(text: string | null | undefined): MessageType;
export declare class CardBuilder {
    private defaultSessionKey;
    private showTimestamp;
    private showSessionKey;
    constructor(options?: {
        sessionKey?: string;
        showTimestamp?: boolean;
        showSessionKey?: boolean;
    });
    build(text: string, options?: Partial<BuildCardOptions>): LarkCard;
    selectType(text: string | null | undefined): MessageType;
}
//# sourceMappingURL=card-builder.d.ts.map