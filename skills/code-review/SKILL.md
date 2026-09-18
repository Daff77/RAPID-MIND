---
name: code-review
description: Review committed and work-in-progress changes since a fixed point along independent Standards and Spec axes, plus a Frontend lane when UI changed. Runs applicable reviews in parallel and reports them side by side. Use for branches, pull requests, working-tree changes, or requests to "review since X".
---

Independent review lanes for the complete change surface since a fixed point the user supplies. The surface includes commits, staged changes, unstaged changes, and untracked files:

- **Standards** — does the code conform to this repo's documented coding standards?
- **Spec** — does the code faithfully implement the originating issue / spec?
- **Frontend** — when UI changed, does the rendered interface meet its design contract, responsive, interaction, accessibility, content, browser, and regression requirements?

Run every applicable lane in parallel so they do not pollute each other's context, then aggregate without allowing one lane to mask another.

The issue tracker should have been provided to you — run `/setup-universal-agent-skills` if `docs/agents/issue-tracker.md` is missing.

## Process

### 1. Pin the fixed point

Whatever the user said is the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`, etc. If `/implement` invoked this skill, use the `HEAD` it recorded before implementation. Otherwise, if the user did not specify one, ask for it.

Capture the review surface once with all of these:

- committed changes: `git diff <fixed-point>...HEAD`
- commits: `git log <fixed-point>..HEAD --oneline`
- staged changes relative to `HEAD`: `git diff --cached`
- unstaged tracked changes: `git diff`
- untracked files: `git ls-files --others --exclude-standard`, followed by direct inspection of each listed file

Before going further, confirm the fixed point resolves (`git rev-parse <fixed-point>`). Continue when any part of the combined surface is non-empty. A bad ref or wholly empty surface should fail here — not inside the parallel lanes.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in `docs/agents/issue-tracker.md`.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Anything in the repo that documents how code should be written, such as `CODING_STANDARDS.md` or `CONTRIBUTING.md`.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below — a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation — and, like any standard here, skip anything tooling already enforces.

Each smell reads *what it is* → *how to fix*; match it against the diff:

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Feature Envy** — a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn applicable lanes in parallel

**Standards sub-agent prompt** — include:

- Every review-surface command, the commit list, and the untracked-file manifest.
- The list of standards-source files you found in step 3, **plus the smell baseline from step 3** pasted in full — the sub-agent has no other access to it.
- The brief: "Report — per file/hunk where relevant — (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** — include:

- Every review-surface command, the commit list, and the untracked-file manifest.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

**Frontend sub-agent prompt** — include when the diff changes frontend routes, components, styles, content, or browser behavior:

- Every review-surface command, the commit list, and the untracked-file manifest.
- The governing `docs/design/<feature>/DESIGN.md` and evidence paths, when available.
- The affected routes and the repository's run/test commands.
- The brief: "Invoke `/frontend-review`. Review rendered hierarchy, responsive behavior, all relevant interaction states, keyboard use, accessibility, content clarity, browser behavior, and regressions. Separate Findings, Verified, and Unverified. Missing browser or accessibility tooling is Unverified, never a pass. Under 500 words."

If no frontend surface changed, skip this lane and say `not applicable`.

### 5. Aggregate

Present reports under `## Standards`, `## Spec`, and, when applicable, `## Frontend`, verbatim or lightly cleaned. Do **not** merge or rerank findings — the lanes are deliberately separate.

End with a one-line summary: total findings per lane, the worst issue _within each lane_ (if any), every unverified frontend capability, and each lane's disposition. Do not pick a single winner across lanes. Any blocking finding must be fixed and the affected lane rerun before the overall change is called complete.

## Why independent lanes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.

A frontend can also satisfy the written spec and coding standards while failing at mobile widths, keyboard operation, or visual hierarchy. The Frontend lane keeps rendered behavior visible as its own evidence surface.
