/**
 * @file src/install-helper.js
 * @description Renders an OS-aware offline installation helper for parents when running in a browser tab.
 *              Automatically hides once launched in standalone Home Screen mode.
 */

export function initInstallHelper(bannerEl) {
  if (!bannerEl) return;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (isStandalone) {
    bannerEl.classList.remove('visible');
    return;
  }

  let deferredPrompt = null;

  // 1. Android / Chrome / Edge / Samsung Internet 1-Tap Install Intercept
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    bannerEl.innerHTML = `
      <span><strong>Parents:</strong> Save this app for 100% offline play (Airplane Mode ready).</span>
      <div style="display:flex; gap:8px; align-items:center;">
        <button id="btn-pwa-install" class="install-btn" type="button">📲 Tap Here to Install App for Offline Play</button>
        <button id="btn-pwa-dismiss" class="install-dismiss" type="button" aria-label="Dismiss">✕</button>
      </div>
    `;
    bannerEl.classList.add('visible');

    const installBtn = document.getElementById('btn-pwa-install');
    const dismissBtn = document.getElementById('btn-pwa-dismiss');

    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        bannerEl.classList.remove('visible');
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        bannerEl.classList.remove('visible');
      });
    }
  });

  // 2. iPadOS / iOS Safari Detection (including desktop-class iPadOS User-Agent)
  const ua = window.navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    bannerEl.innerHTML = `
      <span><strong>Parents (iPad / iPhone):</strong> To save as an offline app, tap <strong>Share [⍐]</strong> in Safari, then tap <strong>Add to Home Screen [➕]</strong>.</span>
      <button id="btn-ios-dismiss" class="install-dismiss" type="button" aria-label="Dismiss">✕</button>
    `;
    bannerEl.classList.add('visible');

    const dismissBtn = document.getElementById('btn-ios-dismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        bannerEl.classList.remove('visible');
      });
    }
  }
}
