/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // 1. Add auto_renew + start_date to subscriptions
    const subs = app.findCollectionByNameOrId("subscriptions");
    if (!subs.fields.getByName("auto_renew")) {
      subs.fields.add(new BoolField({ name: "auto_renew" }));
    }
    if (!subs.fields.getByName("start_date")) {
      subs.fields.add(new DateField({ name: "start_date" }));
    }
    app.save(subs);

    // 2. Add provider field to payments
    const payments = app.findCollectionByNameOrId("payments");
    if (!payments.fields.getByName("provider")) {
      payments.fields.add(new TextField({ name: "provider", max: 60 }));
    }
    app.save(payments);

    // 3. Create ads collection
    let ads;
    try {
      ads = app.findCollectionByNameOrId("ads");
    } catch (_) {
      ads = new Collection({
        type: "base",
        name: "ads",
        listRule: "",
        viewRule: "",
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "title", type: "text", max: 200 },
          { name: "image_url", type: "text", max: 2000 },
          { name: "link_url", type: "text", max: 2000 },
          {
            name: "placement",
            type: "select",
            maxSelect: 1,
            values: ["dashboard", "practice", "leaderboard", "all"],
          },
          { name: "active", type: "bool" },
          { name: "impressions", type: "number", onlyInt: true },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
          { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
        ],
      });
      app.save(ads);
    }

    // 4. Create ad_impressions collection
    try {
      app.findCollectionByNameOrId("ad_impressions");
    } catch (_) {
      const impr = new Collection({
        type: "base",
        name: "ad_impressions",
        listRule: null,
        viewRule: null,
        createRule: "",
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: "ad_id", type: "text", max: 20 },
          { name: "user_id", type: "text", max: 20 },
          { name: "placement", type: "text", max: 40 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        ],
        indexes: ["CREATE INDEX idx_imp_ad ON ad_impressions (ad_id)"],
      });
      app.save(impr);
    }

    // 5. Seed a placeholder ad for each placement
    const adSeeds = [
      {
        title: "Boost Your WAEC Score",
        image_url: "https://placehold.co/728x90/0066CC/ffffff?text=Testnia+Premium+%E2%80%94+Upgrade+Today",
        link_url: "/upgrade",
        placement: "dashboard",
        active: true,
        impressions: 0,
      },
      {
        title: "Go Premium — Unlimited Practice",
        image_url: "https://placehold.co/728x90/0066CC/ffffff?text=Unlock+Unlimited+Questions+%E2%80%94+Go+Premium",
        link_url: "/upgrade",
        placement: "practice",
        active: true,
        impressions: 0,
      },
      {
        title: "Join the Leaderboard Heroes",
        image_url: "https://placehold.co/728x90/0066CC/ffffff?text=Premium+Users+Dominate+the+Leaderboard",
        link_url: "/upgrade",
        placement: "leaderboard",
        active: true,
        impressions: 0,
      },
    ];

    for (const seed of adSeeds) {
      const r = new Record(ads);
      r.load(seed);
      app.save(r);
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("ad_impressions"));
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId("ads"));
    } catch (_) {}

    try {
      const payments = app.findCollectionByNameOrId("payments");
      payments.fields.removeByName("provider");
      app.save(payments);
    } catch (_) {}

    try {
      const subs = app.findCollectionByNameOrId("subscriptions");
      subs.fields.removeByName("auto_renew");
      subs.fields.removeByName("start_date");
      app.save(subs);
    } catch (_) {}
  },
);
