# Three-Agent Workstreams (iosFitnessStream)

Work is split across **3 logical roles** (Orchestrator, Planning, Worker). You can run **autonomously** (one session, no manual handoffs) or with **separate sessions** (three agents).

## Autonomous mode (recommended - no manual handoffs)

**One session, no user interaction between steps.** Start the Orchestrator once; it runs the full pipeline by delegating Worker and Planning work to subagents (`mcp_task`).

1. Open **one** Cursor Composer/Agent session.
2. Paste the **"Start Agent 1 - Orchestrator (autonomous)"** prompt below.
3. The Orchestrator will, for each feature in order: update WORKSTREAMS/Beads; delegate implementation (Worker) via mcp_task; delegate compile/format (Planning) via mcp_task; merge to main, commit, push; create worktree when needed; advance to next feature.

You do **not** start Agent 2 or Agent 3; the Orchestrator drives everything in this one session.

### Start Agent 1 - Orchestrator (autonomous)

Paste this into a new agent:

```
You are Agent 1 (Orchestrator) for iosFitnessStream. Follow AGENTS.md and the autonomous workflow in WORKSTREAMS.md.

- Work in the main repo (main branch unless merging). Plan from README.md; track with Beads. Set workspace: context(workspace_root='/Users/wildmat/Github/iosFitnessStream').
- Run the pipeline autonomously. For each feature in WORKSTREAMS.md "Feature branch list":
  1. Ensure the feature branch exists (main repo or worker worktree as per "Current handoff state").
  2. Use mcp_task (subagent) to perform Worker role: implement the feature in the correct repo path and branch. Pass the task description, branch name, and path from WORKSTREAMS.md.
  3. Use mcp_task (subagent) to perform Planning role: in that same path/branch, run xcodebuild (compile), then formatting (SwiftFormat or project formatter), and return a short summary and "ready to merge" or any failures.
  4. Merge the feature branch into main (from the correct path), commit with a clear message, push to origin. Create the worker worktree after the first merge if it does not exist.
  5. Update "Current handoff state" and advance to the next feature. Loop until all features are done or you need to stop.
- Do not ask the user to start other agents or to hand off manually. You own the entire flow via subagents.
- Alert the user only for decisions that could change requirements.
```

---

## Multi-session mode (optional)

If you prefer three separate Cursor sessions (one per agent) with manual handoffs, use the prompts below.

---

## How to run each agent (multi-session prompts)

Run **one** of the following in a **new Cursor Composer/Agent** session. Do not mix roles in one session.

### Start Agent 1 - Orchestrator (multi-session)

Paste this into a new agent:

```
You are Agent 1 (Orchestrator) for iosFitnessStream. Follow AGENTS.md.

- Work in the main repo only (main branch unless merging).
- Plan work from README.md; track tasks with Beads (bd). Set workspace: context(workspace_root='/Users/wildmat/Github/iosFitnessStream').
- Give tasks to Agent 2 (Planning) and Agent 3 (Worker) by updating WORKSTREAMS.md and/or Beads; do not implement features yourself.
- After Planning Agent hands off "ready to commit," merge the feature branch into main (from the correct worktree), commit, and push. You own the only push to main.
- Alert the user only for decisions that could change requirements.
```

**Orchestrator owns:** Planning, Beads, assigning tasks, merging feature branches into main, `git push` to origin.

---

### Start Agent 2 - Planning Agent

Paste this into a new agent:

```
You are Agent 2 (Planning Agent) for iosFitnessStream. Follow AGENTS.md.

- Read WORKSTREAMS.md for current feature branches and "Next work for Worker."
- Create feature branches from the list in WORKSTREAMS.md (one per feature). Use the worker worktree path for that branch when creating it.
- When Worker Agent hands off (worktree + branch + what was implemented):
  1. In that worktree: run compile (xcodebuild), fix or escalate build failures.
  2. Run formatting (SwiftFormat or project formatter) and any other repo quality gates.
  3. Hand off to Orchestrator: "Checks passed. Worktree: <path>, branch: <branch>, summary: <what was done>. Ready for you to merge and push."
- Do NOT push to main; Orchestrator merges and pushes.
```

