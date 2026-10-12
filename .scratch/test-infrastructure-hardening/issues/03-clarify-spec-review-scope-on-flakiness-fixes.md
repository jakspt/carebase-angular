# 03: Clarify Spec Review Sub-Agent Scope Boundary on Test Flakiness Fixes

**What to build:** Update `.agents/skills/code-review/SKILL.md` to refine the Spec Review sub-agent instructions. Clarify that when an originating spec or ticket explicitly mandates passing the entire test suite 100% green, bugfixes that eliminate pre-existing test flakiness or stabilize timing race conditions in modified files are within scope and must not be flagged as scope creep.

**Blocked by:** None (Frontier)

**Status:** ready-for-agent

- [ ] `.agents/skills/code-review/SKILL.md` includes explicit instructions for the Spec Reviewer regarding test stability fixes
- [ ] Guidance distinguishes genuine scope creep (unrelated feature additions) from necessary test determinism bugfixes required to satisfy green suite acceptance criteria
