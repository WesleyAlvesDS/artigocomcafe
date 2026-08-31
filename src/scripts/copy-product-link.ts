/**
 * Copy product link — handles clipboard copy for product share buttons.
 */
export function initCopyProductLink() {
  const copyBtn = document.getElementById('copy-product-link');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    const url = copyBtn.getAttribute('data-url');
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      copyBtn.style.color = 'var(--color-accent)';
      setTimeout(() => {
        copyBtn.style.color = '';
      }, 2000);
    } catch (_) {}
  });
}