**Planning Agent owns:** Creating branches, running compile/format/quality in the worker worktree, reporting "ready to commit" to Orchestrator.

---

### Start Agent 3 - Worker Agent

Paste this into a new agent:

```
You are Agent 3 (Worker Agent) for iosFitnessStream. Follow AGENTS.md.

- Read WORKSTREAMS.md for your current task, worktree path, and branch. Work only in that worktree on that branch.
- Implement only the assigned task (README.md + acceptance criteria). Keep changes small and focused.
- Run a local build before hand-off so Planning Agent’s compile step is likely to pass. Do not run the full quality gate suite; do not commit or push.
- When done, hand off to Planning Agent: "Implementation complete. Worktree: <path>, branch: <branch>. Implemented: <short summary>. Gaps/follow-ups: <any>."
```

**Worker Agent owns:** Implementing the assigned feature in the assigned worktree/branch; no commits/pushes.

---

## Repo and worktree layout

| Location                                          | Branch           | Used by                                                                      |
| ------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| **Main repo** `iosFitnessStream/`                 | `main`           | Agent 1 (Orchestrator). Merge target; only place that pushes to origin.      |
| **Worker worktree** `iosFitnessStream-wt-worker/` | `feature/<name>` | Agent 3 (Worker) implements here. Agent 2 (Planning) runs build/format here. |

Orchestrator creates the worker worktree once (see below). Planning creates each feature branch in that worktree.

---

## Feature branch list (from README / Beads)

Use one branch per feature; name clearly. Suggested order:

| #   | Branch                     | Scope                                                                                            |
| --- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| 1   | `feature/scaffold`         | Xcode project, minimal grayscale app shell (UIKit, no storyboard).                               |
| 2   | `feature/endpoint-config`  | Endpoint URL input field + persistence.                                                          |
| 3   | `feature/workout-list`     | List workouts from HealthKit / built-in fitness app; user selects one.                           |
| 4   | `feature/start-stream`     | Start workout session + open data stream to configured endpoint; send key metrics.               |
| 5   | `feature/live-metrics-ui`  | Live metrics screen: HR, zone, energy, distance, pace, steps, location, elevation, elapsed time. |
| 6   | `feature/pause-end`        | Pause and End workout controls.                                                                  |
| 7   | `feature/background-badge` | Background workout + lockscreen notification badge (workout name, elapsed time).                 |
| 8   | `feature/watch-sync`       | Apple Watch sync; collect data from watch when present.                                          |

---

## Current handoff state (Orchestrator updates this)

- **Next work for Worker:** `feature/endpoint-config` - Endpoint URL input field + persistence. **Use the worker worktree** `iosFitnessStream-wt-worker/`, branch: `feature/endpoint-config`.
- **Next work for Planning:** After Worker finishes endpoint-config, run compile + format in **worker worktree** on branch `feature/endpoint-config`, then tell Orchestrator "ready to merge and push."
- **Note:** Worker worktree exists at `../iosFitnessStream-wt-worker` (branch `feature/endpoint-config`). Orchestrator merged scaffold to main and created the worktree.

---

## One-time setup (Orchestrator or first session)

**After the first commit exists on `main`**, from the main repo (`iosFitnessStream/`):

```bash
# Create worker worktree and first feature branch
git worktree add ../iosFitnessStream-wt-worker -b feature/scaffold
```

Until then, Worker and Planning can work in the main repo on a feature branch (e.g. `feature/scaffold`) if no worktree exists; Orchestrator should create the worktree once main has at least one commit so future work is isolated.

For later features, Planning Agent (or Orchestrator) creates new branches in the worker worktree, e.g.:

```bash
cd ../iosFitnessStream-wt-worker
git fetch origin
git checkout main
git pull
git checkout -b feature/endpoint-config
```

Then update WORKSTREAMS.md "Next work for Worker" to point to `feature/endpoint-config`.
