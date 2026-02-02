# Lark Channel Plugin - Implementation Plan

## 🎯 Mission Statement

Create a **first-class OpenClaw channel plugin for Lark (Feishu)** that matches Telegram in functionality, UX, and robustness.

### ⚠️ Critical Requirements

1. **NEVER MISS OR LOSE A MESSAGE** — All messages must be persisted to SQLite with unlimited retries
2. **Retain retry logic, robustness, and persistence** from current bridge
3. **Open-source ready** — Clear architecture, comprehensive tests, documentation

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OpenClaw Gateway                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Lark Channel Plugin                        │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐  │  │
│  │  │  Webhook   │  │   Queue     │  │    Outbound          │  │  │
│  │  │  Handler   │→│  (SQLite)   │→│    Delivery           │  │  │
│  │  └────────────┘  └─────────────┘  └──────────────────────┘  │  │
│  │        ↑                                     │               │  │
│  │        │                                     ↓               │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │              Lark SDK (API Client)                     │ │  │
│  │  │  • Message send/receive                                │ │  │
│  │  │  • Image upload/download                               │ │  │
│  │  │  • Card builder                                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
           ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    Lark/Feishu Platform                              │
│  • Bot messages                                                     │
│  • Group chats                                                      │
│  • Direct messages                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
lark-channel/
├── README.md                    # Comprehensive documentation
├── LICENSE                      # MIT License
├── package.json                 # npm package config
├── tsconfig.json                # TypeScript config
├── openclaw.plugin.json         # Plugin manifest
├── index.ts                     # Plugin entry point
├── src/
│   ├── channel.ts               # ChannelPlugin implementation
│   ├── runtime.ts               # Runtime state management
│   ├── queue.ts                 # SQLite persistence queue
│   ├── webhook.ts               # HTTP webhook handler
│   ├── client.ts                # Lark API client wrapper
│   ├── card-builder.ts          # Interactive card construction
│   ├── config.ts                # Config schema and validation
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Helper utilities
├── test/
│   ├── queue.test.ts            # Queue persistence tests
│   ├── webhook.test.ts          # Webhook handler tests
│   ├── client.test.ts           # API client tests
│   ├── integration.test.ts      # End-to-end tests
│   └── fixtures/                # Test fixtures
└── docs/
    ├── ARCHITECTURE.md          # Technical architecture
    ├── CONFIGURATION.md         # Configuration guide
    └── TROUBLESHOOTING.md       # Common issues
```

---

## 🔧 Implementation Phases

### Phase 1: Foundation (Est: 1-2 hours) ✅ COMPLETE

- [x] Create project directory structure
- [x] Set up TypeScript configuration
- [x] Create plugin manifest (`openclaw.plugin.json`)
- [x] Create `package.json` with dependencies
- [x] Implement basic plugin entry point

### Phase 2: Queue System (Est: 1-2 hours) ✅ COMPLETE

- [x] Port `queue.mjs` to TypeScript (`src/queue.ts`)
- [x] Add TypeScript types for queue operations
- [x] Implement unlimited retry logic
- [x] Add exponential backoff with cap
- [x] Implement deduplication logic
- [x] Add queue statistics and health monitoring

### Phase 3: Lark API Client (Est: 1 hour) ✅ COMPLETE

- [x] Create typed Lark SDK wrapper (`src/client.ts`)
- [x] Implement token management with caching
- [x] Implement message sending (text, post, interactive)
- [x] Implement image upload/download
- [x] Handle rate limiting and errors gracefully

### Phase 4: Card Builder (Est: 30 min) ✅ COMPLETE

- [x] Port card building logic (`src/card-builder.ts`)
- [x] Implement urgency detection (color coding)
- [x] Support markdown formatting
- [x] Add note/footer elements

### Phase 5: Channel Plugin (Est: 2 hours) ✅ COMPLETE

- [x] Implement `ChannelPlugin` interface (`src/channel.ts`)
- [x] Define capabilities (chatTypes, media, etc.)
- [x] Implement config schema
- [x] Implement outbound delivery (sendText, sendMedia)
- [x] Implement status monitoring
- [x] Implement gateway lifecycle (start/stop)

### Phase 6: Webhook Handler (Est: 1 hour) ✅ COMPLETE

- [x] Implement HTTP webhook endpoint (`src/webhook.ts`)
- [x] Handle message events (text, post, image)
- [x] Implement encryption/decryption
- [x] Implement URL verification
- [x] Add group chat filtering

### Phase 7: Testing (Est: 2 hours) ✅ COMPLETE

- [x] Write unit tests for queue (13 tests)
- [x] Write unit tests for card builder (21 tests)
- [x] Write webhook tests (8 tests)
- [x] Write integration tests (8 tests)
- [x] All 50 tests passing!

### Phase 8: Documentation (Est: 1 hour) ✅ COMPLETE

- [x] Write comprehensive README
- [x] Write configuration guide
- [x] Write architecture documentation
- [ ] Write troubleshooting guide (deferred to later)

### Phase 9: Migration & Verification (Est: 1 hour) 🚧 IN PROGRESS

- [ ] Register plugin locally
- [ ] Migrate from bridge to plugin
- [ ] Comprehensive smoke testing
- [ ] Verify no message loss
- [ ] Performance testing

---

## 🔑 Key Files to Port

### From `bridge-webhook.mjs`:
- Webhook event handling
- Image download logic
- Post content parsing
- Card building
- Message type selection
- Group chat filtering
- Encryption/decryption

### From `queue.mjs`:
- SQLite schema
- Inbound queue operations
- Outbound queue operations
- Deduplication logic
- Exponential backoff
- Stats and cleanup

---

## 📋 ChannelPlugin Interface Requirements

Based on Telegram implementation, need to implement:

```typescript
interface ChannelPlugin {
  id: string;
  meta: ChannelMeta;
  capabilities: ChannelCapabilities;
  configSchema: object;
  
