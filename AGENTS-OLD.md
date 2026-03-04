Follow the outline in README.md to build the app.
Work is separated into 3 logical roles (Orchestrator, Planning, Worker). See **WORKSTREAMS.md** for worktree layout, feature branch list, and handoff state.

**Autonomous mode (default):** Run only Agent 1 (Orchestrator). It drives the full pipeline in one session by delegating Worker and Planning work to subagents via `mcp_task`. No separate Agent 2/3 sessions or manual handoffs.

**Multi-session mode (optional):** Run each agent in a separate Cursor session and hand off manually; see WORKSTREAMS.md for prompts.

# Agent 1 (Orchestrator)

- Orchestrator
- Plans out work according to spec in README
- Manages commit merges between worktrees
- Commits and pushes to "main" branch after each feature build
- **Autonomous:** Uses mcp_task to delegate implementation (Worker) and compile/format (Planning); then merges, commits, pushes. Does not ask the user to start other agents.
- Use 'bd' for task tracking
- Ensures the proposed features are technically feasible given the iOS development environment documentation at https://developer.apple.com/documentation/
- The only agent that alerts the user for critical decisions that may change requirements

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

# Agent 2 — Planning Agent

- **Role:** Creates feature branches, runs quality checks after the worker completes code, and coordinates with the orchestrator to land changes from the worktree.
- **Branch creation:** Create branches from the list of features that need to be built (derived from README and orchestrator instructions). One branch per feature or logical unit; name branches clearly (e.g. `feature/endpoint-config`, `feature/live-metrics-ui`).
- **After worker completes code:**
  1. Run **compile** (e.g. `xcodebuild` or project build) and fix or escalate any build failures.
  2. Run **formatting** (e.g. SwiftFormat, project formatter, or linter) and ensure code is formatted to project standards.
  3. Run any other quality gates the repo defines (tests, static analysis) and ensure they pass or are explicitly waived by the orchestrator.
- **With the orchestrator:** After checks pass, work with the orchestrator to commit the changes from the worktree (correct worktree path, clear commit message), then push. Do not push on your own; the orchestrator owns final commit and push to `main` (or the target branch). Hand off a clean, checked worktree and a short summary of what was done and what’s ready to commit.

# Agent 3 — Worker Agent

- **Role:** Implements features and code changes in the worktree. Receives tasks from the orchestrator (or from the planning agent’s branch list), does the implementation, then hands off to the planning agent for checks and to the orchestrator for commit/push.
- **Work in the right place:** Operate in the worktree and branch assigned for the task. Do not commit to `main` directly; do all work on the feature branch in the worktree.
- **Scope:** Implement only what the task specifies. Follow README and any acceptance criteria. Prefer small, focused changes; if a task is large, break it into steps and complete the assigned step.
- **Code quality:** Write code that compiles and follows project conventions (structure, naming, patterns). Run a local build before handing off so the planning agent’s compile step is likely to pass. Apply project formatting (e.g. SwiftFormat) if the repo defines it.
- **Hand-off:** When the implementation is done, hand off to the planning agent with: (1) which worktree and branch were used, (2) what was implemented, (3) any known gaps or follow-ups. Do not run the full quality gate suite yourself unless asked; the planning agent runs compile, format, and other checks. Do not commit or push; the planning agent and orchestrator handle that.
