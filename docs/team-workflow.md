# 🤖 Team Workflow — BA → Dev → QA

> **Purpose:** Document how the 3-agent team collaborates on Thai Tax Tracker.  
> **Agents:** BA (Business Analyst), Dev (Developer), QA (Quality Assurance)

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
│ 3. Write Specification:                     │
│    • User Story                             │
│    • Acceptance Criteria                    │
│    • Technical Notes (files to change)      │
│    • Edge Cases                             │
│ 4. Validate: "Is this enough for Dev+QA?"   │
│                                             │
│ Output: SPEC.md (or inline spec)            │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┴─────────┐
     ▼                   ▼
┌────────────┐    ┌──────────────┐
│ 💻 Dev     │    │ 🧪 QA        │
│            │    │              │
│ 1. Read    │    │ 1. Read spec │
│    spec    │    │ 2. Design    │
│ 2. Read    │    │    test      │
│    files   │    │    cases     │
│ 3. Write   │    │ 3. Run tests │
│    code    │    │ 4. Report    │
│ 4. Type-   │    │    results   │
│    check   │    │              │
│ 5. Ship    │    │              │
└──────┬─────┘    └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
                ▼
        ┌──────────────┐
        │ ✅ Done / 🔄  │
        │ Fix if QA     │
        │ found bugs    │
        └──────────────┘
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
| **Type Check** | `npx tsc --noEmit` passes | Dev |
| **No Dead Code** | Removed imports cleaned up | Dev |
| **AC Coverage** | Every AC has ≥1 test case | QA |
| **All Tests Pass** | 100% pass or documented failures | QA |

---

## 🚨 Exception Handling

| Scenario | Protocol |
|---|---|
| **Spec is unclear** | Dev/QA asks BA — do NOT guess |
| **Type error unresolved** | Dev escalates to BA |
| **Test fails** | QA reports to Dev with repro steps |
| **New edge case found** | BA updates spec → Dev adjusts → QA adds test |
| **Disagreement** | BA: final on requirements; Dev: final on implementation; QA: veto on quality |
