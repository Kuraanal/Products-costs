# CSS Architecture Documentation

To maintain a consistent and premium look while keeping the code clean, we will split our CSS into a global core and view-specific styles.

## 1. Core Styles (`core.css`)
This file contains the foundational design tokens and shared layout utilities.

### Design Tokens (CSS Variables)
- **Colors**: `--bg-dark`, `--card-bg`, `--accent-primary`, `--accent-secondary`, etc.
- **Spacing**: Standardized units for margins and padding.
- **Typography**: Font families and scale.

### Shared Classes
- `.sidebar`: Main navigation container.
- `.main-content`: Shell for the view container.
- `.card`: Standardized container with uniform border-radius and shadow.
- `.btn`, `.btn-primary`, `.btn-secondary`: Common button styles.
- `.modal-overlay`, `.modal`, `.modal-header`, etc.: Reusable modal framework.
- `.form-group`, `.input-field`: Standardized form elements.

---

## 2. Display-Specific Styles (`styles.css`)
This file contains styles unique to specific views or "displays".

### Dashboard View (`.view-dashboard`)
- `.stat-grid`: Layout for dashboard summary cards.
- `.stat-card`: Mini-cards for numbers/stats.
- `.warning-banner`: Highlighted section for missing data.

### Ingredient Library View (`.view-ingredients`)
- `.ingredient-table`: Styles for the raw material listing.
- `.unit-badge`: Visual indicator for units (g, ml, piece).

### Product List View (`.view-product-list`)
- `.product-card-list`: Vertical stack of product cards.
- `.product-card`: Single-row layout with summary cost/profit data.
- `.trend-indicator`: Color-coded profit margin (Green = High, Red = Low).

### Product Detail View (`.view-product-detail`)
- `.recipe-header`: Layout for product name and yield settings.
- `.recipe-list`: Draggable or layered list of ingredients.
- `.recipe-total-footer`: Floating or bottom-aligned cost summary.

### Settings View (`.view-settings`)
- `.settings-tabs`: Tab navigation logic (visuals).
- `.tab-content`: Visible/hidden container for settings categories.

## Strategy: Scope-Specific Styling
To prevent styles from leaking between views, we will use a top-level class on our `#view-container` to scope display-specific CSS:

```css
/* Example in styles.css */
.view-dashboard .card {
    /* Specific overrides for dashboard cards */
}

.view-product-detail .card {
    /* Specific overrides for product details */
}
```
