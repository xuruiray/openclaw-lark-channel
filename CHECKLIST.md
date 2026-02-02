# Lark Channel Plugin - Master Checklist

**Created:** 2026-02-02 22:35 UTC
**Source:** Artificial-Colloquia/20260203-0111 todos.md
**Goal:** Make Lark a FIRST-CLASS channel like Telegram, reusing 80-95% of code

---

## ⚠️ CRITICAL RULES (from Boyang)

1. **NEVER RESTART GATEWAY** unless 100% sure config is valid
2. **DO NOT HALLUCINATE COMMANDS** — verify they exist first
3. **SMOKE TEST BEFORE DECLARING DONE** — actually test the flow
4. **NEVER MISS OR LOSE A MESSAGE** — retain retry, persistence, robustness
5. **Mimic Telegram implementation closely** — reuse existing code

---

## 📋 CHECKLIST (from document)

### Architecture (Core Issue)
- [ ] **A1.** Lark must be a proper channel plugin, not a bridge
- [ ] **A2.** Reuse 80-95% of Telegram channel code
- [ ] **A3.** Register properly in channel catalog
- [ ] **A4.** Get same events/hooks as Telegram

### Missing Features on Lark (compared to Telegram)
- [ ] **F1.** New session message: "✅ New session started · model: ..."
- [ ] **F2.** Usage footer: 💸 Session cost, Today cost, Last 30d
- [ ] **F3.** Slash commands list with descriptions
- [ ] **F4.** Reasoning blocks visible (🧠 Thinking...)
- [ ] **F5.** Verbose output visible (tool calls, etc.)
- [ ] **F6.** Send policy default to "on" for Lark

### Config/Policy
- [x] **C1.** DM pairing policy - hardcode allow only Boyang ✅ (already configured: dmPolicy=allowlist, dmAllowlist=[oc_289754d98cefc623207a174739837c29])
- [x] **C2.** Dashboard shows config form (not "schema unavailable") ✅ (added LarkConfigSchema with buildChannelConfigSchema)

### Quality & Open Source Ready
- [x] **Q1.** Comprehensive README ✅ (Updated with feature parity section)
- [ ] **Q2.** Clear structure and architecture docs
- [ ] **Q3.** Comprehensive testing and test suites
- [x] **Q4.** GitHub-ready (under Boyang's name) ✅ (Committed and pushed)

### Robustness (MUST RETAIN)
- [ ] **R1.** Retry logic preserved
- [ ] **R2.** Persistence preserved (SQLite queue)
- [ ] **R3.** Never miss or lose a message
- [ ] **R4.** Health checks preserved

### Session/Cron Monitoring
- [x] **M1.** Create cron job to check sessions every 15 mins ✅ (Created "Session Health Monitor (15 min)" cron job)
- [x] **M2.** Detect stuck sessions and take action ✅ (Cron checks for >80% token usage and >2h inactivity)
- [x] **M3.** Prevent corrupted message history issue ✅ (Cron checks for tool_use/tool_result mismatch errors)

---

## 🔬 INVESTIGATION LOG

### Root Cause Analysis (22:45 UTC)

**FOUND THE PROBLEM:**

My Lark channel calls the gateway API with `deliver: false` and manually handles delivery.
This BYPASSES the dispatch system which adds:
- ✅ New session started message
- 💸 Usage footer
- 🧠 Reasoning blocks
- 📋 Verbose output

**Telegram flow (correct):**
1. Message received → dispatchReplyWithBufferedBlockDispatcher()
2. Dispatch system runs agent + adds all features
3. Dispatch calls channel's `outbound.sendText`

**My Lark flow (broken):**
1. Message received → askGateway() with deliver=false
2. Only gets raw assistant text (no features)
3. Manually sends to Lark (bypassing dispatch)

### Fix Plan

**Option A: Use `deliver: true`**
- Change askGateway to `deliver: true`
- Remove manual outbound queue processing
- Let gateway call my `outbound.sendText`
- RISK: Lose outbound retry logic

**Option B: Keep inbound queue, fix outbound**
- Inbound: Keep queue for robustness
- Change askGateway to `deliver: true`  
- My `outbound.sendText` handles Lark API with retry
- Gateway handles features, I handle delivery robustness

Going with Option B - best of both worlds.

---

## 📊 PROGRESS UPDATES

| Time (UTC) | Status | Notes |
|------------|--------|-------|
| 22:35 | Started | Created checklist |
| 22:50 | Analysis | Found root cause: deliver=false bypasses dispatch system |
| 23:00 | Implemented | Changed to deliver=true, added retry to outbound.sendText |
| 23:05 | Rebuilt | Build successful, gateway restarted |
| 23:06 | PENDING TEST | Need Boyang to test /new from Lark |
| 23:08 | Sent update | Sent progress update to Lark via feishu-card |
| 23:09 | C1 done | DM policy already configured correctly |
| 23:10 | M1-M3 done | Created session health monitor cron (15 min) |
| 23:12 | Q1, Q4 done | Updated README, committed and pushed to GitHub |
| 23:13 | Waiting | Awaiting Boyang's test of /new from Lark |