  // Account management
  config: {
    listAccountIds: (cfg) => string[];
    resolveAccount: (cfg, accountId) => ResolvedAccount;
    defaultAccountId: (cfg) => string;
    isConfigured: (account) => boolean;
    // ... etc
  };
  
  // Security
  security: {
    resolveDmPolicy: () => DmPolicy;
    collectWarnings: () => string[];
  };
  
  // Messaging
  messaging: {
    normalizeTarget: (target) => NormalizedTarget;
    targetResolver: { looksLikeId, hint };
  };
  
  // Outbound delivery
  outbound: {
    deliveryMode: 'direct';
    sendText: async () => SendResult;
    sendMedia: async () => SendResult;
    // ... etc
  };
  
  // Gateway lifecycle
  gateway: {
    startAccount: async (ctx) => void;
    // ... etc
  };
  
  // Status
  status: {
    buildAccountSnapshot: () => Snapshot;
    collectStatusIssues: () => Issue[];
  };
}
```

---

## 🧪 Testing Strategy

### Unit Tests
- Queue operations (enqueue, dequeue, retry, complete)
- Card builder (colors, formatting, truncation)
- Config validation

### Integration Tests
- Webhook → Queue → Processing flow
- API client with mock server
- Full message lifecycle

### End-to-End Tests
- Real Lark API calls (with test bot)
- Message delivery verification
- Error recovery testing

---

## 📝 Migration Checklist

Before declaring migration complete:

- [ ] All incoming Lark messages processed
- [ ] All outgoing messages delivered
- [ ] Image attachments working
- [ ] Group chat mentions working
- [ ] Cards rendering correctly
- [ ] Queue persistence verified
- [ ] Retry logic verified
- [ ] No message loss under load
- [ ] Bridge service can be disabled
- [ ] Logs clean (no errors/warnings)

---

## ⚠️ Risk Mitigation

### Message Loss Prevention
1. **Persist immediately** on webhook receipt
2. **Unlimited retries** with exponential backoff
3. **Deduplication** to prevent double-send
4. **WAL mode** for SQLite durability
5. **Graceful shutdown** handling

### Error Handling
1. API rate limiting → exponential backoff
2. Token expiry → automatic refresh
3. Network errors → retry with backoff
4. Invalid payload → log and skip (don't crash)

---

## 🚀 Success Criteria

1. ✅ Plugin loads without errors
2. ✅ Messages from Lark reach OpenClaw
3. ✅ Responses from OpenClaw reach Lark
4. ✅ Images work bidirectionally
5. ✅ Cards render with correct formatting
6. ✅ Queue persists across restarts
7. ✅ Retries work for failed deliveries
8. ✅ No messages lost in 24-hour test
9. ✅ Tests pass (unit + integration)
10. ✅ Documentation complete

---

## 📅 Timeline

| Phase | Estimated Duration |
|-------|-------------------|
| Phase 1: Foundation | 1-2 hours |
| Phase 2: Queue System | 1-2 hours |
| Phase 3: API Client | 1 hour |
| Phase 4: Card Builder | 30 min |
| Phase 5: Channel Plugin | 2 hours |
| Phase 6: Webhook Handler | 1 hour |
| Phase 7: Testing | 2 hours |
| Phase 8: Documentation | 1 hour |
| Phase 9: Migration | 1 hour |
| **Total** | **~10-12 hours** |

---

*Created: 2026-02-02*
*Status: IN PROGRESS*
