# 03: Clarify Spec Review Sub-Agent Scope Boundary on Test Flakiness Fixes

**What to build:** Update `.agents/skills/code-review/SKILL.md` to refine the Spec Review sub-agent instructions. Clarify that when an originating spec or ticket explicitly mandates passing the entire test suite 100% green, bugfixes that eliminate pre-existing test flakiness or stabilize timing race conditions in modified files are within scope and must not be flagged as scope creep.

**Blocked by:** None (Frontier)
**Type:** task
**Status:** resolved

- [x] `.agents/skills/code-review/SKILL.md` includes explicit instructions for the Spec Reviewer regarding test stability fixes
- [x] Guidance distinguishes genuine scope creep (unrelated feature additions) from necessary test determinism bugfixes required to satisfy green suite acceptance criteria

## Answer

Updated `.agents/skills/code-review/SKILL.md` in the Spec Reviewer brief to explicitly define the boundary around test determinism and flakiness fixes. Specifically, when an originating spec or ticket mandates green test suite criteria, timing race condition fixes and harness stabilization in touched files are defined as within scope, preventing false-positive scope creep warnings while continuing to flag unrequested domain features.
