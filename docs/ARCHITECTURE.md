# Lark Channel Plugin Architecture

## Overview

The Lark channel plugin is a first-class OpenClaw channel integration that provides guaranteed message delivery through SQLite persistence and unlimited retries.

## Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Lark Channel Plugin                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐                                                   │
│  │  index.ts    │ ← Plugin entry point                              │
│  │  (plugin)    │   Registers with OpenClaw                         │
│  └──────────────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────┐                                                   │
│  │ channel.ts   │ ← ChannelPlugin implementation                    │
│  │ (larkPlugin) │   Capabilities, config, outbound, status          │
│  └──────────────┘                                                   │
│         │                                                           │
│         ├──────────────────┬──────────────────┬─────────────────┐   │
│         ▼                  ▼                  ▼                 ▼   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────┐  │
│  │  webhook.ts  │  │   queue.ts   │  │  client.ts   │  │card-   │  │
│  │  (HTTP)      │  │  (SQLite)    │  │  (Lark API)  │  │builder │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Inbound (Lark → OpenClaw)

```
Lark Server
    │
    │ HTTP POST /webhook
    ▼
┌──────────────────┐
│  WebhookHandler  │ ← Receives event, validates, decrypts
└──────────────────┘
    │
    │ Persist immediately
    ▼
┌──────────────────┐
│  MessageQueue    │ ← SQLite: inbound_queue table
│  (SQLite)        │   Status: pending → processing → completed
└──────────────────┘
    │
    │ Inbound consumer (500ms interval)
    ▼
┌──────────────────┐
│  askGateway()    │ ← WebSocket to OpenClaw Gateway
│  (WebSocket)     │   Sends message, waits for response
└──────────────────┘
    │
    │ Response received
    ▼
┌──────────────────┐
│  MessageQueue    │ ← Marks inbound completed
│  (outbound)      │   Enqueues reply in outbound_queue
└──────────────────┘
```

### Outbound (OpenClaw → Lark)

```
┌──────────────────┐
│  MessageQueue    │ ← Outbound consumer (500ms interval)
│  (outbound)      │   Dequeues pending messages
└──────────────────┘
    │
    │ Process each message
    ▼
┌──────────────────┐
│  sendToLark()    │ ← Selects message type (text/card)
└──────────────────┘
    │
    │
    ▼
┌──────────────────┐
│  LarkClient      │ ← Sends via Lark SDK
│  (sendText/Card) │
└──────────────────┘
    │
    │ API response
    ▼
┌──────────────────┐
│  MessageQueue    │ ← Marks completed or retry
│  (update)        │   Records in sent_messages
└──────────────────┘
```

## Queue System

### Tables

1. **inbound_queue** - Messages FROM Lark
   - `message_id` - Lark message ID (unique, for dedup)
   - `chat_id` - Chat identifier
   - `session_key` - OpenClaw session key
   - `message_text` - Message content
   - `attachments_json` - Image attachments
   - `status` - pending/processing/completed
   - `retries` - Retry count
   - `next_retry_at` - Next retry timestamp

2. **outbound_queue** - Messages TO Lark
   - `queue_type` - 'reply' or 'mirror'
   - `content_hash` - MD5 hash for dedup
   - `content` - Message content
   - `chat_id` - Target chat
   - `status` - pending/processing/completed
   - `lark_message_id` - Returned message ID

3. **sent_messages** - Deduplication tracking
   - `content_hash` - For detecting duplicates
   - `chat_id` - Target chat
   - `lark_message_id` - Sent message ID

### Retry Logic

- **Unlimited retries** - We never give up
- **Exponential backoff** - 1s, 2s, 4s, 8s, ..., capped at 5 minutes
- **Automatic recovery** - Stuck messages (processing >5min) recovered on startup

### Deduplication

- **10-minute window** for duplicate detection
- **Content hash** based (MD5)
- **Per-chat** deduplication

## Card Builder

### Message Type Selection

```
┌─────────────────────────────────────────┐
│           selectMessageType()            │
├─────────────────────────────────────────┤
│                                         │
│  "NO_REPLY" or "HEARTBEAT_OK" → skip    │
│                                         │
│  < 100 chars, ≤ 2 lines → text          │
│                                         │
│  Everything else → interactive card     │
│                                         │
└─────────────────────────────────────────┘
```

### Color Detection

Based on content keywords:
- 🔴 **Red**: urgent, critical, error, 紧急, 严重
- 🟠 **Orange**: warning, caution, 警告, 注意
- 🟢 **Green**: success, done, completed, 成功, 完成
- 🔵 **Blue**: Default

## Security

### DM Policies

- **open** - Accept from anyone
- **pairing** - Require approval (default)
- **allowlist** - Only configured users

### Group Policies

- **open** - Accept from any group
- **allowlist** - Only configured groups (default)
- **deny** - Ignore all groups

### Group Mention Detection

In groups, bot responds when:
1. Explicitly @mentioned
2. Or (if requireMention=false) message contains:
   - Question mark at end
   - Question keywords (why, how, what, help, please)
   - Chinese keywords (帮, 请, 能否, 可以, 解释)

## Configuration

Configuration is loaded from OpenClaw config:

```json
{
  "channels": {
    "lark": {
      "appId": "cli_xxx",
      "appSecretFile": "~/.openclaw/secrets/lark_app_secret",
      "webhookPort": 3000,
      "domain": "lark",
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist",
      "groups": {
        "oc_abc123": { "requireMention": true }
      }
    }
  }
}
```

## Error Handling

### Webhook Errors
- Invalid JSON → 400 Bad Request
- Decrypt failure → 400 Decrypt fail
- Unknown event → Ignored silently

### Gateway Errors
- Timeout → Retry with backoff
- Connection closed → Retry with backoff
- Agent error → Retry with backoff

### Lark API Errors
- Rate limit → Retry with backoff
- Token expired → Auto-refresh
- Network error → Retry with backoff

## Health Check

`GET /health` returns:

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
