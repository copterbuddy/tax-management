# 🤖 Team Workflow — BA → UX → Dev → QA

> **Purpose:** Document how the 4-phase workflow operates on Thai Tax Tracker.  
> **Execution model:** Claude Code handles all 4 phases sequentially with no subagent spawning.  
> **Model strategy:** Manual session switch — BA = Opus, UX/Dev/QA = Sonnet. See `CLAUDE.md`.

---

## 🧠 Model per Phase (Quick Reference)

| Phase | Model | Session |
|---|---|---|
| 📋 BA | Opus | Session 1 |
| 🎨 UX → 💻 Dev → 🧪 QA | Sonnet | Session 2 |

ดูรายละเอียดใน `CLAUDE.md` หัวข้อ "Model Strategy — Manual Session Switch"

---

## 🔄 The Workflow

```
User / Stakeholder
       │
       │  "I want feature X"
       ▼
┌─────────────────────────────────────────────┐
│ 📋 BA (Business Analyst)                    │
│  — Claude Code plays this role              │
│                                             │
│ 1. Read existing code (understand impact)   │
│ 2. Ask clarifying questions                 │
│ 3. Evaluate: Does this need UI design?      │
│    ├── Yes → Continue to UX phase           │
│    └── No  → Skip UX phase                  │
│ 4. Write Specification:                     │
│    • User Story                             │
│    • Acceptance Criteria                    │
│    • Technical Notes (files to change)      │
│    • Edge Cases                             │
│ 5. Validate: "Is this enough for Dev+QA?"  │
│                                             │
│ Output: SPEC → docs/specs/<feature>.md      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 🎨 UX (UX/UI Designer)                      │
│  — Claude Code plays this role              │
│                                             │
│ 1. RE-READ spec from disk (fresh perspective)│
│ 2. Read design system                       │
│ 3. Design UX/UI                             │
│ 4. Write persistent files                   │
│ 5. Validate: "Is this enough for Dev+QA?"  │
│                                             │
│ Output: Design Spec → docs/ux/screens/      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 💻 Dev (Developer)                          │
│  — Claude Code plays this role              │
│                                             │
│ 1. RE-READ spec + UX from disk              │
│ 2. Read existing files (study patterns)    │
│ 3. Write code                               │
│ 4. Type-check (tsc --noEmit)                │
│ 5. Hand off to QA                           │
│                                             │
│ Output: Code changes in src/                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ 🧪 QA (Quality Assurance)                   │
│  — Claude Code plays this role              │
│                                             │
│ 1. RE-READ spec + AC from disk              │
│ 2. Design test cases (every AC)             │
│ 3. Run tests                                │
│ 4. Report results                           │
│                                             │
│ Output: Test report → docs/test-cases.md    │
└──────────────┬──────────────────────────────┘
               │
               ▼
       ┌──────────────┐
       │ ✅ Done / 🔄  │
       │ Fix if QA     │
       │ found bugs    │
       └──────────────┘
```

---

## 🔑 Key Difference: Self-Execution Model

**ห้าม spawn subagent** — Claude Code ทำทุก phase เองใน main context

### How we keep each phase "fresh"

| Subagent model (เดิม) | Self-execution model (ใหม่) |
|---|---|
| แต่ละ phase มี context แยก = independent reasoning | Claude Code ต้อง **re-read spec จาก disk** ทุก phase |
| System prompt กำหนด role อัตโนมัติ | Claude Code ต้อง **สวมบทบาท** ใหม่ตาม phase |
| ไม่ bias จาก phase ก่อน | **ลืม context ของ phase ก่อนหน้า** โดย re-read |

### Discipline checklist (ทำทุก phase)

```
□ 1. Re-read input files from disk (ไม่ใช่ memory)
□ 2. Switch mental model to current phase role
□ 3. Produce output file matching phase template
□ 4. Report ผล (✅ complete / ❌ failed) ก่อนข้าม phase
□ 5. ห้ามข้าม phase โดยไม่มี output
```

---

