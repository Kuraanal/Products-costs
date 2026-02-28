/* ============================================
   UI.JS — View Rendering & Modal Management
   ============================================ */

const viewContainer = document.getElementById('view-container');
const viewTitle = document.getElementById('view-title');
const headerActions = document.getElementById('header-actions');
const modalOverlay = document.getElementById('modal-overlay');
const modalContainer = document.getElementById('modal-container');
const modalTitleEl = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalCloseBtn = document.getElementById('modal-close');
const toastContainer = document.getElementById('toast-container');

// --- Toast Notifications ---
function showToast(message, type) {
    if (!type) type = 'info';
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(function () {
        toast.classList.add('toast-out');
        setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
}

// --- Modal Manager ---
function openModal(title, bodyHTML, footerHTML) {
    modalTitleEl.textContent = title;
    modalBody.innerHTML = bodyHTML + (footerHTML ? '<div class="modal-footer">' + footerHTML + '</div>' : '');
    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
});

// --- Render: Dashboard ---
function renderDashboard() {
    viewTitle.textContent = 'Dashboard';
    headerActions.innerHTML = '';

    const totalIngredients = appState.ingredients.length;
    // Only count sellable products (not ingredient-only)
    const sellableProducts = appState.products.filter(function (p) { return !p.isAvailableAsIngredient || p.sellingPrice > 0; });
    const ingredientOnlyProducts = appState.products.filter(function (p) { return p.isAvailableAsIngredient && p.sellingPrice <= 0; });

    // Compute product stats (only sellable products)
    let productStats = [];
    for (let i = 0; i < sellableProducts.length; i++) {
        const p = sellableProducts[i];
        const profit = calculateProductProfit(p.id);
        productStats.push({ name: p.name, id: p.id, margin: profit.margin, unitProfit: profit.unitProfit });
    }
    productStats.sort(function (a, b) { return b.margin - a.margin; });

    let warningsHTML = '';
    const productsWithNoIngredients = sellableProducts.filter(function (p) { return p.ingredients.length === 0; });
    if (productsWithNoIngredients.length > 0) {
        warningsHTML = '<div class="warning-banner">⚠️ ' + productsWithNoIngredients.length + ' product(s) have no ingredients in their recipe.</div>';
    }

    let rankingHTML = '';
    if (productStats.length > 0) {
        rankingHTML = '<div class="section-title">Profit Margin Ranking</div><div class="ranking-list">';
        var topN = productStats.slice(0, 10);
        for (let i = 0; i < topN.length; i++) {
            var s = topN[i];
            var marginClass = s.margin > 0 ? 'text-green' : 'text-red';
            rankingHTML += '<div class="ranking-item">' +
                '<span class="rank">#' + (i + 1) + '</span>' +
                '<span class="name">' + escapeHTML(s.name) + '</span>' +
                '<span class="' + marginClass + '">' + s.margin.toFixed(1) + '%</span>' +
                '</div>';
        }
        rankingHTML += '</div>';
    }

    viewContainer.className = 'content-area view-dashboard';
    viewContainer.innerHTML =
        warningsHTML +
        '<div class="stat-grid">' +
        '<div class="card stat-card"><div class="stat-icon">🧂</div><div class="stat-value">' + totalIngredients + '</div><div class="stat-label">Ingredients</div></div>' +
        '<div class="card stat-card"><div class="stat-icon">🍜</div><div class="stat-value">' + sellableProducts.length + '</div><div class="stat-label">Products</div></div>' +
        '<div class="card stat-card"><div class="stat-icon">📦</div><div class="stat-value">' + ingredientOnlyProducts.length + '</div><div class="stat-label">Sub-Recipes</div></div>' +
        '<div class="card stat-card"><div class="stat-icon">💰</div><div class="stat-value">' + (productStats.length > 0 ? productStats[0].margin.toFixed(1) + '%' : '—') + '</div><div class="stat-label">Best Margin</div></div>' +
        '</div>' +
        '<div class="card">' + (rankingHTML || '<div class="empty-state"><div class="empty-icon">📊</div><p>No products yet. Add some to see rankings!</p></div>') + '</div>';
}

// --- Render: Ingredient List ---
var ingredientSearchQuery = '';

function renderIngredientList() {
    viewTitle.textContent = 'Ingredients';
    headerActions.innerHTML = '<button class="btn btn-primary" id="btn-add-ingredient">+ Add Ingredient</button>';

    var filtered = appState.ingredients.filter(function (ing) {
        if (!ingredientSearchQuery) return true;
        return ing.name.toLowerCase().indexOf(ingredientSearchQuery.toLowerCase()) >= 0;
    });

    let tableRows = '';
    for (let i = 0; i < filtered.length; i++) {
        var ing = filtered[i];
        var costPerUnit = getIngredientCostPerUnit(ing.id);
        tableRows += '<tr>' +
            '<td>' + escapeHTML(ing.name) + '</td>' +
            '<td><span class="unit-badge">' + ing.unit + '</span></td>' +
            '<td>' + formatCurrency(ing.purchasePrice) + '</td>' +
            '<td>' + ing.purchaseAmount + ' ' + ing.unit + '</td>' +
            '<td>' + formatCurrency(costPerUnit) + '/' + ing.unit + '</td>' +
            '<td class="actions-cell">' +
            '<button class="btn btn-sm btn-secondary btn-edit-ingredient" data-id="' + ing.id + '">Edit</button>' +
            '<button class="btn btn-sm btn-danger btn-delete-ingredient" data-id="' + ing.id + '">Delete</button>' +
            '</td></tr>';
    }

    viewContainer.className = 'content-area view-ingredients';
    viewContainer.innerHTML =
        '<div class="ingredient-toolbar">' +
        '<span class="text-secondary">' + filtered.length + ' of ' + appState.ingredients.length + ' ingredient(s)</span>' +
        '<input class="input-field search-input" id="ingredient-search" type="text" placeholder="\uD83D\uDD0D Search ingredients..." value="' + escapeHTML(ingredientSearchQuery) + '">' +
        '</div>' +
        (filtered.length > 0
            ? '<div class="card"><table class="ingredient-table"><thead><tr>' +
            '<th>Name</th><th>Unit</th><th>Purchase Price</th><th>Purchase Amount</th><th>Cost/Unit</th><th></th>' +
            '</tr></thead><tbody>' + tableRows + '</tbody></table></div>'
            : '<div class="empty-state"><div class="empty-icon">🧂</div><p>' + (appState.ingredients.length === 0 ? 'No ingredients yet. Click "Add Ingredient" to get started.' : 'No ingredients match your search.') + '</p></div>');

    // Event: Search
    document.getElementById('ingredient-search').addEventListener('input', function () {
        ingredientSearchQuery = this.value;
        renderIngredientList();
        // Re-focus and set cursor position
        var searchInput = document.getElementById('ingredient-search');
        searchInput.focus();
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    });

    // Event: Add
    var addBtn = document.getElementById('btn-add-ingredient');
    if (addBtn) addBtn.addEventListener('click', function () { openIngredientModal(); });

    // Event: Edit
    var editBtns = viewContainer.querySelectorAll('.btn-edit-ingredient');
    editBtns.forEach(function (btn) {
        btn.addEventListener('click', function () { openIngredientModal(btn.dataset.id); });
    });

    // Event: Delete
    var deleteBtns = viewContainer.querySelectorAll('.btn-delete-ingredient');
    deleteBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var result = deleteIngredient(btn.dataset.id);
            if (result.error) {
                showToast(result.message, 'error');
            } else {
                showToast('Ingredient deleted.', 'success');
                renderIngredientList();
            }
        });
    });
}

