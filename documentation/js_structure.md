# JavaScript Architecture Documentation

To ensure the application remains manageable and scalable without a framework, we use a modular functional approach. Each file has a clear, single responsibility.

## 1. Core Controller (`app.js`)
The "Orchestrator" of the application.
- **Responsibilities**:
  - Global initialization (`DOMContentLoaded`).
  - Handling view switching (Routing logic).
  - Event delegation for global interactions (Navigation clicks).
  - Coordinating between `state.js` and `ui.js` during page transitions.

## 2. State Management (`state.js`)
The "Vault" for your data.
- **Data Structure**: Holds the `appState` object (Settings, Ingredients, Products).
- **Responsibilities**:
  - `loadData()`: Fetch from `localStorage`.
  - `saveData()`: Persist to `localStorage`.
  - `exportToJSON()`: Generate the download file.
  - `importFromJSON()`: Parse a file and validate the schema.
  - CRUD helpers for ingredients and products (Add/Edit/Delete).

## 3. Calculation Engine (`calculations.js`)
The "Math Library" for costs and units.
- **Responsibilities**:
  - `getComponentCost(id)`: Resolves if an ID is an ingredient or product and returns current cost.
  - `calculateProductCost(productId)`: The recursive driver that sums all recipe components.
  - `convertUnit(value, fromUnit, toUnit)`: Logic for `g -> kg`, `ml -> L`.
  - `formatDisplayValue(value, unit)`: Logic for "1.5 kg" vs "500 g".

## 4. UI Rendering & Modals (`ui.js`)
The "Painter" of the DOM.
- **Responsibilities**:
  - `renderDashboard()`: Generates the HTML for summary stats.
  - `renderIngredientList()`: Builds the ingredient table.
  - `renderProductList()`: Builds the card-based product list.
  - `renderProductDetail(id)`: Detailed recipe view with checkbox/save logic.
  - **Modal Manager**: Functions to `openModal(type, targetId)` and `closeModal()`.
  - Shared UI fragments (Buttons, Alerts, Loading states).

---

## Data Flow Example: Adding an Ingredient
1. **User** clicks "Add Ingredient" (handled in `ui.js`).
2. **`ui.js`** opens the modal.
3. **User** fills form and clicks "Save".
4. **`ui.js`** extracts data and calls **`state.js`** to add to memory.
5. **`state.js`** updates `localStorage`.
6. **`ui.js`** re-renders the list to show the new item.
7. **`calculations.js`** is ready to use this new ingredient in any product.
