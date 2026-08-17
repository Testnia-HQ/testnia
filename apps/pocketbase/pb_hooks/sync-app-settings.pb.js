/// <reference path="../pb_data/types.d.ts" />
// Keeps PocketBase meta settings (appURL/appName) in sync with env vars on every
// boot. This matters for existing databases where the settings migration has
// already run: the appURL is baked in as the old Horizons preview URL, which
// breaks email link generation once the stack moves to a VPS domain.
onBeforeBootstrap((e) => {
    const appName = $os.getenv("PB_APP_NAME");
    const appURL = $os.getenv("PB_APP_URL");

    if (!appName && !appURL) {
        return;
    }

    const settings = e.app.settings();

    if (appName && settings.meta.appName !== appName) {
        settings.meta.appName = appName;
    }

    if (appURL && settings.meta.appURL !== appURL) {
        settings.meta.appURL = appURL;
    }

    e.app.save(settings);
});