// --- Modal: Ingredient ---
function openIngredientModal(editId) {
    const isEdit = !!editId;
    const existing = isEdit ? getIngredientById(editId) : null;

    const body =
        '<div class="form-group"><label>Name</label><input class="input-field" id="ing-name" value="' + (existing ? escapeHTML(existing.name) : '') + '" placeholder="e.g., Sugar"></div>' +
        '<div class="form-group"><label>Unit</label><select class="input-field" id="ing-unit">' +
        '<option value="g"' + (existing && existing.unit === 'g' ? ' selected' : '') + '>Grams (g)</option>' +
        '<option value="ml"' + (existing && existing.unit === 'ml' ? ' selected' : '') + '>Millilitres (ml)</option>' +
        '<option value="piece"' + (existing && existing.unit === 'piece' ? ' selected' : '') + '>Piece</option>' +
        '</select></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Purchase Price (' + appState.settings.currency + ')</label><input class="input-field" id="ing-price" type="number" step="0.01" min="0" value="' + (existing ? existing.purchasePrice : '') + '" placeholder="0"></div>' +
        '<div class="form-group"><label>Purchase Amount</label><input class="input-field" id="ing-amount" type="number" step="0.01" min="0.01" value="' + (existing ? existing.purchaseAmount : '') + '" placeholder="1"></div>' +
        '</div>';

    const footer =
        '<button class="btn btn-secondary" id="modal-cancel">Cancel</button>' +
        '<button class="btn btn-primary" id="modal-save">' + (isEdit ? 'Update' : 'Add Ingredient') + '</button>';

    openModal(isEdit ? 'Edit Ingredient' : 'Add Ingredient', body, footer);

    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', function () {
        var name = document.getElementById('ing-name').value.trim();
        if (!name) { showToast('Please enter a name.', 'error'); return; }

        var data = {
            name: name,
            unit: document.getElementById('ing-unit').value,
            purchasePrice: document.getElementById('ing-price').value,
            purchaseAmount: document.getElementById('ing-amount').value
        };

        if (isEdit) {
            updateIngredient(editId, data);
            showToast('Ingredient updated.', 'success');
        } else {
            addIngredient(data);
            showToast('Ingredient added!', 'success');
        }
        closeModal();
        renderIngredientList();
    });
}

