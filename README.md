# @openclaw/lark

First-class [OpenClaw](https://openclaw.ai) channel plugin for [Lark (Feishu)](https://www.larksuite.com/) with **guaranteed message delivery**.

[![npm version](https://img.shields.io/npm/v/@openclaw/lark.svg)](https://www.npmjs.com/package/@openclaw/lark)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Telegram Feature Parity

Full feature parity with the OpenClaw Telegram channel:

- ✅ **New Session Messages** — Shows "✅ New session started · model: ..." on /new, /reset
- 💸 **Usage Footer** — Session cost, today's cost, 30-day cost
- 🧠 **Reasoning Visibility** — See AI thinking process when enabled
- 📋 **Verbose Output** — Tool calls, exec commands visible when enabled
- ⚡ **Native Dispatch** — Uses OpenClaw's internal dispatch system

### Robustness

- 🔒 **Guaranteed Delivery** — All messages persisted to SQLite; never lose a message
- ♾️ **120 Retries** — Exponential backoff, capped at 120 minutes
- 🛡️ **No Message Loss** — Failed messages kept in DB for manual review
- 📊 **30-Day Retention** — All messages kept for audit trail

### Messaging

- 💬 **Full Messaging Support** — Text, rich text (post), images, interactive cards
- 🎨 **Smart Card Formatting** — Automatic color detection based on content urgency
- 📷 **Image Upload/Download** — Seamless image handling in both directions
- 👥 **Group Chat Support** — Configurable mention requirements and allowlists
- 🌏 **International & China** — Works with both Lark (international) and Feishu (China)

## Installation

```bash
npm install @openclaw/lark
```

Or add to your OpenClaw configuration:

```yaml
# openclaw.json
{
  "plugins": {
    "entries": {
      "lark": { "enabled": true }
    }
  },
  "channels": {
    "lark": {
      "enabled": true,
      "appId": "cli_xxx",
      "appSecretFile": "~/.openclaw/secrets/lark_app_secret"
    }
  }
}
```

## Configuration

### Basic Setup

1. Create a bot in [Lark Open Platform](https://open.larksuite.com/) (or [Feishu Open Platform](https://open.feishu.cn/) for China)

2. Enable the following permissions:
   - `im:message` — Send and receive messages
   - `im:message.group_at_msg` — Receive @mentions in groups
   - `im:resource` — Upload and download images

3. Configure webhook URL in your bot settings:
   ```
   https://your-server.com/webhook
   ```

4. Add configuration to OpenClaw:
   ```json
   {
     "channels": {
       "lark": {
         "enabled": true,
         "appId": "cli_your_app_id",
         "appSecretFile": "~/.openclaw/secrets/lark_app_secret",
         "webhookPort": 3000,
         "domain": "lark"
       }
     }
   }
   ```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the channel |
| `appId` | string | — | Lark application ID |
| `appSecret` | string | — | Lark application secret |
| `appSecretFile` | string | — | Path to file containing app secret (recommended) |
| `encryptKey` | string | — | Encryption key for webhook events |
| `webhookPort` | number | `3000` | Port for webhook HTTP server |
| `domain` | string | `"lark"` | API domain: `"lark"` (international) or `"feishu"` (China) |
| `dmPolicy` | string | `"pairing"` | DM security: `"open"`, `"pairing"`, or `"allowlist"` |
| `allowFrom` | string[] | `[]` | Allowed user IDs (for allowlist policy) |
| `groupPolicy` | string | `"allowlist"` | Group security: `"open"`, `"allowlist"`, or `"deny"` |
| `groups` | object | — | Per-group configuration |
| `queueDbPath` | string | `~/.openclaw/lark-queue.db` | Path to SQLite queue database |

### Environment Variables

The following environment variables are also supported:

- `FEISHU_APP_ID` — Application ID
- `FEISHU_APP_SECRET` — Application secret
- `FEISHU_ENCRYPT_KEY` — Webhook encryption key

## Message Types

### Outgoing Messages

The plugin automatically selects the appropriate message type:

| Content | Type |
|---------|------|
| Short text (<100 chars, ≤2 lines) | Plain text |
| Longer/formatted content | Interactive card |
| Contains `NO_REPLY` or `HEARTBEAT_OK` | Skipped |

### Interactive Cards

Cards are automatically formatted with:

- **Colored headers** based on content:
  - 🔴 Red — `urgent`, `critical`, `error`
  - 🟠 Orange — `warning`, `caution`
  - 🟢 Green — `success`, `done`, `completed`
  - 🔵 Blue — Default
  
- **Markdown support** — Bold, lists, code blocks
- **Footer** — Timestamp and session key
- **Automatic truncation** — Long messages are safely truncated

### Images

Images are automatically handled:

```typescript
// Incoming: Images are converted to base64 attachments
// Outgoing: Image URLs are uploaded and embedded in cards
```

## Queue System

The queue system ensures **no message loss**:

```
Inbound Flow:
  Lark → Webhook → SQLite Queue → Gateway → Response → SQLite Queue → Lark

Outbound Flow:
  Gateway → SQLite Queue → Lark API
```

### Features

- **WAL mode** — Write-Ahead Logging for durability
- **Exponential backoff** — 1s, 2s, 4s, ... up to 120 minutes max
- **120 retry attempts** — Never give up on message delivery
- **Deduplication** — 10-minute window prevents double-sends
- **Automatic recovery** — Stuck messages recovered on restart
- **30-day retention** — All messages kept for audit

### Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "guaranteedDelivery": true,
  "unlimitedRetries": true,
  "queue": {
    "inbound": { "pending": 0, "processing": 0, "completed": 42, "failed": 0 },
    "outbound": { "pending": 0, "processing": 0, "completed": 128, "failed": 0 }
  }
}
```

## Group Chats

### Configuration

```json
{
  "channels": {
    "lark": {
      "groupPolicy": "allowlist",
      "groups": {
        "oc_abc123": {
          "name": "Team Chat",
          "requireMention": true
        },
        "oc_def456": {
          "name": "Alerts",
          "requireMention": false
        }
      }
    }
  }
}
```

### Behavior

- `requireMention: true` — Bot only responds when @mentioned
- `requireMention: false` — Bot responds to question-like messages

## Security

### DM Policies

- `"open"` — Accept messages from anyone
- `"pairing"` — Require pairing approval (default)
- `"allowlist"` — Only accept from configured user IDs

### Group Policies

- `"open"` — Accept from any group
- `"allowlist"` — Only configured groups (default)
- `"deny"` — Ignore all group messages

### Encryption

If your bot uses encrypted events:

```json
{
  "channels": {
    "lark": {
      "encryptKey": "your-encrypt-key"
    }
  }
}
```

## Development

### Build

```bash
npm install
npm run build
```

### Test

```bash
npm test
```

### Local Development

```bash
# Start in development mode
npm run dev

# Run tests in watch mode
npm run test:watch
```

## API Reference

### LarkClient

```typescript
import { LarkClient } from '@openclaw/lark';

const client = new LarkClient({
  appId: 'cli_xxx',
  appSecret: 'your-secret',
  domain: 'lark', // or 'feishu'
});

// Send text
await client.sendText('oc_chatid', 'Hello!');

// Send card
await client.sendCard('oc_chatid', {
  header: { title: { tag: 'plain_text', content: 'Title' }, template: 'blue' },
  elements: [{ tag: 'div', text: { tag: 'lark_md', content: '**Bold**' } }],
});

// Upload image
const { imageKey } = await client.uploadImageFromUrl('https://example.com/image.png');
```

### MessageQueue

```typescript
import { getQueue } from '@openclaw/lark';

const queue = getQueue();

// Enqueue outbound message
queue.enqueueOutbound('reply', {
  sessionKey: 'lark:oc_chatid',
  chatId: 'oc_chatid',
  content: 'Hello!',
});

// Get stats
const stats = queue.getStats();
```

### Card Builder

```typescript
import { buildCard, selectMessageType, detectColor } from '@openclaw/lark';

// Build a card
const card = buildCard({
  text: '✅ Task completed successfully!',
  sessionKey: 'lark:oc_chatid',
});
// → Green header, formatted content, footer with timestamp

// Select message type
const type = selectMessageType('Short text'); // → 'text'
const type2 = selectMessageType('Long formatted\ncontent\nhere'); // → 'interactive'

// Detect color
const color = detectColor('🚨 URGENT: System down!'); // → 'red'
```

## Troubleshooting

### Messages not arriving

1. Check webhook is accessible:
   ```bash
   curl -X POST http://your-server:3000/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test"}'
   ```

2. Verify bot permissions in Lark Open Platform

3. Check queue health:
   ```bash
   curl http://localhost:3000/health
   ```

### Messages stuck in queue

Check for stuck messages:
```bash
sqlite3 ~/.openclaw/lark-queue.db "SELECT * FROM inbound_queue WHERE status='processing'"
```

The queue automatically recovers stuck messages (>5 min) on startup.

### Card formatting issues

- Markdown tables are not supported in Lark
- Use `fields` array for side-by-side content
- Maximum card length: 30,000 characters

## License

MIT © [Boyang Wang](https://github.com/boyangwang)

## Contributing

Contributions welcome! Please read our [contributing guidelines](CONTRIBUTING.md) first.

## Related

- [OpenClaw](https://openclaw.ai) — AI assistant framework
- [Lark Open Platform](https://open.larksuite.com/) — Lark developer docs
- [Feishu Open Platform](https://open.feishu.cn/) — Feishu developer docs (China)
