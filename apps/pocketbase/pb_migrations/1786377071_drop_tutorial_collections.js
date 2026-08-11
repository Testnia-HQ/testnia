/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Drop tutorial_registrations first (has FK to tutorial_sessions)
    try {
      app.delete(app.findCollectionByNameOrId('tutorial_registrations'));
    } catch (e) {
      if (!e.message.includes('no rows in result set')) throw e;
    }
    // Drop tutorial_sessions
    try {
      app.delete(app.findCollectionByNameOrId('tutorial_sessions'));
    } catch (e) {
      if (!e.message.includes('no rows in result set')) throw e;
    }
  },
  (app) => {
    // Recreate minimal structures for rollback
    const users = app.findCollectionByNameOrId('users');

    let sessions;
    try {
      sessions = app.findCollectionByNameOrId('tutorial_sessions');
    } catch (_) {
      sessions = new Collection({
        type: 'base',
        name: 'tutorial_sessions',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'title', type: 'text', max: 200 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      });
      app.save(sessions);
    }

    try {
      app.findCollectionByNameOrId('tutorial_registrations');
    } catch (_) {
      const reg = new Collection({
        type: 'base',
        name: 'tutorial_registrations',
        listRule: "@request.auth.id != '' && user_id = @request.auth.id",
        viewRule: "@request.auth.id != '' && user_id = @request.auth.id",
        createRule: "@request.auth.id != '' && user_id = @request.auth.id",
        updateRule: "@request.auth.id != '' && user_id = @request.auth.id",
        deleteRule: "@request.auth.id != '' && user_id = @request.auth.id",
        fields: [
          {
            name: 'tutorial_session_id', type: 'relation', required: true,
            collectionId: sessions.id, cascadeDelete: true, maxSelect: 1,
          },
          {
            name: 'user_id', type: 'relation', required: true,
            collectionId: users.id, cascadeDelete: true, maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      });
      app.save(reg);
    }
  },
);
