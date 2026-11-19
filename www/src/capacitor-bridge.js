/* Capacitor bridge (classic script, runs BEFORE the app's inline script).
   Exposes the native plugins on window.Capacitor.Plugins so the app can use
   LocalNotifications (reminders), Filesystem + Share (backup export) and App (quit). */
(function () {
  var cap = window.Capacitor;
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) return;
  cap.Plugins = cap.Plugins || {};
  ['LocalNotifications', 'Filesystem', 'Share', 'App'].forEach(function (name) {
    if (cap.Plugins[name]) return;
    try { cap.Plugins[name] = cap.registerPlugin(name); } catch (e) { console.warn('Plugin not available: ' + name, e); }
  });
})();
