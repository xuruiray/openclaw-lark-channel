# Lark Channel Configuration Guide

## Quick Start

1. Create a bot in [Lark Open Platform](https://open.larksuite.com/)
2. Enable required permissions
3. Configure webhook URL
4. Add configuration to OpenClaw

## Minimal Configuration

```json
{
  "channels": {
    "lark": {
      "enabled": true,
      "appId": "cli_your_app_id",
      "appSecretFile": "~/.openclaw/secrets/lark_app_secret"
    }
  }
}
```

## Full Configuration

```json
{
  "channels": {
    "lark": {
      "enabled": true,
      "appId": "cli_your_app_id",
      "appSecretFile": "~/.openclaw/secrets/lark_app_secret",
      "encryptKey": "your_encrypt_key",
      "webhookPort": 3000,
      "domain": "lark",
      "dmPolicy": "pairing",
      "allowFrom": ["ou_user1", "ou_user2"],
      "groupPolicy": "allowlist",
      "groups": {
        "oc_group1": {
          "name": "Team Chat",
          "requireMention": true
        },
        "oc_group2": {
          "name": "Alerts",
          "requireMention": false
        }
      },
      "queueDbPath": "~/.openclaw/lark-queue.db"
    }
  }
}
```

## Configuration Options

### Required

| Option | Description |
|--------|-------------|
| `appId` | Lark application ID from Open Platform |
| `appSecret` or `appSecretFile` | Application secret (prefer file for security) |

### Optional

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the channel |
| `encryptKey` | string | — | Encryption key for webhook events |
| `webhookPort` | number | `3000` | Port for webhook HTTP server |
| `domain` | string | `"lark"` | `"lark"` for international, `"feishu"` for China |
| `dmPolicy` | string | `"pairing"` | DM security policy |
| `allowFrom` | string[] | `[]` | Allowed user IDs |
| `groupPolicy` | string | `"allowlist"` | Group security policy |
| `groups` | object | — | Per-group configuration |
| `queueDbPath` | string | `~/.openclaw/lark-queue.db` | SQLite queue database |

## Environment Variables

You can use environment variables instead of config:

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="your_secret"
export FEISHU_ENCRYPT_KEY="your_encrypt_key"
```

## Security Policies

### DM Policies

**open**
- Accept messages from anyone
- Recommended for: Public bots

**pairing** (default)
- Require pairing approval
- New users must be approved via `/allow lark:<userId>`
- Recommended for: Personal assistants

**allowlist**
- Only accept from configured `allowFrom` list
- Recommended for: Team-specific bots

### Group Policies

**open**
- Accept from any group the bot is added to
- Bot responds when @mentioned (by default)

**allowlist** (default)
- Only respond in configured `groups`
- Most secure option

**deny**
- Ignore all group messages
- Bot only works in DMs

## Group Configuration

```json
{
  "groups": {
    "oc_abc123": {
      "name": "Team Chat",
      "requireMention": true
    },
    "oc_def456": {
      "name": "Alerts",
      "requireMention": false,
      "enabled": true
    }
  }
}
```

### Group Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | — | Friendly name for logs |
| `requireMention` | boolean | `true` | Must @mention bot to trigger |
| `enabled` | boolean | `true` | Enable/disable group |

## Multi-Account Configuration

Support multiple Lark accounts:

```json
{
  "channels": {
    "lark": {
      "enabled": true,
      "appId": "cli_default",
      "appSecretFile": "~/.openclaw/secrets/lark_default",
      "accounts": {
        "team": {
          "enabled": true,
          "appId": "cli_team",
          "appSecretFile": "~/.openclaw/secrets/lark_team",
          "webhookPort": 3001
        }
      }
    }
  }
}
```

## Lark Open Platform Setup

### Required Permissions

Enable these in your bot's permission settings:

- `im:message` — Send and receive messages
- `im:message.group_at_msg` — Receive @mentions in groups
- `im:resource` — Upload and download images

### Webhook Configuration

1. Go to **Event Subscriptions**
2. Set **Request URL**: `https://your-server.com/webhook`
3. Enable events:
   - `im.message.receive_v1`

### Encryption (Optional)

1. Go to **Encrypt Strategy**
2. Enable encryption
3. Copy **Encrypt Key**
4. Add to config: `"encryptKey": "your_key"`

## Troubleshooting

### Bot not responding

1. Check webhook is accessible:
   ```bash
   curl -X POST https://your-server.com/webhook \
     -H "Content-Type: application/json" \
     -d '{"type":"url_verification","challenge":"test"}'
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

3. Check queue for stuck messages:
   ```bash
   sqlite3 ~/.openclaw/lark-queue.db "SELECT * FROM inbound_queue WHERE status='pending'"
   ```

### Cards not rendering

- Maximum card length is 30,000 characters
- Markdown tables are not supported
- Use `fields` for side-by-side content

### Rate limiting

The plugin handles rate limiting automatically with exponential backoff. If you see many retries:

- Reduce message frequency
- Check Lark API quotas
- Consider upgrading Lark plan
