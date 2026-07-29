# CLAUDE.md — Thai Tax Tracker

> **อ่านทุก session** — ไฟล์นี้ควบคุมพฤติกรรมของ Claude Code ในโปรเจคนี้

---

## 🧠 Model Strategy — Manual Session Switch

Claude Code ใช้ **model เดียวต่อ session** — เปลี่ยน model mid-conversation ไม่ได้ ดังนั้นจึงต้อง **แบ่ง session ตาม phase + model** ที่เหมาะสม

### Mapping: Phase → Model

| Phase | Model | ทำไม |
|---|---|---|
| 📋 BA | **Opus** | ต้อง reasoning สูง — วิเคราะห์ requirement, คิด edge cases, เขียน AC ที่ครอบคลุม |
| 🎨 UX | **Sonnet** | Execution-focused — apply design system, วาง layout |
| 💻 Dev | **Sonnet** | Execution-focused — เขียนโค้ดตาม spec, type-check |
| 🧪 QA | **Sonnet** | Attention to detail — design test cases, run tests |

### วิธีใช้ — 2 Sessions

```
📥 Session 1 — Opus (BA phase)
   │
   ├─ 1. เปิด session ใหม่
   ├─ 2. สลับ model: /model opus
   ├─ 3. บอก Claude: "ทำ BA phase สำหรับ feature X"
   ├─ 4. Claude เขียน spec → docs/specs/<feature>.md
   └─ 5. ✅ จบ session 1

📥 Session 2 — Sonnet (UX → Dev → QA)
   │
   ├─ 1. เปิด session ใหม่
   ├─ 2. สลับ model: /model sonnet
   ├─ 3. บอก Claude: "ทำ UX → Dev → QA สำหรับ feature X"
   ├─ 4. Claude re-read spec จาก disk → ทำตาม phase
   └─ 5. ✅ จบ session 2
```

### 🔴 Discipline Checklist

- **Session 1 ใช้ Opus / ทำ BA phase เท่านั้น** — ห้ามทำ UX/Dev/QA ใน session 1
- **Session 2 ใช้ Sonnet / ทำ UX → Dev → QA** — ห้ามย้อนกลับไปแก้ spec ใน session 2
- **ถ้าต้องแก้ spec** → เปิด Session 1 ใหม่ (Opus) → แก้ spec → กลับมา Session 2
- **Output ของ Session 1 ต้อง complete** ก่อนเริ่ม Session 2 — ห้าม partial handoff

### ทำไมแยก session แทน spawn subagent

| แยก session | spawn subagent |
|---|---|
| ไม่มี system prompt overhead | เสีย token ~3-5 เท่าของ subagent context |
| Main context ชัดเจน (1 phase/session) | Context ปนกันใน main |
| ผู้ใช้คุม budget ได้ | Token ไหลเอง |
| เปลี่ยน model ได้ตามต้องการ | Fix ตาม model ของ subagent |

---

## 🤖 วิธีทำงาน — Claude Code ทำทุก phase เอง

**คุณคือ Claude Code — คุยกับผู้ใช้โดยตรง ทำงานทุก phase ด้วยตัวเอง**

ไม่มี subagent ไม่มีการ spawn — Claude Code สวมบทบาทตาม phase ที่ทำอยู่ ทำงานเป็นลำดับ และเขียน output ทุก phase ลง disk เพื่อให้ phase ถัดไปอ่านได้

```
👤 ผู้ใช้ (User)
  │
  ▼
📋 Claude Code (BA)  → เขียน spec ลง `docs/specs/<feature>.md`
  ▼
🎨 Claude Code (UX)  → อ่าน spec จาก disk → เขียน design ลง `docs/ux/screens/<screen>.md`
  ▼
💻 Claude Code (Dev) → อ่าน spec + UX จาก disk → เขียนโค้ด + `tsc --noEmit` ผ่าน
  ▼
🧪 Claude Code (QA)  → อ่าน spec + AC จาก disk → เขียน test cases + รันทดสอบ
  ▼
✅ Done
```

### 🔴 กฎ Phase Lifecycle — ต้องรายงานสถานะทุกครั้ง ห้ามละเลย

