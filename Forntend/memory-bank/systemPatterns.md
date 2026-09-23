# System Patterns — EduFast

## Directory Layout
The project follows a standard modern Vite + React single-page app structure:

```
EduFast/
├── index.html                   # HTML Entry Point
├── package.json                 # Dependencies and Scripts
├── vite.config.js               # Vite compilation configuration
├── .oxlintrc.json               # Oxlint configuration
├── src/
│   ├── main.jsx                 # React DOM mount point
│   ├── App.jsx                  # Main Application router / Shell
│   ├── App.css                  # App styles
│   ├── index.css                # Global design system & base styles
│   ├── assets/                  # Images, logos, and static assets
│   ├── components/              # Reusable React components (buttons, cards, inputs)
│   ├── pages/                   # Main view panels / pages
│   └── data/                    # Local JSON/JS data structures
└── memory-bank/                 # AI context state tracker
```

## Architecture & Code Design
- **Single Page Application**: Uses React for views and state.
- **Component-Driven UI**: Break down page views into small, focused React components under `src/components/`.
- **CSS Design System**: Styling is governed globally through `src/index.css` and scoped per-component using classes.
