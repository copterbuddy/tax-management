# CLAUDE.md — Thai Tax Tracker

> **อ่านทุก session** — ไฟล์นี้ควบคุมพฤติกรรมของ Claude Code ในโปรเจคนี้

---

## 🤖 วิธีทำงาน — ใช้ Agent เป็นเครื่องมือ

**คุณคือ Claude Code — คุยกับผู้ใช้โดยตรง ไม่ต้องสวมบทบาท**

เมื่อผู้ใช้ต้องการทำงาน ให้ spawn agent ที่เหมาะสมเป็น subagent โดย agent แต่ละตัวมี system prompt ของตัวเองอยู่แล้ว (ใน `.claude/agents/`) — agent จะทำตามหน้าที่ของมันโดยอัตโนมัติ

```
👤 ผู้ใช้ (User)
  │
  ├── คุยกับ Claude Code โดยตรง — ไม่มี BA คั่นกลาง
  │
  └── Claude Code spawn agent ตามประเภทงาน:
        ├── 🧑‍💼 BA   → วิเคราะห์ requirement, เขียน spec, คิด edge cases
        ├── 🎨 UX   → ออกแบบ UI/UX, เขียน design spec
        ├── 💻 Dev  → เขียนโค้ดตาม spec
        └── 🧪 QA   → เขียน test cases, รันทดสอบ
```

### Agent ไหนใช้เมื่อไหร่

| งาน | ใช้ Agent | หมายเหตุ |
|---|---|---|
| วิเคราะห์ requirement / เขียน spec / คิด feature | `ba` | BA รับ requirement → เขียน spec + AC + Edge Cases |
| ออกแบบ UI / layout / component / screen | `ux` | UX ออกแบบตาม spec → เขียน design files |
| เขียนโค้ด / แก้บั๊ก / implement feature | `dev` | Dev เขียนโค้ดตาม spec → `tsc --noEmit` ต้องผ่าน |
| ทดสอบ / เขียน test cases / ตรวจสอบ | `qa` | QA ทดสอบตาม AC → บันทึกผล |
| ค้นหาข้อมูล / อ่านไฟล์หลาย ๆ ที่ | `Explore` หรือ `general-purpose` | ใช้หาข้อมูล ไม่ใช่ทำงานเฉพาะทาง |

### 🔴 กฎ Agent Lifecycle — ต้องรายงานสถานะทุกครั้ง ห้ามละเลย

ทุกครั้งที่ spawn agent และทุกครั้งที่ agent จบการทำงาน — **คุณต้องรายงานให้ผู้ใช้รู้ทันที**

```
🟢 SPAWN  → แจ้งทันที: "🟢 [agent] เริ่มทำงาน: <ทำอะไร>"
🔴 COMPLETE → แจ้งทันที: "🔴 [agent] เสร็จ: <ผลลัพธ์สั้น ๆ>"
```

| Event | รูปแบบการรายงาน | ตัวอย่าง |
|---|---|---|
| Spawn agent | `🟢 [ชื่อ agent] started — <งานที่ทำ>` | `🟢 BA started — วิเคราะห์ requirement TASK-015` |
| Agent สำเร็จ | `✅ [ชื่อ agent] done — <ผลลัพธ์>` | `✅ BA done — spec TASK-015 เขียนเสร็จ` |
| Agent ล้มเหลว | `❌ [ชื่อ agent] failed — <สาเหตุ>` | `❌ Dev failed — tsc --noEmit มี error` |
| Spawn พร้อมกันหลายตัว | แจ้งจำนวน + ชื่อ | `🟢 Spawned 3 agents: BA, UX, QA` |
| ทุกตัวจบ | สรุปผลรวม | `✅ All agents done — 3/3 passed` |

**🔴 ห้าม spawn agent โดยไม่รายงาน — ผู้ใช้ต้องรู้ตลอดว่าใครทำงานอยู่**

### หลักการสำคัญ

- **คุณเป็นคนตัดสินใจ** ว่าจะ spawn agent ตัวไหน — ไม่ต้องถามผู้ใช้ก่อน
- **agent รับผิดชอบงานของตัวเอง** — system prompt ของมันกำหนดขอบเขตไว้แล้ว
- **ทำงานแบบ sequential หรือ parallel ก็ได้** — งานอิสระ spawn พร้อมกันได้
- **ถามผู้ใช้เมื่อจำเป็น** — requirement ไม่ชัด, ต้องการตัดสินใจ, PR พร้อม review

---

## 📊 Project Overview

**ระบบคำนวณภาษีสำหรับนักลงทุนรายบุคคล (ไทย)**

- บันทึกรายการซื้อขายหุ้นต่างประเทศและคริปโต
- คำนวณกำไร/ขาดทุนด้วยวิธี FIFO (แยก pool ตาม symbol + provider)
- แสดงผลสรุปภาษีรายปี
- **Tech Stack:** React 19 + TypeScript 6 + Vite 8 + Redux Toolkit

---

## 📂 Agent Files

| Agent | ไฟล์ | Model | ใช้สำหรับ |
|---|---|---|---|
| 🧑‍💼 BA | `.claude/agents/ba.md` | `sonnet` → deepseek-v4-pro | วิเคราะห์ requirement, เขียน spec |
| 🎨 UX | `.claude/agents/ux.md` | `haiku` → deepseek-v4-flash | ออกแบบ UI/UX |
| 💻 Dev | `.claude/agents/dev.md` | `haiku` → deepseek-v4-flash | เขียนโค้ด |
| 🧪 QA | `.claude/agents/qa.md` | `haiku` → deepseek-v4-flash | ทดสอบ |

---

## 📂 Reference Files

| ไฟล์ | ใช้เมื่อไหร่ |
|---|---|
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
- **Agent model mapping** — ดู `C:\Users\kunan\.claude\settings.json` (global config)

---

## 📝 Session Start

ทุก session:
1. อ่าน `docs/tasks.md` — มีงานอะไรค้างอยู่
2. ผู้ใช้คุยกับคุณโดยตรง — ไม่ต้องสวมบทบาท
3. spawn agent ตามประเภทงาน — agent จัดการเองตาม system prompt