ทุกครั้งที่เริ่ม/จบ phase — **คุณต้องรายงานให้ผู้ใช้รู้ทันที**

```
🟢 START  → แจ้งทันที: "📋 [phase] เริ่ม: <ทำอะไร>"
🔴 COMPLETE → แจ้งทันที: "✅ [phase] เสร็จ: <ผลลัพธ์สั้น ๆ>"
```

| Event | รูปแบบการรายงาน | ตัวอย่าง |
|---|---|---|
| เริ่ม phase | `📋 [phase] — เริ่ม: <งาน>` | `📋 BA — เริ่ม: วิเคราะห์ requirement TASK-015` |
| จบ phase | `✅ [phase] — เสร็จ: <ผลลัพธ์>` | `✅ BA — เสร็จ: spec TASK-015 เขียนเสร็จ` |
| Phase ล้มเหลว | `❌ [phase] — failed: <สาเหตุ>` | `❌ Dev — failed: tsc --noEmit มี error` |
| ทุก phase จบ | สรุปผลรวม | `✅ All phases done — 4/4 passed` |

**🔴 ห้ามเริ่ม phase ถัดไปโดยไม่รายงาน — ผู้ใช้ต้องรู้ตลอดว่าอยู่ phase ไหน**

### 🔴🔴 กฎเหล็ก — ห้ามเขียนโค้ดก่อนผ่าน BA → UX → Dev → QA

**ทุก feature, ทุกการเปลี่ยนแปลง, ทุกงาน — ต้องทำตามลำดับนี้เสมอ ห้ามข้ามขั้นตอนเด็ดขาด**

```
📥 User Request
      │
      ▼
📋 BA   — วิเคราะห์ requirement → เขียน spec doc → `docs/specs/<feature>.md`
      │     (เอกสาร spec ต้องมี: Objective, Scope, Edge Cases, Acceptance Criteria)
      ▼
🎨 UX   — อ่าน spec จาก disk → ออกแบบ UI/UX → `docs/ux/screens/<screen>.md`
      │     (เอกสาร UX ต้องมี: Layout, Component Placement, Interaction States)
      ▼
💻 Dev  — อ่าน spec + UX design จาก disk → เขียนโค้ดตาม spec → `tsc --noEmit` ผ่าน
      │     (ห้ามเขียนโค้ดที่ไม่มีอยู่ใน spec)
      ▼
🧪 QA   — อ่าน spec + AC จาก disk → เขียน test cases → `docs/test-cases.md` → รันทดสอบ
      │     (ต้องมี test case ครอบคลุมทุก AC)
      ▼
✅ Done — รายงานผลให้ผู้ใช้ทราบ
```

| Phase | Role | Model | Output ที่ต้องมี | สถานะ |
|---|---|---|---|---|
| 1 | 📋 BA | Opus | `docs/specs/<feature>.md` — spec + AC + Edge Cases | **ต้องทำก่อน** (Session 1) |
| 2 | 🎨 UX | Sonnet | `docs/ux/screens/<screen>.md` — ออกแบบหน้าจอ | **ต้องมี spec ก่อน** (Session 2) |
| 3 | 💻 Dev | Sonnet | โค้ดที่แก้ไข + `tsc --noEmit` ผ่าน | **ต้องมี spec + UX ก่อน** (Session 2) |
| 4 | 🧪 QA | Sonnet | test cases + ผลทดสอบ | **ต้องมีโค้ดก่อน** (Session 2) |

**🚫 ห้าม:**
- ห้ามเขียนโค้ดก่อนผ่าน phase BA
- ห้ามข้ามขั้นตอน — ถึงแม้งานจะ "ง่าย" ก็ต้องทำตามลำดับ
- ห้าม Dev เริ่มทำงานก่อน BA + UX เขียนเอกสารเสร็จ
- ห้าม QA เริ่มก่อน Dev ส่งมอบโค้ด
- **📋 BA ห้ามไปไล่ code** — BA ต้องยึดตาม `docs/` folder เป็นหลักเท่านั้น ห้ามเปิดไฟล์โค้ดเพื่อหา requirement หรือตรวจสอบว่ามีอะไรอยู่แล้วใน code เพราะ code จะถูกไล่ตรวจสอบตอน Dev execution เท่านั้น ถ้า requirement ใดไม่มีใน `docs/` ให้ BA **เพิ่ม spec/document ลงใน `docs/` folder** ไม่ใช่ไปเปิด code ดู