// --- Render: Product List ---
var currentProductTab = 'sellable';

function renderProductList(tab) {
    if (tab) currentProductTab = tab;
    viewTitle.textContent = 'Products';
    headerActions.innerHTML = '<button class="btn btn-primary" id="btn-add-product">+ New Product</button>';

    // Split products into two groups
    var sellableProducts = appState.products.filter(function (p) { return !p.isAvailableAsIngredient || p.sellingPrice > 0; });
    var ingredientOnlyProducts = appState.products.filter(function (p) { return p.isAvailableAsIngredient && p.sellingPrice <= 0; });

    var activeList = currentProductTab === 'sellable' ? sellableProducts : ingredientOnlyProducts;

    let cardsHTML = '';
    for (let i = 0; i < activeList.length; i++) {
        var p = activeList[i];
        var profit = calculateProductProfit(p.id);
        var marginClass = profit.margin >= 0 ? 'text-green' : 'text-red';
        var ingredientBadge = p.isAvailableAsIngredient
            ? '<span class="use-as-ingredient-badge">📦 Used as ingredient</span>'
            : '';

        cardsHTML += '<div class="card product-card" data-id="' + p.id + '">' +
            '<div class="product-info">' +
            '<h3>' + escapeHTML(p.name) + '</h3>' +
            '<div class="product-meta">' +
            '<span>Yield: ' + p.yieldAmount + ' ' + p.yieldUnit + '</span>' +
            (currentProductTab === 'sellable' ? '<span>Selling: ' + formatCurrency(p.sellingPrice) + '/' + p.yieldUnit + '</span>' : '') +
            ingredientBadge +
            '</div>' +
            '</div>' +
            '<div class="product-stats">' +
            '<div class="stat"><span class="stat-value">' + formatCurrency(profit.totalCost) + '</span><span class="stat-label">Yield Cost</span></div>' +
            (currentProductTab === 'sellable' ? '<div class="stat"><span class="stat-value">' + formatCurrency(profit.yieldProfit) + '</span><span class="stat-label">Yield Profit</span></div>' : '') +
            '<div class="stat"><span class="stat-value">' + formatCurrency(profit.unitCost) + '</span><span class="stat-label">Unit Cost</span></div>' +
            (currentProductTab === 'sellable' ? '<div class="stat"><span class="stat-value">' + formatCurrency(profit.unitProfit) + '</span><span class="stat-label">Unit Profit</span></div>' : '') +
            (currentProductTab === 'sellable' ? '<div class="stat"><span class="stat-value ' + marginClass + '">' + profit.margin.toFixed(1) + '%</span><span class="stat-label">Margin</span></div>' : '') +
            '</div>' +
            '</div>';
    }

    var emptyMsg = currentProductTab === 'sellable'
        ? 'No products yet. Click "New Product" to create one.'
        : 'No sub-recipes yet. Create a product and check "Use as Ingredient" to see it here.';

    viewContainer.className = 'content-area view-products';
    viewContainer.innerHTML =
        '<div class="settings-tabs" style="margin-bottom:var(--space-lg)">' +
        '<button class="settings-tab' + (currentProductTab === 'sellable' ? ' active' : '') + '" data-product-tab="sellable">Products (' + sellableProducts.length + ')</button>' +
        '<button class="settings-tab' + (currentProductTab === 'ingredients' ? ' active' : '') + '" data-product-tab="ingredients">Sub-Recipes (' + ingredientOnlyProducts.length + ')</button>' +
        '</div>' +
        (activeList.length > 0
            ? '<div class="product-card-list">' + cardsHTML + '</div>'
            : '<div class="empty-state"><div class="empty-icon">' + (currentProductTab === 'sellable' ? '🍜' : '📦') + '</div><p>' + emptyMsg + '</p></div>');

    // Event: Tab switching
    var tabs = viewContainer.querySelectorAll('[data-product-tab]');
    tabs.forEach(function (t) {
        t.addEventListener('click', function () {
            renderProductList(t.dataset.productTab);
        });
    });

    // Event: Add
    var addBtn = document.getElementById('btn-add-product');
    if (addBtn) addBtn.addEventListener('click', function () { openProductModal(); });

    // Event: Click card -> detail view
    var cards = viewContainer.querySelectorAll('.product-card');
    cards.forEach(function (card) {
        card.addEventListener('click', function () {
            renderProductDetail(card.dataset.id);
        });
    });
}

