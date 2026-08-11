/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users');

    // Helper: check whether a collection already has a field by name.
    // getByName returns undefined (not throw) when the field is absent.
    const hasField = (col, name) => {
      try {
        const f = col.fields.getByName(name);
        return !!f;
      } catch (_) {
        return false;
      }
    };

    const addField = (col, field) => {
      if (!hasField(col, field.name)) col.fields.add(field);
    };

    // ---------- tutorial_sessions (already created by core model) ----------
    const sessions = app.findCollectionByNameOrId('tutorial_sessions');

    // Public read access; any authenticated user may create/update/delete
    // (admin gating is enforced at the API layer).
    sessions.listRule = '';
    sessions.viewRule = '';
    sessions.createRule = "@request.auth.id != ''";
    sessions.updateRule = "@request.auth.id != ''";
    sessions.deleteRule = "@request.auth.id != ''";

    addField(sessions, new TextField({ name: 'title', max: 200 }));
    addField(
      sessions,
      new SelectField({
        name: 'session_type',
        maxSelect: 1,
        values: ['live', 'group', 'recorded'],
      }),
    );
    addField(sessions, new TextField({ name: 'instructor_name', max: 160 }));
    addField(sessions, new DateField({ name: 'scheduled_start' }));
    addField(sessions, new NumberField({ name: 'duration_minutes', onlyInt: true }));
    addField(sessions, new TextField({ name: 'description', max: 8000 }));
    addField(sessions, new TextField({ name: 'video_url', max: 2000 }));
    addField(sessions, new NumberField({ name: 'max_participants', onlyInt: true }));

    // Update the status select to include 'live'.
    try {
      const statusField = sessions.fields.getByName('status');
      statusField.values = ['requested', 'scheduled', 'live', 'completed', 'canceled'];
    } catch (_) {
      addField(
        sessions,
        new SelectField({
          name: 'status',
          maxSelect: 1,
          values: ['requested', 'scheduled', 'live', 'completed', 'canceled'],
        }),
      );
    }

    app.save(sessions);

    // ---------- tutorial_registrations (new collection) ----------
    let registrations;
    try {
      registrations = app.findCollectionByNameOrId('tutorial_registrations');
    } catch (_) {
      registrations = new Collection({ type: 'base', name: 'tutorial_registrations' });
    }

    addField(
      registrations,
      new RelationField({
        name: 'tutorial_session_id',
        required: true,
        collectionId: sessions.id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    );
    addField(
      registrations,
      new RelationField({
        name: 'user_id',
        required: true,
        collectionId: users.id,
        cascadeDelete: true,
        maxSelect: 1,
      }),
    );
    addField(
      registrations,
      new DateField({ name: 'registered_at' }),
    );
    addField(
      registrations,
      new AutodateField({ name: 'created', onCreate: true, onUpdate: false }),
    );
    addField(
      registrations,
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
    );

    // Owner-scoped: a user can only read/update/delete their own registrations.
    // Set rules AFTER fields exist so PocketBase can validate the field references.
    registrations.listRule = "@request.auth.id != '' && user_id = @request.auth.id";
    registrations.viewRule = "@request.auth.id != '' && user_id = @request.auth.id";
    registrations.createRule = "@request.auth.id != '' && user_id = @request.auth.id";
    registrations.updateRule = "@request.auth.id != '' && user_id = @request.auth.id";
    registrations.deleteRule = "@request.auth.id != '' && user_id = @request.auth.id";

    registrations.indexes = [
      'CREATE UNIQUE INDEX idx_tutorial_reg_pair ON tutorial_registrations (user_id, tutorial_session_id)',
      'CREATE INDEX idx_tutorial_reg_session ON tutorial_registrations (tutorial_session_id)',
      'CREATE INDEX idx_tutorial_reg_user ON tutorial_registrations (user_id)',
    ];

    app.save(registrations);
  },
  (app) => {
    // Revert tutorial_sessions additions and rules.
    try {
      const col = app.findCollectionByNameOrId('tutorial_sessions');
      ['title', 'session_type', 'instructor_name', 'scheduled_start', 'duration_minutes', 'description', 'video_url', 'max_participants'].forEach((n) => {
        try { col.fields.removeByName(n); } catch (_) {}
      });
      try {
        const statusField = col.fields.getByName('status');
        statusField.values = ['requested', 'scheduled', 'completed', 'canceled'];
      } catch (_) {}
      col.listRule = 'user = @request.auth.id';
      col.viewRule = 'user = @request.auth.id';
      col.createRule = '@request.auth.id != "" && user = @request.auth.id';
      col.updateRule = 'user = @request.auth.id';
      col.deleteRule = 'user = @request.auth.id';
      app.save(col);
    } catch (_) {}

    // Drop tutorial_registrations.
    try {
      app.delete(app.findCollectionByNameOrId('tutorial_registrations'));
    } catch (_) {}
  },
);
