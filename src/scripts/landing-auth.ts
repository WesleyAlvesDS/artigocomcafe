/**
 * Landing auth — toggles landing view visibility based on auth state.
 * Hides landing section when user is logged in (shows personalized feed).
 */
export function initLandingAuth() {
  function updateLanding() {
    const landing = document.getElementById('landing-view');
    const token = localStorage.getItem('auth_token');
    if (landing) {
      landing.style.display = token ? 'none' : '';
    }
  }

  updateLanding();
  window.addEventListener('auth:changed', updateLanding);
}
