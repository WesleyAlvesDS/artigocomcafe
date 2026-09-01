<style>
/*
 * ═══════════════════════════════════════════════════════════════
 * TEMA ARTIGO COM CAFÉ — Filament Custom Theme
 * Paleta: Café (#B27C4E) + Marfim (#FDFCF8) + Marrom (#4A2E15)
 * ═══════════════════════════════════════════════════════════════
 */

/* ── Variáveis ──────────────────────────────────────────────── */
:root {
    --cafe-primary: #B27C4E;
    --cafe-primary-dark: #96653A;
    --cafe-primary-light: #D4A76A;
    --cafe-secondary: #D9A05B;
    --cafe-bg: #FDFCF8;
    --cafe-bg-warm: #F5EEDB;
    --cafe-text: #4A2E15;
    --cafe-text-muted: #8B7355;
    --cafe-border: #E5D9C5;
    --cafe-surface: #FFFFFF;
    --cafe-surface-hover: #FAF6F0;
    --cafe-accent-glow: rgba(178, 124, 78, 0.15);
    --cafe-shadow: 0 4px 24px rgba(74, 46, 21, 0.08);
    --cafe-shadow-hover: 0 8px 32px rgba(74, 46, 21, 0.12);
    --cafe-radius: 14px;
    --cafe-radius-lg: 20px;
    --cafe-transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
    --cafe-bg: #0F0D0A;
    --cafe-bg-warm: #1A1610;
    --cafe-text: #F5EEDB;
    --cafe-text-muted: #B8A88A;
    --cafe-border: rgba(178, 124, 78, 0.15);
    --cafe-surface: #1A1610;
    --cafe-surface-hover: #252015;
    --cafe-accent-glow: rgba(178, 124, 78, 0.1);
    --cafe-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
    --cafe-shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* ── Layout ─────────────────────────────────────────────────── */
body, .fi-body { background: var(--cafe-bg) !important; color: var(--cafe-text) !important; }
.fi-page, .fi-main, .fi-page-content { background: var(--cafe-bg) !important; }

/* Sidebar */
.fi-sidebar, .fi-page-sidebar, .fi-nav-sidebar {
    background: var(--cafe-bg-warm) !important;
    border-color: var(--cafe-border) !important;
}
.dark .fi-sidebar, .dark .fi-page-sidebar, .dark .fi-nav-sidebar {
    background: var(--cafe-bg) !important;
}

/* Topbar */
.fi-topbar, .fi-header, .fi-page-header {
    background: color-mix(in srgb, var(--cafe-surface) 90%, transparent) !important;
    backdrop-filter: blur(20px) saturate(180%) !important;
    border-color: var(--cafe-border) !important;
}

/* ── Cards ──────────────────────────────────────────────────── */
.fi-card, .fi-section, .fi-widget {
    background: var(--cafe-surface) !important;
    border: 1px solid var(--cafe-border) !important;
    border-radius: var(--cafe-radius) !important;
    box-shadow: var(--cafe-shadow) !important;
    transition: all var(--cafe-transition) !important;
}
.fi-card:hover, .fi-section:hover, .fi-widget:hover {
    box-shadow: var(--cafe-shadow-hover) !important;
}

/* ── Botões ─────────────────────────────────────────────────── */
.fi-btn-primary, .fi-color-primary .fi-btn {
    background: linear-gradient(135deg, var(--cafe-primary), var(--cafe-primary-dark)) !important;
    border: none !important;
    color: white !important;
    box-shadow: 0 4px 16px var(--cafe-accent-glow) !important;
    border-radius: 12px !important;
    transition: all var(--cafe-transition) !important;
}
.fi-btn-primary:hover, .fi-color-primary .fi-btn:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 6px 24px var(--cafe-accent-glow) !important;
}
.fi-btn, button.fi-btn { border-radius: 12px !important; transition: all var(--cafe-transition) !important; }

/* ── Sidebar Nav ────────────────────────────────────────────── */
.fi-sidebar-item, .fi-nav-item {
    border-radius: 12px !important;
    transition: all var(--cafe-transition) !important;
    margin: 2px 8px !important;
    padding: 10px 14px !important;
}
.fi-sidebar-item:hover, .fi-nav-item:hover {
    background: var(--cafe-surface-hover) !important;
    transform: translateX(2px) !important;
}
.fi-sidebar-item-active, .fi-nav-item-active {
    background: linear-gradient(135deg, rgba(178, 124, 78, 0.12), rgba(217, 160, 91, 0.08)) !important;
    color: var(--cafe-primary) !important;
    font-weight: 600 !important;
}

/* ── Inputs ─────────────────────────────────────────────────── */
.fi-input, .fi-fo-input, .fi-select, .fi-textarea,
input[type="text"], input[type="email"], input[type="password"],
input[type="search"], input[type="number"], input[type="url"],
input[type="tel"], textarea, select {
    border: 1.5px solid var(--cafe-border) !important;
    border-radius: 12px !important;
    background: var(--cafe-surface) !important;
    color: var(--cafe-text) !important;
    transition: all var(--cafe-transition) !important;
}
.fi-input:focus, .fi-fo-input:focus, .fi-select:focus, .fi-textarea:focus,
input:focus, textarea:focus, select:focus {
    border-color: var(--cafe-primary) !important;
    box-shadow: 0 0 0 3px var(--cafe-accent-glow) !important;
}

