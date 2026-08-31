/**
 * App scripts — barrel export for all client-side modules.
 * Each module exports an init function that sets up its functionality.
 */
export { initTheme } from './theme';
export { initScrollReveal } from './scroll-reveal';
export { initScrollAnimations } from './scroll-animations';
export { initScrollProgress } from './scroll-progress';
export { initMicroInteractions } from './micro-interactions';
export { initBackToTop } from './back-to-top';
export { initSwipeNav } from './swipe-nav';
export { initLightbox } from './lightbox';
export { initFaqAccordion } from './faq-accordion';
export { initMaintenanceBar } from './maintenance-bar';
export { initDashboardNav } from './dashboard-nav';
export { initLandingAuth } from './landing-auth';
export { initStudyMode } from './study-mode';
export { initPwa } from './pwa';

// Smart Sidebar modules
export { initReadingProgress, initScrollSpy } from './sidebar-reading';
export {
  initFontControls,
  initReadingThemes,
  initCopyLink,
  initShareButton,
  initReadingTime,
  initLazyRelated,
} from './sidebar-controls';
