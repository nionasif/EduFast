# Project Rules — EduFast

## Code Style & Architecture
- **Functional Components**: Write all React components as functional components with hooks.
- **Strict Linting**: oxlint must be run and pass before code is considered complete.
- **Component File Structure**: Components should live under `src/components/`, pages under `src/pages/`.
- **CSS Usage**: Use Tailwind class equivalents or semantic styles inside `src/index.css` rather than writing ad-hoc styles.

## React 19 Best Practices
- **No deprecated features**: Do not use legacy features like `ReactDOM.render`, `findDOMNode`, or string refs.
- **Automatic memoization**: Rely on the React Compiler; avoid unnecessary manual `useMemo` or `useCallback` unless profiling indicates a specific bottleneck.
- **State Management**: Keep state local and lift it up only when shared; avoid introducing heavy state management libraries unless absolutely necessary.