/* ── Badges ─────────────────────────────────────────────────── */
.fi-badge { border-radius: 100px !important; font-weight: 600 !important; }
.fi-badge-primary, .fi-color-primary .fi-badge {
    background: linear-gradient(135deg, var(--cafe-primary), var(--cafe-secondary)) !important;
    color: white !important;
}

/* ── Tables ─────────────────────────────────────────────────── */
.fi-table { border-radius: var(--cafe-radius) !important; overflow: hidden !important; border: 1px solid var(--cafe-border) !important; }
.fi-table-header { background: var(--cafe-surface-hover) !important; border-color: var(--cafe-border) !important; }
.fi-table-row { border-color: var(--cafe-border) !important; transition: background var(--cafe-transition) !important; }
.fi-table-row:hover { background: var(--cafe-surface-hover) !important; }

/* ── Modal ──────────────────────────────────────────────────── */
.fi-modal-window { border-radius: 24px !important; border: 1px solid var(--cafe-border) !important; box-shadow: 0 25px 80px rgba(74, 46, 21, 0.2) !important; }
.fi-dropdown-panel { border-radius: var(--cafe-radius) !important; border: 1px solid var(--cafe-border) !important; box-shadow: var(--cafe-shadow-hover) !important; background: var(--cafe-surface) !important; }

/* ── Tabs ───────────────────────────────────────────────────── */
.fi-tabs-item { border-radius: 10px !important; transition: all var(--cafe-transition) !important; }
.fi-tabs-item:hover { background: var(--cafe-surface-hover) !important; }
.fi-tabs-item-active { background: linear-gradient(135deg, rgba(178, 124, 78, 0.12), rgba(217, 160, 91, 0.08)) !important; color: var(--cafe-primary) !important; font-weight: 600 !important; }

/* ── Pagination ─────────────────────────────────────────────── */
.fi-pagination-item { border-radius: 10px !important; transition: all var(--cafe-transition) !important; }
.fi-pagination-item:hover { background: var(--cafe-surface-hover) !important; }
.fi-pagination-item-active { background: linear-gradient(135deg, var(--cafe-primary), var(--cafe-primary-dark)) !important; color: white !important; }

/* ── Toggle ─────────────────────────────────────────────────── */
.fi-toggle-input:checked + .fi-toggle-bg { background: linear-gradient(135deg, var(--cafe-primary), var(--cafe-primary-dark)) !important; }

/* ── Headers ────────────────────────────────────────────────── */
.fi-header-heading, h1, h2, h3, h4, h5, h6 {
    font-family: 'Cormorant Garamond', serif !important;
    color: var(--cafe-text) !important;
}

/* ── Links ──────────────────────────────────────────────────── */
a { color: var(--cafe-primary); transition: color var(--cafe-transition); }
a:hover { color: var(--cafe-primary-dark); }

/* ── Scrollbar ──────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--cafe-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--cafe-primary-light); }

/* ── Animações ──────────────────────────────────────────────── */
@keyframes cafe-fade-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.fi-main > * { animation: cafe-fade-in 0.4s ease-out both; }

/* ── Scroll Progress ────────────────────────────────────────── */
.scroll-progress { position: fixed; top: 0; left: 0; height: 3px; background: linear-gradient(90deg, var(--cafe-primary), var(--cafe-secondary)); z-index: 9999; transition: width 100ms linear; }

/* ── Focus ──────────────────────────────────────────────────── */
:focus-visible { outline: 2px solid var(--cafe-primary); outline-offset: 2px; border-radius: 4px; }
::selection { background: color-mix(in srgb, var(--cafe-primary) 30%, transparent); color: var(--cafe-text); }

/* ── Mobile ─────────────────────────────────────────────────── */
@media (max-width: 1023px) {
    /* Hide Filament sidebar on mobile — custom drawer replaces it */
    .fi-sidebar, .fi-page-sidebar, .fi-nav-sidebar {
        display: none !important;
    }
    /* Remove sidebar toggle button on mobile */
    .fi-sidebar-btn, .fi-page-sidebar-btn {
        display: none !important;
    }
    /* Adjust topbar for mobile */
    .fi-topbar, .fi-header {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
    }
    /* Modal adjustments */
    .fi-modal-window {
        margin: 1rem !important;
        max-height: calc(100vh - 2rem) !important;
        border-radius: 20px !important;
    }
    /* Toast positioning above bottom nav */
    .fi-notification, .fi-toast {
        bottom: 5rem !important;
    }
}

/* ── Mobile Small (< 380px) ───────────────────────────────── */
@media (max-width: 380px) {
    .fi-modal-window {
        margin: 0.5rem !important;
        border-radius: 16px !important;
    }
    .fi-input, .fi-fo-input, input[type="text"], input[type="email"], input[type="password"] {
        padding: 0.625rem 0.75rem !important;
        font-size: 0.875rem !important;
    }
}

/* ── Print ──────────────────────────────────────────────────── */
@media print {
    .fi-sidebar, .fi-header, .fi-footer, .scroll-progress { display: none !important; }
}
</style>