// --- Modal: Product (Add/Edit basic info) ---
function openProductModal(editId) {
    const isEdit = !!editId;
    const existing = isEdit ? getProductById(editId) : null;

    const body =
        '<div class="form-group"><label>Product Name</label><input class="input-field" id="prod-name" value="' + (existing ? escapeHTML(existing.name) : '') + '" placeholder="e.g., Boba Milk Tea"></div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Yield Amount</label><input class="input-field" id="prod-yield" type="number" step="0.01" min="0.01" value="' + (existing ? existing.yieldAmount : '1') + '"></div>' +
        '<div class="form-group"><label>Yield Unit</label><select class="input-field" id="prod-yield-unit">' +
        '<option value="piece"' + (existing && existing.yieldUnit === 'piece' ? ' selected' : '') + '>Piece</option>' +
        '<option value="g"' + (existing && existing.yieldUnit === 'g' ? ' selected' : '') + '>Grams (g)</option>' +
        '<option value="ml"' + (existing && existing.yieldUnit === 'ml' ? ' selected' : '') + '>Millilitres (ml)</option>' +
        '</select></div>' +
        '</div>' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Selling Price per Unit (' + appState.settings.currency + ')</label><input class="input-field" id="prod-price" type="number" step="0.01" min="0" value="' + (existing ? existing.sellingPrice : '') + '" placeholder="0"></div>' +
        '<div class="form-group"><label>Labor Cost Override (optional)</label><input class="input-field" id="prod-labor" type="number" step="0.01" min="0" value="' + (existing && existing.laborCostOverride !== null ? existing.laborCostOverride : '') + '" placeholder="Use global"></div>' +
        '</div>';

    const footer =
        '<button class="btn btn-secondary" id="modal-cancel">Cancel</button>' +
        '<button class="btn btn-primary" id="modal-save">' + (isEdit ? 'Update' : 'Create Product') + '</button>';

    openModal(isEdit ? 'Edit Product' : 'New Product', body, footer);

    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', function () {
        var name = document.getElementById('prod-name').value.trim();
        if (!name) { showToast('Please enter a name.', 'error'); return; }

        var laborVal = document.getElementById('prod-labor').value;
        var data = {
            name: name,
            yieldAmount: document.getElementById('prod-yield').value,
            yieldUnit: document.getElementById('prod-yield-unit').value,
            sellingPrice: document.getElementById('prod-price').value,
            laborCostOverride: laborVal === '' ? null : laborVal
        };

        if (isEdit) {
            updateProduct(editId, data);
            showToast('Product updated.', 'success');
            renderProductDetail(editId);
        } else {
            var newProd = addProduct(data);
            showToast('Product created!', 'success');
            renderProductDetail(newProd.id);
        }
        closeModal();
    });
}

