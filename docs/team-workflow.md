# 🤖 Team Workflow — BA → UX → Dev → QA

> **Purpose:** Document how the 4-agent team collaborates on Thai Tax Tracker.  
> **Agents:** BA (Business Analyst), UX (UX/UI Designer), Dev (Developer), QA (Quality Assurance)

---

## 🔄 The Workflow

```
User / Stakeholder
       │
       │  "I want feature X"
       ▼
┌─────────────────────────────────────────────┐
│ 🧑‍💼 BA (Business Analyst)                    │
│                                             │
│ 1. Read existing code (understand impact)   │
│ 2. Ask clarifying questions                 │
│ 3. Evaluate: Does this need UI design?      │
│    ├── Yes → Send UX Design Request         │
│    └── No  → Write spec directly            │
│ 4. Write Specification:                     │
│    • User Story                             │
│    • Acceptance Criteria                    │
│    • Technical Notes (files to change)      │
│    • Edge Cases                             │
│ 5. Validate: "Is this enough for Dev+QA?"  │
│                                             │
│ Output: SPEC + UX Design (ถ้ามี)            │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   │
┌────────────┐           │  ← BA สั่งเมื่อต้องการออกแบบ UI
│ 🎨 UX      │           │
│            │           │
│ 1. Read    │           │
│    design  │           │
│    request │           │
│ 2. Read    │           │
│    design  │           │
│    system  │           │
│ 3. Design  │           │
│    UX/UI   │           │
│ 4. Write   │           │
│    persist │           │
│    files   │           │
│ 5. Return  │           │
│    to BA   │           │
└──────┬─────┘           │
       │                 │
       └─────┬───────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
┌────────────┐  ┌──────────────┐
│ 💻 Dev     │  │ 🧪 QA        │
│            │  │              │
│ 1. Read    │  │ 1. Read spec │
│    spec    │  │ 2. Design    │
│ 2. Read    │  │    test      │
│    files   │  │    cases     │
│ 3. Write   │  │ 3. Run tests │
│    code    │  │ 4. Report    │
│ 4. Type-   │  │    results   │
│    check   │  │              │
│ 5. Ship    │  │              │
└──────┬─────┘  └──────┬───────┘
       │               │
       └───────┬───────┘
               │
               ▼
       ┌──────────────┐
       │ ✅ Done / 🔄  │
       │ Fix if QA     │
       │ found bugs    │
       └──────────────┘
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

| Gate | Check | Who |
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
| **Spec is unclear** | Dev/QA/UX asks BA — do NOT guess |
| **UX design conflicts with design system** | UX informs BA — BA decides |
| **Type error unresolved** | Dev escalates to BA |
| **Test fails** | QA reports to Dev with repro steps |
| **New edge case found** | BA updates spec → Dev adjusts → QA adds test |
| **Disagreement** | BA: final on requirements; UX: final on design; Dev: final on implementation; QA: veto on quality |
