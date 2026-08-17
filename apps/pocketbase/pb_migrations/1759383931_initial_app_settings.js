/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
    let settings = app.settings()

    settings.meta.appName = $os.getenv("PB_APP_NAME") || "cbad1937-bb56-434d-a825-32adef78986b.app-preview.com"
    settings.meta.appURL = $os.getenv("PB_APP_URL") || "https://cbad1937-bb56-434d-a825-32adef78986b.app-preview.com/hcgi/platform"
    settings.meta.hideControls = true

    settings.logs.maxDays = 7
    settings.logs.minLevel = 8
    settings.logs.logIP = true
    
    settings.trustedProxy.headers = [
        "X-Real-IP",
        "X-Forwarded-For",
        "CF-Connecting-IP",
    ]

    app.save(settings)
})
