# Architectural Decisions — EduFast

This file records the key architectural and design decisions made throughout the project life cycle.

## 2026-07-10: Initial Stack Configuration

* **Status**: Approved
* **Context**: Starting a new fast educational web platform that needs quick load times and high responsiveness.
* **Decision**: 
  - Adopt **Vite 8** and **React 19** for rendering and fast development loops.
  - Integrate the **React Compiler** (Babel plugin) to handle auto-memoization.
  - Choose **Oxlint** for fast, local-first linting.
  - Setup the **Memory Bank** framework (`AGENTS.md` rules + state tracker files) to manage AI development context cleanly.
* **Consequences**:
  - Extremely fast dev server startups and rebuild times.
  - High components responsiveness out-of-the-box.
  - Structured, clear instructions for any AI assistant working on the repository.