## 📋 Handoff Format: BA → UX (UX Design Request)

```markdown
## 🎨 UX Design Request: <ชื่อ Feature>

### Context
- **Task:** TASK-XXX
- **Purpose:** <ผู้ใช้ต้องการทำอะไร>
- **User Persona:** <ใครคือผู้ใช้>

### What Needs Design
- [ ] หน้าจอใหม่: <ชื่อหน้าจอ> — <คำอธิบายสั้น>
- [ ] แก้ไขหน้าจอเดิม: <ชื่อหน้าจอ> — <สิ่งที่ต้องเปลี่ยน>
- [ ] Component ใหม่: <ชื่อ component> — <ใช้ที่ไหน>

### Key Requirements
1. <requirement 1>
2. <requirement 2>

### Existing Screens Affected
- <ชื่อหน้าจอ> — <ผลกระทบ>

### Constraints (ถ้ามี)
- <ข้อจำกัดด้านเทคนิค, design, หรืออื่น ๆ>
```

---

## 📋 Handoff Format: UX → BA (UX Design Spec)

```markdown
## 🎨 UX Design Spec: <ชื่อ Feature/Screen>

### Overview
- **Screen:** <ชื่อหน้าจอ>
- **Type:** 🆕 หน้าจอใหม่ / ✏️ แก้ไขหน้าจอเดิม
- **Related Task:** TASK-XXX

### Persistent Files Updated
| File | Action |
|---|---|

### Components Designed
| Component | Location | Key States |
|---|---|---|

### Dev Notes
- ...

### QA Notes
- ...
```

---

## 📋 Handoff Format: BA → Dev

```markdown
## 📋 Spec: [Feature Name]

| Requirement | Decision |
|---|---|
| ... | ... |

### ✅ Acceptance Criteria
| # | Condition |
|---|---|
| AC1 | ... |

### 🔧 Technical Notes
| File | Action |
|---|---|
| src/... | What to do |

### ⚠️ Edge Cases
| # | Case | Handling |
|---|---|---|
| EC1 | ... | ... |
```

---

## 📋 Handoff Format: Dev → QA

```markdown
## 💻 Dev — Implementation Summary

### Files Changed (N files)
| File | Action |
|---|---|

### SOLID Applied
| Principle | Where |
|---|---|

### Type Check
✅ tsc --noEmit: 0 errors
```

---

## 📋 Handoff Format: QA → Team

```markdown
## 🧪 QA — Test Report

### Summary
- Total: N | ✅ Pass: N | ❌ Fail: N

### Test Cases
| # | Requirement | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| 1 | AC1 | ... | ... | ... | ✅/❌ |

### Failed Tests Detail
- **TC3:** [description] — [what went wrong] — [suggested fix]
```

---

## 📐 Quality Gates

| Gate | Check | Role |
|---|---|---|
| **Spec Complete** | All ACs defined, edge cases covered | BA |
| **UX Design Complete** | Persistent files updated, all states designed, responsive covered | UX |
| **Type Check** | `npx tsc --noEmit` passes | Dev |
| **No Dead Code** | Removed imports cleaned up | Dev |
| **AC Coverage** | Every AC has ≥1 test case | QA |
| **All Tests Pass** | 100% pass or documented failures | QA |

---

## 🚨 Exception Handling

| Scenario | Protocol |
|---|---|
| **Spec is unclear** | Re-enter BA phase — do NOT guess |
| **UX design conflicts with design system** | Re-enter UX phase — fix design |
| **Type error unresolved** | Dev escalates → re-enter Dev phase |
| **Test fails** | QA reports → re-enter Dev phase with repro steps |
| **New edge case found** | Re-enter BA phase → update spec → re-do Dev + QA |
| **Disagreement** | BA: final on requirements; UX: final on design; Dev: final on implementation; QA: veto on quality |

> **Note:** "re-enter phase" หมายถึง Claude Code กลับไปทำ phase นั้นใหม่ ไม่ได้ spawn agent ใหม่