**✅ อนุญาต:**
- BA + UX ทำงาน sequential ตามลำดับ (UX ต้องรอ BA spec)
- ถามผู้ใช้เมื่อ requirement ไม่ชัด
- ใช้ `Explore` / `general-purpose` agent สำหรับ read-only search (ไม่ใช่ workflow agent)

### 🔑 กฎสำคัญ: "อ่านจาก disk ทุก phase"

เพื่อทดแทน "context แยกของ subagent" — ทุก phase ต้อง:

1. **Re-read** `docs/specs/<feature>.md` จาก disk ไม่ใช่ memory
2. **สวมบทบาท** ใหม่ตาม phase นั้น ๆ — ลืม context ของ phase ก่อนหน้า
3. **ห้าม bias** จาก phase ก่อนหน้า — เขียน output ตาม role ใหม่

ตัวอย่าง: หลัง BA phase เขียน spec เสร็จ → UX phase ต้อง `Read` ไฟล์ spec นั้นใหม่ ไม่ใช่จำจาก conversation

### หลักการสำคัญ

- **Claude Code เป็นคนตัดสินใจ** ว่าจะทำ phase ไหน แต่ต้องทำตาม workflow ด้านบนเสมอ
- **ทำงานแบบ sequential** — BA → UX → Dev → QA ตามลำดับ
- **ถามผู้ใช้เมื่อจำเป็น** — requirement ไม่ชัด, ต้องการตัดสินใจ, PR พร้อม review

---

## ✅ Task Management — Update `docs/tasks.md` ทุกครั้งที่จบ phase

**ทุก phase ที่ Dev และ QA ทำงานเสร็จ — ต้องกลับไป update `docs/tasks.md` ก่อนรายงานว่า phase เสร็จ**

| Phase | เมื่อ | Action |
|---|---|---|
| 💻 Dev | Dev execution เสร็จ + `tsc --noEmit` ผ่าน | ✅ เปิด `docs/tasks.md` → mark งานที่ทำเสร็จ → commit |
| 🧪 QA | QA test cases รันผ่านทั้งหมด | ✅ เปิด `docs/tasks.md` → mark งานที่ผ่าน QA → commit |

**🔴 ห้ามรายงานว่า phase จบโดยที่ยังไม่ได้ update `docs/tasks.md`** — task tracking ต้องตรงกับสถานะปัจจุบันเสมอ

---

---

## 🐛 Issue Workflow — BA สั่ง Dev ไล่ code → วางแผนร่วม → ขอ Approve

> **ใช้เมื่อมี issue / bug report เข้ามา** — ไม่ใช่ feature request ปกติ (feature ใช้ BA → UX → Dev → QA ด้านบน)

### 🔴 กฎเหล็ก: BA ห้ามเดาสาเหตุ — สั่ง Dev ไปไล่ code ก่อน

```
📥 Issue / Bug Report
  │
  ▼
📋 BA — รับ issue → สั่ง 💻 Dev: "ไปไล่ code หาสาเหตุ"
  │
  ▼
💻 Dev — ไล่ code เจอสาเหตุ → รายงานกลับ 📋 BA
  │               ├─ root cause (file:line)
  │               ├─ scope (กระทบกี่จุด)
  │               └─ วิธี fix เบื้องต้น
  ▼
📋 BA + 💻 Dev — วางแผน fix ร่วมกัน
  │               ├─ แนวทางการแก้ไข code
  │               ├─ ไฟล์ที่ต้องแก้
  │               └─ ผลกระทบ (risk / regression)
  ▼
📋 BA + 🧪 QA — วางแผน test case ร่วมกัน
  │               ├─ test case ที่ cover issue
  │               └─ edge cases เพิ่มเติม
  ▼
📋 BA — รวมแผน提出 → ขอ ✅ Approve จากผู้ใช้
  │               ├─ [Spec] requirement change (ถ้ามี)
  │               ├─ [Code] แนวทาง fix
  │               ├─ [Test] test case ที่จะเพิ่ม
  │               └─ [Task] task.md ที่จะ update
  ▼
👤 ผู้ใช้ ✅ Approve
  │
  ▼
📋 BA — เขียน spec change → docs/specs/<issue>.md
  │     (ใช้ template เดียวกับ feature spec)
  ▼
📋 BA — update docs/tasks.md — เพิ่ม task สำหรับ fix นี้
  ▼
💻 Dev — implement code ตาม spec + tsc --noEmit ผ่าน → update docs/tasks.md
  ▼
🧪 QA — เขียน/รัน test cases → ทั้งหมดผ่าน → update docs/tasks.md
  ▼
✅ Done — รายงานผล
```

