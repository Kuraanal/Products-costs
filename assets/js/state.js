/* ============================================
   STATE.JS — Data Persistence & CRUD
   ============================================ */

const STORAGE_KEY = 'nightcalc_data';

const defaultState = {
    version: '1.0',
    settings: {
        globalLaborCost: 0,
        currency: 'TWD'
    },
    ingredients: [],
    products: []
};

// --- State Object (In-Memory) ---
let appState = JSON.parse(JSON.stringify(defaultState));

// --- LocalStorage ---
function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            appState = Object.assign({}, defaultState, parsed);
            // Ensure nested objects exist
            appState.settings = Object.assign({}, defaultState.settings, parsed.settings || {});
            appState.ingredients = parsed.ingredients || [];
            appState.products = parsed.products || [];
        }
    } catch (e) {
        console.error('Failed to load data from localStorage:', e);
        appState = JSON.parse(JSON.stringify(defaultState));
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
        console.error('Failed to save data to localStorage:', e);
    }
}

// --- UUID Generator ---
function generateId() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
}

// --- Ingredient CRUD ---
function addIngredient(data) {
    const ingredient = {
        id: generateId(),
        name: data.name || 'Unnamed',
        unit: data.unit || 'g',
        purchasePrice: parseFloat(data.purchasePrice) || 0,
        purchaseAmount: parseFloat(data.purchaseAmount) || 1
    };
    appState.ingredients.push(ingredient);
    saveData();
    return ingredient;
}

function updateIngredient(id, data) {
    const idx = appState.ingredients.findIndex(i => i.id === id);
    if (idx === -1) return null;
    appState.ingredients[idx] = Object.assign(appState.ingredients[idx], {
        name: data.name !== undefined ? data.name : appState.ingredients[idx].name,
        unit: data.unit !== undefined ? data.unit : appState.ingredients[idx].unit,
        purchasePrice: data.purchasePrice !== undefined ? parseFloat(data.purchasePrice) : appState.ingredients[idx].purchasePrice,
        purchaseAmount: data.purchaseAmount !== undefined ? parseFloat(data.purchaseAmount) : appState.ingredients[idx].purchaseAmount
    });
    saveData();
    return appState.ingredients[idx];
}

function deleteIngredient(id) {
    // Check if used in any product recipe
    for (const product of appState.products) {
        const used = product.ingredients.some(item => item.id === id);
        if (used) {
            return { error: true, message: `Cannot delete: used in "${product.name}"` };
        }
    }
    appState.ingredients = appState.ingredients.filter(i => i.id !== id);
    saveData();
    return { error: false };
}

function getIngredientById(id) {
    return appState.ingredients.find(i => i.id === id) || null;
}

// --- Product CRUD ---
function addProduct(data) {
    const product = {
        id: generateId(),
        name: data.name || 'Unnamed Product',
        yieldAmount: parseFloat(data.yieldAmount) || 1,
        yieldUnit: data.yieldUnit || 'piece',
        sellingPrice: parseFloat(data.sellingPrice) || 0,
        laborCostOverride: (data.laborCostOverride !== undefined && data.laborCostOverride !== null && data.laborCostOverride !== '') ? parseFloat(data.laborCostOverride) : null,
        isAvailableAsIngredient: data.isAvailableAsIngredient || false,
        ingredients: data.ingredients || []
    };
    appState.products.push(product);
    saveData();
    return product;
}

function updateProduct(id, data) {
    const idx = appState.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const product = appState.products[idx];
    if (data.name !== undefined) product.name = data.name;
    if (data.yieldAmount !== undefined) product.yieldAmount = parseFloat(data.yieldAmount);
    if (data.yieldUnit !== undefined) product.yieldUnit = data.yieldUnit;
    if (data.sellingPrice !== undefined) product.sellingPrice = parseFloat(data.sellingPrice);
    if (data.laborCostOverride !== undefined) product.laborCostOverride = (data.laborCostOverride === null || data.laborCostOverride === '') ? null : parseFloat(data.laborCostOverride);
    if (data.isAvailableAsIngredient !== undefined) product.isAvailableAsIngredient = data.isAvailableAsIngredient;
    if (data.ingredients !== undefined) product.ingredients = data.ingredients;
    saveData();
    return product;
}

function deleteProduct(id) {
    // Check if used as ingredient in another product
    for (const product of appState.products) {
        if (product.id === id) continue;
        const used = product.ingredients.some(item => item.id === id);
        if (used) {
            return { error: true, message: `Cannot delete: used as ingredient in "${product.name}"` };
        }
    }
    appState.products = appState.products.filter(p => p.id !== id);
    saveData();
    return { error: false };
}

function getProductById(id) {
    return appState.products.find(p => p.id === id) || null;
}

// --- JSON Export / Import ---
function exportToJSON() {
    const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightcalc_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                // Basic validation
                if (!data.ingredients || !data.products) {
                    reject('Invalid file format: missing ingredients or products.');
                    return;
                }
                appState = Object.assign({}, defaultState, data);
                appState.settings = Object.assign({}, defaultState.settings, data.settings || {});
                saveData();
                resolve(appState);
            } catch (err) {
                reject('Failed to parse JSON: ' + err.message);
            }
        };
        reader.onerror = () => reject('Failed to read file.');
        reader.readAsText(file);
    });
}

function clearAllData() {
    appState = JSON.parse(JSON.stringify(defaultState));
    saveData();
}

// --- Helpers ---
function getAvailableIngredientsForProduct(productId) {
    // All raw ingredients + products marked as available (excluding self to prevent circular ref)
    const rawIngredients = appState.ingredients.map(i => ({
        id: i.id,
        name: i.name,
        unit: i.unit,
        type: 'ingredient'
    }));

    const productIngredients = appState.products
        .filter(p => p.isAvailableAsIngredient && p.id !== productId)
        .map(p => ({
            id: p.id,
            name: p.name + ' (product)',
            unit: p.yieldUnit,
            type: 'product'
        }));

    return [...rawIngredients, ...productIngredients];
}
