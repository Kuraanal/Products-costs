/* ============================================
   CALCULATIONS.JS — Cost Engine & Unit Conversion
   ============================================ */

const MAX_RECURSION_DEPTH = 10;

// --- Unit Conversion ---
const UNIT_CONVERSIONS = {
    g: { base: 'g', display: [{ threshold: 1000, unit: 'kg', divisor: 1000 }] },
    ml: { base: 'ml', display: [{ threshold: 1000, unit: 'L', divisor: 1000 }] },
    piece: { base: 'piece', display: [] }
};

/**
 * Format a value with smart unit display (e.g., 1500g -> 1.5 kg)
 */
function formatDisplayUnit(value, unit) {
    const config = UNIT_CONVERSIONS[unit];
    if (!config) return `${value} ${unit}`;

    for (const rule of config.display) {
        if (Math.abs(value) >= rule.threshold) {
            return `${(value / rule.divisor).toFixed(2)} ${rule.unit}`;
        }
    }
    return `${value} ${unit}`;
}

/**
 * Get the cost per base unit for a raw ingredient
 */
function getIngredientCostPerUnit(ingredientId) {
    const ingredient = getIngredientById(ingredientId);
    if (!ingredient) return 0;
    if (ingredient.purchaseAmount === 0) return 0;
    return ingredient.purchasePrice / ingredient.purchaseAmount;
}

/**
 * Calculate the total cost of a product recipe (recursive).
 * Returns: { totalCost, unitCost, laborCost, ingredientsCost }
 */
function calculateProductCost(productId, depth) {
    if (depth === undefined) depth = 0;
    if (depth > MAX_RECURSION_DEPTH) {
        console.warn('Max recursion depth reached for product:', productId);
        return { totalCost: 0, unitCost: 0, laborCost: 0, ingredientsCost: 0 };
    }

    const product = getProductById(productId);
    if (!product) return { totalCost: 0, unitCost: 0, laborCost: 0, ingredientsCost: 0 };

    let ingredientsCost = 0;

    for (const item of product.ingredients) {
        const cost = getComponentCost(item.id, depth + 1);
        ingredientsCost += cost * item.amount;
    }

    const laborCost = product.laborCostOverride !== null && product.laborCostOverride !== undefined
        ? product.laborCostOverride
        : appState.settings.globalLaborCost;

    const totalCost = ingredientsCost + laborCost;
    const unitCost = product.yieldAmount > 0 ? totalCost / product.yieldAmount : 0;

    return { totalCost, unitCost, laborCost, ingredientsCost };
}

/**
 * Resolve the cost per base unit for any component (ingredient or product).
 */
function getComponentCost(componentId, depth) {
    if (depth === undefined) depth = 0;

    // Check raw ingredients first
    const ingredient = getIngredientById(componentId);
    if (ingredient) {
        return getIngredientCostPerUnit(componentId);
    }

    // Check products (used as ingredient)
    const product = getProductById(componentId);
    if (product) {
        const costs = calculateProductCost(componentId, depth);
        return costs.unitCost;
    }

    return 0;
}

/**
 * Calculate profit and margin for a product.
 */
function calculateProductProfit(productId) {
    const product = getProductById(productId);
    if (!product) return { yieldProfit: 0, unitProfit: 0, margin: 0 };

    const costs = calculateProductCost(productId);
    const yieldRevenue = product.sellingPrice * product.yieldAmount;
    const yieldProfit = yieldRevenue - costs.totalCost;
    const unitProfit = product.sellingPrice - costs.unitCost;
    const margin = product.sellingPrice > 0 ? (unitProfit / product.sellingPrice) * 100 : 0;

    return { yieldProfit, unitProfit, margin, yieldRevenue, ...costs };
}

/**
 * Format currency.
 */
function formatCurrency(value) {
    const currency = appState.settings.currency || 'TWD';
    return `${Math.round(value * 100) / 100} ${currency}`;
}

/**
 * Get the cost breakdown for a single recipe item.
 */
function getRecipeItemCost(itemId, amount) {
    const costPerUnit = getComponentCost(itemId);
    return costPerUnit * amount;
}