// --- Render: Product Detail ---
function renderProductDetail(productId) {
    const product = getProductById(productId);
    if (!product) {
        renderProductList();
        return;
    }

    viewTitle.textContent = product.name;
    headerActions.innerHTML = '';

    const profit = calculateProductProfit(productId);
    const marginClass = profit.margin >= 0 ? 'text-green' : 'text-red';

    // Recipe items
    let recipeHTML = '';
    for (let i = 0; i < product.ingredients.length; i++) {
        var item = product.ingredients[i];
        var comp = getIngredientById(item.id) || getProductById(item.id);
        var compName = comp ? comp.name : 'Unknown';
        var compUnit = comp ? (comp.unit || comp.yieldUnit) : '';
        var itemCost = getRecipeItemCost(item.id, item.amount);

        recipeHTML += '<div class="recipe-item">' +
            '<span class="item-name">' + escapeHTML(compName) + (getProductById(item.id) ? ' <span class="badge badge-purple">product</span>' : '') + '</span>' +
            '<span class="item-amount">' + formatDisplayUnit(item.amount, compUnit) + '</span>' +
            '<span class="item-cost">' + formatCurrency(itemCost) + '</span>' +
            '<button class="btn-icon btn-remove-recipe-item" data-index="' + i + '" title="Remove">✕</button>' +
            '</div>';
    }

    viewContainer.className = 'content-area view-product-detail';
    viewContainer.innerHTML =
        '<div class="detail-header">' +
        '<div><button class="btn btn-secondary back-btn" id="btn-back-products">← Back to Products</button></div>' +
        '<div class="detail-actions">' +
        '<div class="checkbox-group">' +
        '<input type="checkbox" id="chk-use-as-ingredient"' + (product.isAvailableAsIngredient ? ' checked' : '') + '>' +
        '<label for="chk-use-as-ingredient">Use as Ingredient</label>' +
        '</div>' +
        '<button class="btn btn-secondary" id="btn-edit-product">✏️ Edit Info</button>' +
        '<button class="btn btn-danger btn-sm" id="btn-delete-product">Delete</button>' +
        '</div>' +
        '</div>' +

        // Summary stats
        '<div class="detail-summary">' +
        '<div class="card summary-stat"><div class="stat-value">' + product.yieldAmount + ' ' + product.yieldUnit + '</div><div class="stat-label">Yield</div></div>' +
        '<div class="card summary-stat"><div class="stat-value">' + formatCurrency(profit.totalCost) + '</div><div class="stat-label">Total Cost</div></div>' +
        '<div class="card summary-stat"><div class="stat-value">' + formatCurrency(profit.unitCost) + '</div><div class="stat-label">Unit Cost</div></div>' +
        '<div class="card summary-stat"><div class="stat-value">' + formatCurrency(product.sellingPrice) + '</div><div class="stat-label">Selling Price</div></div>' +
        '<div class="card summary-stat"><div class="stat-value ' + marginClass + '">' + formatCurrency(profit.unitProfit) + '</div><div class="stat-label">Unit Profit</div></div>' +
        '<div class="card summary-stat"><div class="stat-value ' + marginClass + '">' + profit.margin.toFixed(1) + '%</div><div class="stat-label">Margin</div></div>' +
        '</div>' +

        // Recipe section
        '<div class="recipe-section">' +
        '<div class="recipe-section-header">' +
        '<h2>Recipe</h2>' +
        '<button class="btn btn-primary btn-sm" id="btn-add-recipe-item">+ Add Ingredient</button>' +
        '</div>' +
        (product.ingredients.length > 0
            ? '<div class="recipe-list">' + recipeHTML + '</div>' +
            '<div class="recipe-total-footer"><span>Total Ingredients Cost</span><span>' + formatCurrency(profit.ingredientsCost) + '</span></div>' +
            '<div class="recipe-total-footer" style="margin-top:var(--space-sm);"><span>Labor Cost</span><span>' + formatCurrency(profit.laborCost) + '</span></div>'
            : '<div class="empty-state"><div class="empty-icon">📋</div><p>No ingredients in this recipe yet.</p></div>') +
        '</div>';

    // --- Events ---
    document.getElementById('btn-back-products').addEventListener('click', function () {
        renderProductList();
        setActiveNav('products');
    });

    document.getElementById('btn-edit-product').addEventListener('click', function () {
        openProductModal(productId);
    });

    document.getElementById('btn-delete-product').addEventListener('click', function () {
        var result = deleteProduct(productId);
        if (result.error) {
            showToast(result.message, 'error');
        } else {
            showToast('Product deleted.', 'success');
            renderProductList();
            setActiveNav('products');
        }
    });

    document.getElementById('chk-use-as-ingredient').addEventListener('change', function () {
        // If unchecking, verify it's not used elsewhere
        if (!this.checked) {
            for (var i = 0; i < appState.products.length; i++) {
                var p = appState.products[i];
                if (p.id === productId) continue;
                if (p.ingredients.some(function (item) { return item.id === productId; })) {
                    showToast('Cannot uncheck: used in "' + p.name + '"', 'error');
                    this.checked = true;
                    return;
                }
            }
        }
        updateProduct(productId, { isAvailableAsIngredient: this.checked });
        showToast(this.checked ? 'Now available as ingredient.' : 'Removed from ingredients list.', 'success');
    });

    document.getElementById('btn-add-recipe-item').addEventListener('click', function () {
        openRecipeItemModal(productId);
    });

    // Remove recipe item buttons
    var removeBtns = viewContainer.querySelectorAll('.btn-remove-recipe-item');
    removeBtns.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var idx = parseInt(btn.dataset.index);
            product.ingredients.splice(idx, 1);
            updateProduct(productId, { ingredients: product.ingredients });
            showToast('Ingredient removed from recipe.', 'success');
            renderProductDetail(productId);
        });
    });
}

