/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Add resolved_at to support_tickets
    const tickets = app.findCollectionByNameOrId("support_tickets");
    try {
      tickets.fields.getByName("resolved_at");
    } catch (_) {
      tickets.fields.add(new DateField({ name: "resolved_at", required: false }));
      app.save(tickets);
    }

    // Create ticket_messages collection
    let tm;
    try {
      tm = app.findCollectionByNameOrId("ticket_messages");
    } catch (_) {
      tm = new Collection({
        type: "base",
        name: "ticket_messages",
        listRule: "@request.auth.id != '' && ticket.user = @request.auth.id",
        viewRule: "@request.auth.id != '' && ticket.user = @request.auth.id",
        createRule: "@request.auth.id != ''",
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: "ticket",
            type: "relation",
            required: true,
            collectionId: tickets.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: "sender_role",
            type: "select",
            required: true,
            maxSelect: 1,
            values: ["user", "admin"],
          },
          { name: "body", type: "text", required: true, max: 8000 },
          { name: "created", type: "autodate", onCreate: true, onUpdate: false },
        ],
        indexes: [
          "CREATE INDEX idx_tmsg_ticket ON ticket_messages (ticket)",
        ],
      });
      app.save(tm);
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId("ticket_messages"));
    } catch (_) {}
    try {
      const tickets = app.findCollectionByNameOrId("support_tickets");
      tickets.fields.removeByName("resolved_at");
      app.save(tickets);
    } catch (_) {}
  }
);