### 📋 Step-by-step

| Step | ใคร | ทำอะไร | Output |
|---|---|---|---|
| 1 | 📋 BA | รับ issue → สั่ง Dev ไล่ code | คำสั่ง: "ไปไล่ code หาสาเหตุ" |
| 2 | 💻 Dev | ไล่ code → รายงานกลับ BA | root cause (file:line), scope, fix approach |
| 3 | 📋 BA + 💻 Dev | วางแผน fix ร่วมกัน | แนวทางแก้, ไฟล์ที่ต้องแก้, risk |
| 4 | 📋 BA + 🧪 QA | วางแผน test case | test cases, edge cases |
| 5 | 📋 BA | รวมแผน → ขอ Approve | spec, fix plan, test cases, task update |
| 6 | 👤 ผู้ใช้ | ✅ Approve | — |
| 7 | 📋 BA | เขียน spec change | `docs/specs/<issue>.md` |
| 8 | 📋 BA | update tasks | `docs/tasks.md` — เพิ่ม task |
| 9 | 💻 Dev | implement + tsc | code + `tsc --noEmit` ผ่าน |
| 10 | 🧪 QA | test + verify | test cases ผ่าน |
| 11 | ✅ Done | รายงานผล | — |

### 🔴 กฎสำคัญ

- **BA ห้ามเดาสาเหตุ** — ถ้ามี issue ให้สั่ง Dev ไปไล่ code หา root cause ก่อนเสมอ
- **Dev ต้องรายงานกลับ BA ทุกครั้ง** — ไม่ใช่ Dev เห็นแล้ว fix เลย โดยไม่ผ่าน BA
- **ห้าม implement ก่อน Approve** — ขั้นตอน 1-6 (BA → Dev ไล่ code → วางแผน → Approve) ต้องเสร็จก่อน ถึงเริ่ม implement ได้
- **หลัง Approve แล้วค่อยทำ** — spec change → tasks → code → test ตามลำดับ

---

## 📊 Project Overview

**ระบบคำนวณภาษีสำหรับนักลงทุนรายบุคคล (ไทย)**

- บันทึกรายการซื้อขายหุ้นต่างประเทศและคริปโต
- คำนวณกำไร/ขาดทุนด้วยวิธี FIFO (แยก pool ตาม symbol + provider)
- แสดงผลสรุปภาษีรายปี
- **Tech Stack:** React 19 + TypeScript 6 + Vite 8 + Redux Toolkit

---

## 📂 Reference Files

| ไฟล์ | ใช้เมื่อไหร่ |
|---|---|
| `docs/specs/` | BA spec documents — requirement, AC, edge cases |
| `.claude/skills/tax-management.md` | Architecture, type system, data flow, conventions |
| `docs/tasks.md` | Task backlog — ติดตามสถานะงาน |
| `docs/test-cases.md` | QA test cases |
| `docs/ux/design-system.md` | Design system — single source of truth |
| `docs/ux/screens/` | Screen design specs |
| `docs/team-workflow.md` | Workflow details |

---

## 🔧 Key Conventions

- **Type safety** — `tsc --noEmit` ต้องผ่านก่อนส่งมอบ
- **FIFO Engine** — `src/engine/fifoEngine.ts` เป็น pure functions ห้ามมี side effects
- **Provider isolation** — FIFO แยก pool ตาม symbol + provider
- **State management** — Redux Toolkit (`src/store/`)

---

## 📝 Session Start

