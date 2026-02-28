# Implementation Plan - Night Market Product Cost Calculator (Revised)

## Proposed Changes

### Core Logic & Data
---
#### [UPDATE] appState logic
- Implement a `units.js` utility (or internal helper) to handle normalization (`g` -> `kg`, `ml` -> `L`).
- Add a promotion flag `isAvailableAsIngredient` to products.
- Recursive calculation: The `getComponentCost(id)` function will check both `ingredients` and `products`. If it's a product, it triggers `calcProductCost(id)` recursively. This ensures all sub-costs are always up-to-date.

### UI Components (Vanilla Modal System)
---
#### [NEW] Modal Manager
- A central function to create/destroy modals for consistency.
- Forms within modals will use data-attributes for easy mapping to the JS state.

### Pages & Views
---
#### Dashboard
- Summary cards (Total Ingredients, Total Products).
- Profitable items rankings.

#### Ingredients (Table + Modal)
- Clean table layout.
- "Add Ingredient" modal.

#### Product List (Cards)
- Flex-column of cards.
- Each card: Name, Stats (Yield/Unit Cost/Profit).
- Direct link to Detail View.

#### Product Detail (Recipe Manager)
- List of current recipe components.
- Cost breakdown summary.
- **"Use as Ingredient" checkbox** (persisted in metadata).
- **"Save" button** to commit recipe changes.

#### Settings (Tabs)
- Tab 1: Global Costs (Labor).
- Tab 2: Export/Import.
- Tab 3: About/Reset.

## Verification Plan

### Automated Tests
1. **Unit Promotion**: Create Product A -> Promote to Ingredient -> Create Product B using A -> Verify B's cost includes A's unit cost.
2. **Unit Conversion**: Add 1200g of sugar -> Verify UI displays "1.2 kg" in the summary but stays "1200g" in the database.
3. **Global Settings**: Change global labor cost -> Verify all product profit margins update.

### Manual Verification
1. **Modal Consistency**: Verify "Add Ingredient" and "Edit Product" look and feel identical in behavior.
2. **Recursive Loop Prevention**: Ensure a product cannot add itself to its own recipe.
