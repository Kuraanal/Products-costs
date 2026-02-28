# File Structure Documentation

To keep the project organized and maintainable as it grows, we will use the following structure. This separates the core logic from the styles and the main entrance of the app.

## Proposed Directory Tree

```text
/Products costs/
├── index.html              # Main entry point (Shell & Layout)
├── assets/
│   ├── css/
│   │   ├── core.css        # Shared variables, design system, and resets
│   │   └── styles.css      # View-specific and component styles
│   └── js/
│       ├── app.js          # Core application controller (Routing & State)
│       ├── state.js        # State management (LocalStorage & appState)
│       ├── calculations.js # Cost & unit logic (Recursive functions)
│       └── ui.js           # UI Rendering & Modals (DOM manipulation)
└── documentation/          # Design docs and implementation plans
    ├── design_documentation.md
    ├── implementation_plan.md
    └── file_structure.md
```

## Explanation of Components

### 1. Root Level
- `index.html`: Contains the basic HTML shell, sidebar, and placeholders for dynamic content. It will link to the CSS and JS files in the `assets/` folder.

### 2. Assets Folder
- **css/styles.css**: All styling resides here. Using vanilla CSS with variables for the night-market theme.
- **js/app.js**: The "brain" that initializes the app and coordinates between state, logic, and UI.
- **js/state.js**: Handles `localStorage`, JSON import/export, and keeps the `appState` object updated.
- **js/calculations.js**: Contains the pure logic for unit conversions and the recursive cost calculations.
- **js/ui.js**: Handles all DOM interactions, switching between views (Dashboard, Ingredients, Products), and managing the modal system.

### 3. Documentation Folder
- Keeps all planning and design work organized as per your instructions.

## Benefits of this Structure
1. **Separation of Concerns**: Logic (calculations) is kept separate from appearance (CSS) and interactivity (UI).
2. **Modular JS**: Instead of one massive `app.js`, smaller files make it easier to debug specific issues (e.g., if a calculation is wrong, you only look at `calculations.js`).
3. **Vanilla Scalability**: This structure mimics modern frameworks without needing nodejs or build tools.
