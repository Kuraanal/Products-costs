# Night Market Product Cost Calculator - Design Documentation (Revised)

## Data Structure
The app uses a unified "Component" model where products can be explicitly promoted to the ingredient pool.

### JSON Schema
```json
{
  "settings": {
    "globalLaborCost": 0,
    "currency": "TWD"
  },
  "ingredients": [
    {
      "id": "ing-1",
      "name": "Sugar",
      "unit": "g",
      "purchasePrice": 35,
      "purchaseAmount": 1000,
      "costPerUnit": 0.035
    }
  ],
  "products": [
    {
      "id": "prod-1",
      "name": "Syrup",
      "yieldAmount": 1000,
      "yieldUnit": "ml",
      "ingredients": [{ "id": "ing-1", "amount": 500 }],
      "isAvailableAsIngredient": true 
    }
  ]
}
```

## Core Features

### 1. Ingredient & Unit Logic
- **Standardized Units**: `g`, `ml`, `piece`.
- **Display Conversion**: Logical grouping for display (e.g., 1500g shown as 1.5kg).
- **Product as Ingredient**: Use a checkbox or button on the product detail page to "Add to Ingredients". Once added, it appears in the ingredient selection list for other products.

### 2. UI Structure (Modal-First)
- **Modals**: Used for all Add/Edit actions to maintain logic consistency and styling simplicity.
- **Dashboard**: High-level stats, profit margins, and warnings.
- **Ingredient Library**: A clean table with an "Add Ingredient" button that triggers a modal.
- **Product List**: Single-column list of "Cards". 
  - Each card shows: Yield, Yield Cost, Yield Profit, Unit Cost, Unit Profit.
  - Clicking a card navigates to the Product Detail View.
- **Product Detail View**:
  - Full recipe list (ingredients and sub-products).
  - **"Use as Ingredient" Checkbox**: Toggles whether this product appears in other recipe ingredient lists.
  - **"Save Recipe" Button**: Persists any changes made to the ingredients, yield, or settings for this product.
  - Add Ingredient modal specifically for the recipe.
- **Settings Page**:
  - Tabbed interface.
  - Global Labor Cost (toggled or applied per product).

### 3. Calculation Logic
- **Dynamic Linking (Source of Truth)**:
  - When a product is "Promoted to Ingredient", it doesn't move to the `ingredients` table. Instead, it remains in the `products` table with a flag.
  - When a recipe is calculated, if an item ID refers to a Product, the system **dynamically calculates** that product's current unit cost.
  - **Benefit**: If you change the price of "Sugar", all products using sugar AND all products using "Syrup" (which uses sugar) will update their profit margins instantly.
- **Product Yield Cost**: `Sum(ingredient costs) + (Global Labor or local laborOverride)`.
- **Product Unit Cost**: `Yield Cost / yieldAmount`.
- **Recursive Resolution**: The calculation engine will resolve costs up to 10 levels deep to allow complex nested recipes.
