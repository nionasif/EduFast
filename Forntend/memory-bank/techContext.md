# Technical Context — EduFast

## Tech Stack
* **Vite 8** (`^8.1.1`): Next-generation front-end tool for quick builds and hot module replacement.
* **React 19** (`^19.2.7`): Component library, using React 19 concurrent features.
* **React Compiler** (`^1.0.0`): Automatic memoization of components (via Babel plugin).
* **Oxlint** (`^1.71.0`): Ultra-fast linter for JavaScript/JSX.

## Development Scripts
Run these commands from the project root:

* `npm run dev` — Starts the local Vite development server.
* `npm run build` — Compiles the production build (placed into `dist/`).
* `npm run lint` — Runs `oxlint` to quickly lint files.
* `npm run preview` — Locally previews the built production site.

## Compilation Rules & Constraints
- **React 19 Rules**: Follow modern React hook patterns; ensure no deprecation warnings are introduced.
- **Oxlint**: Must resolve any linting issues before building.
