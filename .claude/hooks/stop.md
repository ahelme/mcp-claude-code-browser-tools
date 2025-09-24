# Stop Hook - Memory Bank Update

**Execute ALL applicable:**

```javascript
// 1. Mode - set current work type
mcp__memory-bank-mcp__switch_mode({ mode: "code|debug|architect" })

// 2. Decisions - log key technical choices made
mcp__memory-bank-mcp__log_decision({
  title: "Brief choice name",
  context: "Why needed",
  decision: "What chosen",
  alternatives: ["Other options"],
  consequences: ["Impact/tradeoffs"]
})

// 3. Product Progress - log feature/functionality changes
mcp__memory-bank-mcp__track_progress({
  action: "Feature/fix implemented",
  description: "What changed in product capabilities"
})

// 4. Implementation Progress - log technical work done
mcp__memory-bank-mcp__track_progress({
  action: "Technical work completed",
  description: "Code changes, refactoring, infrastructure: INCLUDE gh issue #s if any"
})

// 5. System Patterns - read/update if new patterns discovered
mcp__memory-bank-mcp__read_memory_bank_file({ filename: "system-patterns.md" })
// If patterns found, update with new insights

// 6. Active Context - current state for next session
mcp__memory-bank-mcp__update_active_context({
  tasks: ["Specific next actions"],
  issues: ["Blockers/problems"],
  nextSteps: ["Immediate priorities"]
})
```

**Requirements:**
- Dense info, no filler words
- Capture key details only
- Skip if nothing significant