// --- Modal: Add Recipe Item ---
function openRecipeItemModal(productId) {
    const available = getAvailableIngredientsForProduct(productId);

    if (available.length === 0) {
        showToast('No ingredients available. Add some ingredients first!', 'error');
        return;
    }

    const body =
        '<div class="form-group">' +
        '<label>Search Ingredient</label>' +
        '<input class="input-field" id="recipe-search" type="text" placeholder="\uD83D\uDD0D Type to search..." autocomplete="off">' +
        '<div class="search-results" id="recipe-search-results"></div>' +
        '<input type="hidden" id="recipe-ingredient-id">' +
        '<div class="selected-ingredient" id="recipe-selected" style="display:none;"></div>' +
        '</div>' +
        '<div class="form-group"><label>Amount (<span id="recipe-unit-label">—</span>)</label><input class="input-field" id="recipe-amount" type="number" step="0.01" min="0.01" placeholder="0"></div>';

    const footer =
        '<button class="btn btn-secondary" id="modal-cancel">Cancel</button>' +
        '<button class="btn btn-primary" id="modal-save">Add to Recipe</button>';

    openModal('Add Ingredient to Recipe', body, footer);

    var searchInput = document.getElementById('recipe-search');
    var resultsDiv = document.getElementById('recipe-search-results');
    var hiddenId = document.getElementById('recipe-ingredient-id');
    var selectedDiv = document.getElementById('recipe-selected');

    function renderSearchResults(query) {
        var filtered = available.filter(function (item) {
            if (!query) return true;
            return item.name.toLowerCase().indexOf(query.toLowerCase()) >= 0;
        });

        if (filtered.length === 0) {
            resultsDiv.innerHTML = '<div class="search-result-item text-muted">No results found</div>';
        } else {
            resultsDiv.innerHTML = filtered.map(function (item) {
                return '<div class="search-result-item" data-id="' + item.id + '" data-unit="' + item.unit + '" data-name="' + escapeHTML(item.name) + '">' +
                    '<span>' + escapeHTML(item.name) + '</span>' +
                    '<span class="unit-badge">' + item.unit + '</span>' +
                    '</div>';
            }).join('');
        }
        resultsDiv.style.display = 'block';

        // Attach click events to results
        resultsDiv.querySelectorAll('.search-result-item[data-id]').forEach(function (el) {
            el.addEventListener('click', function () {
                hiddenId.value = el.dataset.id;
                searchInput.value = el.dataset.name;
                document.getElementById('recipe-unit-label').textContent = el.dataset.unit;
                selectedDiv.innerHTML = '<span class="badge badge-purple">' + escapeHTML(el.dataset.name) + ' (' + el.dataset.unit + ')</span> <button class="btn-icon btn-clear-selection" style="font-size:0.8rem;" title="Clear">✕</button>';
                selectedDiv.style.display = 'flex';
                resultsDiv.style.display = 'none';
                // Clear selection event
                selectedDiv.querySelector('.btn-clear-selection').addEventListener('click', function () {
                    hiddenId.value = '';
                    searchInput.value = '';
                    selectedDiv.style.display = 'none';
                    document.getElementById('recipe-unit-label').textContent = '\u2014';
                    searchInput.focus();
                });
            });
        });
    }

    // Show all results on focus
    searchInput.addEventListener('focus', function () {
        if (!hiddenId.value) renderSearchResults(searchInput.value);
    });

    searchInput.addEventListener('input', function () {
        hiddenId.value = '';
        selectedDiv.style.display = 'none';
        renderSearchResults(this.value);
    });

    // Close results when clicking outside
    document.addEventListener('click', function closeResults(e) {
        if (!resultsDiv.contains(e.target) && e.target !== searchInput) {
            resultsDiv.style.display = 'none';
        }
    });

    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', function () {
        var ingId = hiddenId.value;
        if (!ingId) { showToast('Please select an ingredient.', 'error'); return; }
        var amount = parseFloat(document.getElementById('recipe-amount').value);
        if (!amount || amount <= 0) { showToast('Please enter a valid amount.', 'error'); return; }

        var product = getProductById(productId);
        // Check if already in recipe
        var existingIdx = product.ingredients.findIndex(function (item) { return item.id === ingId; });
        if (existingIdx >= 0) {
            product.ingredients[existingIdx].amount += amount;
        } else {
            product.ingredients.push({ id: ingId, amount: amount });
        }
        updateProduct(productId, { ingredients: product.ingredients });
        showToast('Ingredient added to recipe!', 'success');
        closeModal();
        renderProductDetail(productId);
    });
}

