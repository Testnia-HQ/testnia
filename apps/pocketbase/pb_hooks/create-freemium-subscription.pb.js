/// <reference path="../pb_data/types.d.ts" />

// Auto-create a freemium subscription when a new user signs up
onRecordAfterCreateSuccess((e) => {
  try {
    const subs = $app.findCollectionByNameOrId("subscriptions");
    const sub = new Record(subs);
    sub.set("user", e.record.id);
    sub.set("plan", "free");
    sub.set("status", "active");
    sub.set("auto_renew", false);
    sub.set("start_date", new Date().toISOString());
    $app.save(sub);
  } catch (err) {
    $app.logger().error("Failed to create freemium subscription", "userId", e.record.id, "err", String(err));
  }
  e.next();
}, "users");