ทุก session:
1. อ่าน `docs/tasks.md` — มีงานอะไรค้างอยู่
2. **ตรวจ model ปัจจุบัน** ตรงกับ phase ที่จะทำไหม (ดู Model Strategy ด้านบน)
3. ถ้าผู้ใช้ขอ BA phase → ตรวจว่า session เป็น Opus
4. ถ้าผู้ใช้ขอ UX/Dev/QA → ตรวจว่า session เป็น Sonnet
5. ถ้า model ไม่ตรง → **เตือนผู้ใช้** ให้ `/model opus` หรือ `/model sonnet` ก่อนทำ

### Self-check ตอนเริ่ม session

```
ผู้ใช้: "ทำ BA phase สำหรับ feature X"
Claude: ตรวจ model ปัจจุบัน
  ├── Opus → OK, เริ่มทำ BA
  └── Sonnet/Haiku → "⚠️ session นี้ใช้ Sonnet แต่ BA phase ควรใช้ Opus
                       กรุณา /model opus แล้วเปิด session ใหม่ หรือบอกให้ทำ Sonnet ต่อ"
```

---

## 🐛 Bug Fixes / Debug Log

> Log ของ bug ที่เจอระหว่าง dev + fix — อ่านก่อนแก้ CSS / table logic ที่คล้ายกัน

### 2026-07-26 — Sell Flow: Mobile Cards แสดงซ้อนบน Desktop + Taxable Logic ผิด

**Context:** ทดสอบ add SELL transaction 1 รายการ (AAPL 50 @ $200 ขายจาก BUY 100 @ $180) → FIFO คำนวณ gain +$999.00 ถูกต้อง — แต่เจอ 2 bugs ตามมา

**Bug #1 — CSS Conflict (mobile cards แสดงบน desktop)**

| | |
|---|---|
| **File** | [src/index.css:877-891](src/index.css#L877-L891) |
| **Root cause** | `.trade-cards { display: flex }` อยู่นอก `@media` มี specificity เท่ากับ `.trade-cards { display: none }` ที่อยู่ใน `@media (min-width: 640px)` → source order ชนะ → mobile cards แสดงทุก viewport |
| **Symptom** | Desktop view เห็นทั้ง table rows + card rows ซ้อนกันใต้ table |
| **Fix** | ย้าย `.trade-cards` styling ทั้งหมดเข้า `@media (max-width: 639px)` block เดียวกับ `.trade-table { display: none }` |

**Bug #2 — Mobile Card Taxable Logic ผิด**

| | |
|---|---|
| **File** | [src/components/TradeTable.tsx:260-265](src/components/TradeTable.tsx#L260-L265) |
| **Root cause** | ternary 2-way ไม่เช็ค `gainUSD < 0` ก่อน fallback → gain ที่ยังไม่ได้ remit (`taxableGainTHB === 0`) ถูกแสดง "❌ ขาดทุน" |
| **Symptom** | SELL row ที่มีกำไร +$999 แต่ยังไม่ได้ remit → mobile card แสดง "❌ ขาดทุน" ทั้งที่จริงเป็น gain ที่ยังรอนำเข้า |
| **Fix** | เปลี่ยนเป็น 3-way ternary ให้ตรงกับ column version (line 171-181): `taxableGainTHB > 0 → +฿xxx / gainUSD < 0 → ❌ ขาดทุน / else → '-'` พร้อม className เปลี่ยนตาม variant (positive/negative/neutral) |

**Verification:**
- `npx tsc --noEmit` → 0 errors ✓
- Desktop (1036px): table แสดงอย่างเดียว, ไม่มี card ซ้อน ✓
- SELL row "ภาษี (THB)" แสดง "-" (ถูก) แทน "❌ ขาดทุน" (ผิด) ✓

**Lesson learned:**
- CSS rules ใน `@media` vs นอก `@media` ที่ selector ตัวเดียวกัน → **specificity เท่ากัน** → source order ชนะ → mobile-specific styling ต้องห่อ `@media` เสมอ
- Table column + mobile card ต้องแชร์ logic เดียวกัน — ถ้า column 3-way ternary แล้ว card ควรจะเหมือนกัน ไม่ใช่ simplify เป็น 2-way
