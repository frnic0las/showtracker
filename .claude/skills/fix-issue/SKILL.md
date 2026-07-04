---
name: fix-issue
description: Structured workflow for fixing a GitHub issue. Use when starting work on any issue.
---

## Steps

1. **Read the issue**: Understand the requirements, acceptance criteria, and scope
2. **Create a branch**: `git checkout -b fix/<issue-number>-short-description`
3. **Locate relevant code**: Use Grep/Glob to find related files
4. **Reproduce the bug** (if it's a bug): Understand the current behavior
5. **Write a failing test** (if applicable): Prove the bug exists
6. **Implement the fix**: Minimum changes needed
7. **Verify**:
   - `pnpm typecheck` passes
   - `pnpm lint` passes
   - `pnpm test` passes
   - Manual verification matches acceptance criteria
8. **Commit**: `fix(scope): description (closes #<issue-number>)`
9. **Self-review**: Re-read the diff — does every changed line trace to the issue?