// --- Render: Settings ---
function renderSettings() {
    viewTitle.textContent = 'Settings';
    headerActions.innerHTML = '';

    viewContainer.className = 'content-area view-settings';
    viewContainer.innerHTML =
        '<div class="settings-tabs">' +
        '<button class="settings-tab active" data-tab="general">General</button>' +
        '<button class="settings-tab" data-tab="data">Data</button>' +
        '<button class="settings-tab" data-tab="about">About</button>' +
        '</div>' +

        // Tab: General
        '<div class="tab-content active" id="tab-general">' +
        '<div class="card settings-section">' +
        '<h3>Global Costs</h3>' +
        '<div class="form-group"><label>Default Labor Cost (' + appState.settings.currency + ')</label>' +
        '<input class="input-field" id="settings-labor" type="number" step="0.01" min="0" value="' + appState.settings.globalLaborCost + '">' +
        '</div>' +
        '<div class="form-group"><label>Currency</label>' +
        '<input class="input-field" id="settings-currency" value="' + escapeHTML(appState.settings.currency) + '" placeholder="TWD">' +
        '</div>' +
        '<button class="btn btn-primary" id="btn-save-settings">Save Settings</button>' +
        '</div>' +
        '</div>' +

        // Tab: Data
        '<div class="tab-content" id="tab-data">' +
        '<div class="card settings-section">' +
        '<h3>Export & Import</h3>' +
        '<p class="text-secondary" style="margin-bottom:var(--space-md);font-size:var(--font-size-sm);">Export your data as a JSON file to back up or transfer to another device.</p>' +
        '<div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-xl);">' +
        '<button class="btn btn-primary" id="btn-export">📥 Export JSON</button>' +
        '<label class="btn btn-secondary" style="cursor:pointer;">📤 Import JSON<input type="file" id="btn-import" accept=".json" style="display:none;"></label>' +
        '</div>' +
        '</div>' +
        '<div class="danger-zone">' +
        '<h3 style="color:var(--accent-red);margin-bottom:var(--space-sm);">⚠️ Danger Zone</h3>' +
        '<p>This will permanently delete all your ingredients, products, and settings.</p>' +
        '<button class="btn btn-danger" id="btn-clear-all">Clear All Data</button>' +
        '</div>' +
        '</div>' +

        // Tab: About
        '<div class="tab-content" id="tab-about">' +
        '<div class="card settings-section">' +
        '<h3>NightCalc v1.0</h3>' +
        '<p class="text-secondary" style="font-size:var(--font-size-sm);">A lightweight cost calculator for night market vendors. No frameworks, no server, no installation required. Your data stays on your device.</p>' +
        '</div>' +
        '</div>';

    // --- Tab switching ---
    var tabs = viewContainer.querySelectorAll('.settings-tab');
    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
            viewContainer.querySelectorAll('.tab-content').forEach(function (tc) { tc.classList.remove('active'); });
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    // --- Save settings ---
    document.getElementById('btn-save-settings').addEventListener('click', function () {
        appState.settings.globalLaborCost = parseFloat(document.getElementById('settings-labor').value) || 0;
        appState.settings.currency = document.getElementById('settings-currency').value.trim() || 'TWD';
        saveData();
        showToast('Settings saved!', 'success');
    });

    // --- Export ---
    document.getElementById('btn-export').addEventListener('click', function () {
        exportToJSON();
        showToast('Data exported!', 'success');
    });

    // --- Import ---
    document.getElementById('btn-import').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        importFromJSON(file).then(function () {
            showToast('Data imported successfully!', 'success');
            renderSettings();
        }).catch(function (err) {
            showToast('Import failed: ' + err, 'error');
        });
    });

    // --- Clear all ---
    document.getElementById('btn-clear-all').addEventListener('click', function () {
        if (confirm('Are you sure? This will delete ALL data permanently.')) {
            clearAllData();
            showToast('All data cleared.', 'success');
            renderSettings();
        }
    });
}

// --- Nav Helpers ---
function setActiveNav(viewName) {
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.toggle('active', item.dataset.view === viewName);
    });
}

// --- HTML Escape ---
function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
