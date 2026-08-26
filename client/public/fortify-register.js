/* Register Fortify's small installable-app shell before the React bundle loads. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/fortify-sw.js").catch((error) => {
      console.warn("[PWA] Service worker registration failed", error);
    });
  });
}
