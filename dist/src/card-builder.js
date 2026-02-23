/**
 * Lark Card Builder
 *
 * Builds interactive cards with:
 * - Automatic color detection (urgency)
 * - Markdown support
 * - Note/footer elements
 * - Proper truncation
 */
// ─── Constants ───────────────────────────────────────────────────
const MAX_CARD_LENGTH = 30000;
const MAX_TITLE_LENGTH = 50;
/**
 * Detect appropriate header color based on content
 */
export function detectColor(text) {
    const t = text.toLowerCase();
    // Red - Urgent/Critical/Error
    if (/urgent|critical|emergency|🚨|❌|紧急|严重|error|failed|失败/.test(t)) {
        return 'red';
    }
    // Orange - Warning/Attention
    if (/warning|⚠️|注意|警告|caution|小心/.test(t)) {
        return 'orange';
    }
    // Green - Success/Done
    if (/success|done|✅|🟢|成功|完成|completed|finished/.test(t)) {
        return 'green';
    }
    // Indigo - Research/Analysis
    if (/research|analysis|📊|report|研究|分析|报告/.test(t)) {
        return 'indigo';
    }
    // Default - Blue
    return 'blue';
}
// ─── Title Extraction ────────────────────────────────────────────
/**
 * Extract a title from the content
 */
export function extractTitle(text) {
    const lines = text.split('\n');
    // Look in first 5 lines for a suitable title
    for (const line of lines.slice(0, 5)) {
        const trimmed = line.trim();
        // Emoji-prefixed lines (section markers)
        if (/^[🧠🔧📊✅💡❌⚠️🚨📝🎯🔍]/.test(trimmed)) {
            return trimmed.replace(/\*\*/g, '').substring(0, MAX_TITLE_LENGTH);
        }
        // Bold text lines
        if (/^\*\*[^*]+\*\*/.test(trimmed)) {
            return trimmed.replace(/\*\*/g, '').substring(0, MAX_TITLE_LENGTH);
        }
        // Markdown headers
        if (/^#{1,3}\s+.+/.test(trimmed)) {
            return trimmed.replace(/^#{1,3}\s+/, '').substring(0, MAX_TITLE_LENGTH);
        }
    }
    return null;
}
/**
 * Build an interactive card from text content
 */
export function buildCard(options) {
    const { text, sessionKey, title: explicitTitle, color: explicitColor, showTimestamp = true, showSessionKey = true, maxLength = MAX_CARD_LENGTH, } = options;
    // Detect or use provided title
    const title = explicitTitle ?? extractTitle(text);
    const color = explicitColor ?? detectColor(text);
    // Process markdown for Lark compatibility
    // - Remove markdown headers (convert to bold)
    // - Truncate if too long
    let processedText = text
        .replace(/^#{1,6}\s+/gm, '**')
        .substring(0, maxLength);
    if (text.length > maxLength) {
        processedText += '\n\n⚠️ _(Message truncated)_';
    }
    // Build elements
    const elements = [
        {
            tag: 'div',
            text: {
                tag: 'lark_md',
                content: processedText,
            },
        },
    ];
    // Add note/footer
    if (showTimestamp || showSessionKey) {
        const noteParts = [];
        if (showTimestamp) {
            noteParts.push(`⏱️ ${new Date().toISOString().substring(0, 19)} UTC`);
        }
        if (showSessionKey && sessionKey) {
            noteParts.push(`📍 ${sessionKey}`);
        }
        elements.push({
            tag: 'note',
            elements: [
                {
                    tag: 'plain_text',
                    content: noteParts.join(' | '),
                },
            ],
        });
    }
    // Build card
    const card = {
        config: {
            wide_screen_mode: true,
        },
        elements,
    };
    // Add header if we have a title
    if (title) {
        card.header = {
            title: {
                tag: 'plain_text',
                content: title,
            },
            template: color,
        };
    }
    return card;
}
/**
 * Select the appropriate message type based on content
 */
export function selectMessageType(text) {
    if (!text || text === 'NO_REPLY' || text === 'HEARTBEAT_OK') {
        return 'skip';
    }
    // Short, simple messages → plain text
    if (text.length < 100 && text.split('\n').length <= 2) {
        return 'text';
    }
    // Everything else → interactive card
    return 'interactive';
}
// ─── Card Builder Factory ────────────────────────────────────────
export class CardBuilder {
    defaultSessionKey;
    showTimestamp;
    showSessionKey;
    constructor(options) {
        this.defaultSessionKey = options?.sessionKey ?? 'unknown';
        this.showTimestamp = options?.showTimestamp ?? true;
        this.showSessionKey = options?.showSessionKey ?? true;
    }
    build(text, options) {
        return buildCard({
            text,
            sessionKey: this.defaultSessionKey,
            showTimestamp: this.showTimestamp,
            showSessionKey: this.showSessionKey,
            ...options,
        });
    }
    selectType(text) {
        return selectMessageType(text);
    }
}
//# sourceMappingURL=card-builder.js.map