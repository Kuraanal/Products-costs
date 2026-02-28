/* ============================================
   APP.JS — Core Application Controller
   ============================================ */

(function () {
    'use strict';

    // --- Initialize ---
    document.addEventListener('DOMContentLoaded', function () {
        loadData();
        renderDashboard();
        initNavigation();
        initMobileMenu();
    });

    // --- Navigation ---
    function initNavigation() {
        var navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(function (item) {
            item.addEventListener('click', function () {
                var view = item.dataset.view;
                navigateTo(view);
            });
        });
    }

    function navigateTo(view) {
        setActiveNav(view);
        switch (view) {
            case 'dashboard':
                renderDashboard();
                break;
            case 'ingredients':
                renderIngredientList();
                break;
            case 'products':
                renderProductList();
                break;
            case 'settings':
                renderSettings();
                break;
            default:
                renderDashboard();
        }
    }

    // --- Mobile Menu ---
    function initMobileMenu() {
        var toggle = document.getElementById('menu-toggle');
        var sidebar = document.getElementById('sidebar');

        toggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when navigating on mobile
        var navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(function (item) {
            item.addEventListener('click', function () {
                sidebar.classList.remove('open');
            });
        });
    }
})();
