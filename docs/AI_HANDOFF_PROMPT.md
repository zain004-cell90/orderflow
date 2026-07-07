# AI Handoff Prompt

Copy this into a new Codex chat/account:

```text
I am continuing OrderFlow from another account. Read CODEX_CONTEXT.md, docs/PROJECT_STRUCTURE.md, docs/FEATURE_MAP.md, docs/SUPABASE_CONTEXT.md, docs/CURRENT_STATUS.md, docs/NEXT_TASKS.md, docs/BUGS_AND_RISKS.md, docs/DEPLOYMENT_NOTES.md, and docs/FILE_SUMMARY.md before making changes. After reading, summarize your understanding and ask me for the next task. Do not edit code yet.
```

Additional rules for the new Codex account:

- Do not redesign UI unless asked.
- Do not add features unless asked.
- Preserve the Supabase architecture.
- Keep migrations safe.
- Run checks before handing work back.

