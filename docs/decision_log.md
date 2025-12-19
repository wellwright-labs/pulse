# Decision Log

Architectural and design decisions for Devex, with rationale.

---

## 001: Use Date objects in TypeScript types

**Date**: 2025-01-13
**Status**: Accepted

### Context

The spec originally used `string` (ISO 8601 format) for all datetime fields. This works for JSON serialization but provides no type safety for date operations.

### Decision

Use `Date` objects in all runtime TypeScript types. The storage layer handles serialization:
- Writing: `Date` → ISO string via JSON replacer
- Reading: ISO string → `Date` via JSON reviver

### Consequences

**Positive**:
- Better type safety — can't accidentally pass a non-date string
- Native date operations without parsing (comparisons, day calculations)
- IDE autocomplete shows Date methods

**Negative**:
- Must be careful that date strings like `"2025-01-15"` (YYYY-MM-DD for file names) are NOT converted
- ISO pattern detection in reviver could theoretically have false positives (unlikely in practice)

### Implementation

- Added `dateReviver` and `dateReplacer` functions to `storage.ts`
- Pattern matches: `YYYY-MM-DDTHH:mm:ss.sssZ` or `YYYY-MM-DDTHH:mm:ssZ`
- Does NOT match date-only strings like `"2025-01-15"` (used for file names)

---

## 002: Remove in-repo mode

**Date**: 2025-01-13
**Status**: Accepted

### Context

The original spec included an "in-repo mode" (`devex init --in-repo`) that would:
- Create a `.devex/` directory in the current repo
- Add it to `.gitignore`
- Link that experiment to the repo's git history for metrics

### Decision

Remove in-repo mode entirely. All experiments live in `~/.config/devex/`.

### Rationale

1. **Adds complexity for marginal benefit**: Users can already configure repositories for git metrics via `devex config add repos <path>`. In-repo mode just changes where data is stored.

2. **Data locality is a false benefit**: Having experiment data in the repo sounds appealing but:
   - It clutters the repo with a `.devex/` directory
   - Data still shouldn't be committed (sensitive reflections)
   - Makes experiments harder to find/manage if scattered across repos

3. **Simpler mental model**: One location for all Devex data. Users don't have to remember where each experiment lives.

4. **Easier to implement**: No need to handle two data location modes, no path resolution complexity, no `.gitignore` manipulation.

### Consequences

**Positive**:
- Simpler codebase
- Single source of truth for all experiment data
- Easier backup (one directory)
- Removed ~15 lines from spec, reduced risk area in plan

**Negative**:
- Can't keep experiment data "with" a specific project
- Users who wanted this feature won't have it (but can revisit if demand emerges)

### Migration

None needed — feature was never implemented.

---

## 003: No explicit "end experiment" concept

**Date**: 2025-01-19
**Status**: Accepted

### Context

During Milestone 6 planning, we considered whether experiments should have an explicit end state or lifecycle.

### Decision

Experiments do not have an "end" state. They are simply collections of blocks that can grow indefinitely.

### Rationale

1. **Experiments are ongoing**: A developer might run the same experiment (e.g., "AI-assisted coding") multiple times over months or years, adding blocks as they revisit the question.

2. **Blocks are the unit of completion**: Each block has a clear start and end. The experiment is just the container for related blocks.

3. **Simplicity**: Adding experiment lifecycle states (active, paused, completed, archived) adds complexity without clear benefit. Users can simply stop adding blocks to an experiment they're done with.

4. **Data preservation**: Without an "end" state, there's no risk of accidentally closing an experiment and losing the ability to add more data.

### Consequences

**Positive**:
- Simpler mental model
- Experiments remain available for new blocks indefinitely
- No migration needed if we later add lifecycle states

**Negative**:
- No way to "archive" old experiments from cluttering the namespace
- `experiment list` (when implemented) will show all experiments equally

### Future consideration

If users request it, we could add an optional `archived: boolean` field to experiments for filtering in list views, without changing the core model.
