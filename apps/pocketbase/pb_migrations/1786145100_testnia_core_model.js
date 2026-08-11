/// <reference path="../database-types.d.ts" />

migrate((app) => {
    const users = app.findCollectionByNameOrId('users');

    const owner = (extra) => ({
        name: 'user',
        type: 'relation',
        required: true,
        collectionId: users.id,
        cascadeDelete: true,
        maxSelect: 1,
        ...extra,
    });

    const stamps = [
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ];

    const ownerRules = {
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id',
    };

    const publicRead = {
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
    };

    const ctors = {
        text: TextField,
        number: NumberField,
        bool: BoolField,
        email: EmailField,
        date: DateField,
        json: JSONField,
        select: SelectField,
        relation: RelationField,
        autodate: AutodateField,
    };

    const build = (f) => new ctors[f.type](f);

    const make = (def) => {
        let c;
        try {
            c = app.findCollectionByNameOrId(def.name);
        } catch (_) {
            c = new Collection({ type: 'base', name: def.name });
        }
        const { fields = [], indexes = [], ...rest } = def;
        Object.assign(c, rest, { type: def.type || 'base' });
        fields.forEach((f) => c.fields.add(build(f)));
        c.indexes = indexes;
        app.save(c);

        return app.findCollectionByNameOrId(def.name);
    };

    // ---------- catalogue ----------
    const exams = make({
        name: 'exams',
        ...publicRead,
        fields: [
            { name: 'code', type: 'text', required: true, max: 40 },
            { name: 'name', type: 'text', required: true, max: 160 },
            { name: 'country', type: 'text', max: 80 },
            { name: 'language', type: 'text', max: 20 },
            { name: 'description', type: 'text', max: 2000 },
            { name: 'active', type: 'bool' },
            ...stamps,
        ],
        indexes: ['CREATE UNIQUE INDEX idx_exams_code ON exams (code)'],
    });

    const subjects = make({
        name: 'subjects',
        ...publicRead,
        fields: [
            { name: 'exam', type: 'relation', required: true, collectionId: exams.id, cascadeDelete: true, maxSelect: 1 },
            { name: 'name', type: 'text', required: true, max: 160 },
            { name: 'slug', type: 'text', max: 160 },
            { name: 'order', type: 'number', onlyInt: true },
            ...stamps,
        ],
        indexes: ['CREATE INDEX idx_subjects_exam ON subjects (exam)'],
    });

    const questions = make({
        name: 'questions',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            { name: 'exam', type: 'relation', required: true, collectionId: exams.id, cascadeDelete: true, maxSelect: 1 },
            { name: 'subject', type: 'relation', collectionId: subjects.id, cascadeDelete: true, maxSelect: 1 },
            { name: 'prompt', type: 'text', required: true, max: 4000 },
            { name: 'choices', type: 'json', maxSize: 200000 },
            { name: 'answer', type: 'text', max: 400 },
            { name: 'explanation', type: 'text', max: 4000 },
            { name: 'difficulty', type: 'select', maxSelect: 1, values: ['easy', 'medium', 'hard'] },
            { name: 'type', type: 'select', maxSelect: 1, values: ['mcq', 'open', 'essay'] },
            ...stamps,
        ],
        indexes: [
            'CREATE INDEX idx_questions_exam ON questions (exam)',
            'CREATE INDEX idx_questions_subject ON questions (subject)',
        ],
    });

    // ---------- per-user ----------
    make({
        name: 'profiles',
        ...ownerRules,
        fields: [
            owner({}),
            { name: 'full_name', type: 'text', max: 160 },
            { name: 'country', type: 'text', max: 80 },
            { name: 'language', type: 'text', max: 20 },
            { name: 'target_exam', type: 'relation', collectionId: exams.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'target_score', type: 'number' },
            { name: 'exam_date', type: 'date' },
            { name: 'weekly_goal_minutes', type: 'number', onlyInt: true },
            { name: 'onboarded', type: 'bool' },
            ...stamps,
        ],
        indexes: ['CREATE UNIQUE INDEX idx_profiles_user ON profiles (user)'],
    });

    make({
        name: 'practice_sessions',
        ...ownerRules,
        fields: [
            owner({}),
            { name: 'exam', type: 'relation', collectionId: exams.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'subject', type: 'relation', collectionId: subjects.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'mode', type: 'select', maxSelect: 1, values: ['drill', 'timed', 'mock', 'review'] },
            { name: 'status', type: 'select', maxSelect: 1, values: ['in_progress', 'completed', 'abandoned'] },
            { name: 'questions_total', type: 'number', onlyInt: true },
            { name: 'questions_correct', type: 'number', onlyInt: true },
            { name: 'score_percent', type: 'number' },
            { name: 'duration_seconds', type: 'number', onlyInt: true },
            { name: 'answers', type: 'json', maxSize: 500000 },
            { name: 'started_at', type: 'date' },
            { name: 'finished_at', type: 'date' },
            ...stamps,
        ],
        indexes: [
            'CREATE INDEX idx_sessions_user ON practice_sessions (user)',
            'CREATE INDEX idx_sessions_exam ON practice_sessions (exam)',
            'CREATE INDEX idx_sessions_subject ON practice_sessions (subject)',
        ],
    });

    make({
        name: 'essay_submissions',
        ...ownerRules,
        fields: [
            owner({}),
            { name: 'exam', type: 'relation', collectionId: exams.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'subject', type: 'relation', collectionId: subjects.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'title', type: 'text', max: 200 },
            { name: 'prompt', type: 'text', max: 4000 },
            { name: 'body', type: 'text', max: 40000 },
            { name: 'word_count', type: 'number', onlyInt: true },
            { name: 'status', type: 'select', maxSelect: 1, values: ['draft', 'submitted', 'graded'] },
            { name: 'score', type: 'number' },
            { name: 'feedback', type: 'text', max: 20000 },
            ...stamps,
        ],
        indexes: [
            'CREATE INDEX idx_essays_user ON essay_submissions (user)',
            'CREATE INDEX idx_essays_exam ON essay_submissions (exam)',
        ],
    });

    make({
        name: 'subscriptions',
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            owner({}),
            { name: 'plan', type: 'select', maxSelect: 1, values: ['free', 'starter', 'pro', 'tutor'] },
            { name: 'status', type: 'select', maxSelect: 1, values: ['active', 'trialing', 'past_due', 'canceled'] },
            { name: 'current_period_end', type: 'date' },
            { name: 'provider', type: 'text', max: 60 },
            { name: 'provider_ref', type: 'text', max: 200 },
            ...stamps,
        ],
        indexes: ['CREATE INDEX idx_subs_user ON subscriptions (user)'],
    });

    make({
        name: 'payments',
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            owner({}),
            { name: 'amount_cents', type: 'number', onlyInt: true },
            { name: 'currency', type: 'text', max: 8 },
            { name: 'status', type: 'select', maxSelect: 1, values: ['pending', 'paid', 'failed', 'refunded'] },
            { name: 'provider_ref', type: 'text', max: 200 },
            { name: 'paid_at', type: 'date' },
            ...stamps,
        ],
        indexes: ['CREATE INDEX idx_payments_user ON payments (user)'],
    });

    make({
        name: 'tutorial_sessions',
        ...ownerRules,
        fields: [
            owner({}),
            { name: 'exam', type: 'relation', collectionId: exams.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'subject', type: 'relation', collectionId: subjects.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'topic', type: 'text', max: 200 },
            { name: 'tutor_name', type: 'text', max: 160 },
            { name: 'scheduled_at', type: 'date' },
            { name: 'duration_minutes', type: 'number', onlyInt: true },
            { name: 'status', type: 'select', maxSelect: 1, values: ['requested', 'scheduled', 'completed', 'canceled'] },
            { name: 'notes', type: 'text', max: 8000 },
            ...stamps,
        ],
        indexes: [
            'CREATE INDEX idx_tutorials_user ON tutorial_sessions (user)',
            'CREATE INDEX idx_tutorials_exam ON tutorial_sessions (exam)',
        ],
    });

    make({
        name: 'hero_feature_entries',
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id',
        deleteRule: 'user = @request.auth.id',
        fields: [
            owner({ required: false }),
            { name: 'display_name', type: 'text', max: 160 },
            { name: 'country', type: 'text', max: 80 },
            { name: 'exam', type: 'relation', collectionId: exams.id, cascadeDelete: false, maxSelect: 1 },
            { name: 'story', type: 'text', max: 4000 },
            { name: 'score_improvement', type: 'number' },
            { name: 'featured', type: 'bool' },
            ...stamps,
        ],
        indexes: ['CREATE INDEX idx_hero_user ON hero_feature_entries (user)'],
    });

    make({
        name: 'admin_users',
        listRule: null,
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
            { name: 'email', type: 'email', required: true },
            { name: 'role', type: 'select', maxSelect: 1, values: ['support', 'editor', 'superadmin'] },
            { name: 'active', type: 'bool' },
            ...stamps,
        ],
        indexes: ['CREATE UNIQUE INDEX idx_admin_users_email ON admin_users (email)'],
    });

    make({
        name: 'support_tickets',
        listRule: 'user = @request.auth.id',
        viewRule: 'user = @request.auth.id',
        createRule: '@request.auth.id != "" && user = @request.auth.id',
        updateRule: 'user = @request.auth.id && status != "closed"',
        deleteRule: null,
        fields: [
            owner({}),
            { name: 'subject_line', type: 'text', required: true, max: 200 },
            { name: 'message', type: 'text', required: true, max: 8000 },
            { name: 'category', type: 'select', maxSelect: 1, values: ['billing', 'content', 'technical', 'other'] },
            { name: 'status', type: 'select', maxSelect: 1, values: ['open', 'pending', 'closed'] },
            ...stamps,
        ],
        indexes: ['CREATE INDEX idx_tickets_user ON support_tickets (user)'],
    });

    // ---------- profile fields on users ----------
    users.fields.add(new TextField({ name: 'full_name', max: 160 }));
    users.fields.add(new TextField({ name: 'country', max: 80 }));
    users.fields.add(new TextField({ name: 'language', max: 20 }));
    users.createRule = '';
    app.save(users);

    // ---------- seed catalogue ----------
    const seedExams = [
        { code: 'ielts', name: 'IELTS Academic', country: 'Global', language: 'en', description: 'Four-skill English proficiency test for study and migration.' },
        { code: 'sat', name: 'SAT', country: 'United States', language: 'en', description: 'College admissions test covering reading, writing and math.' },
        { code: 'gmat', name: 'GMAT Focus', country: 'Global', language: 'en', description: 'Graduate business school admissions assessment.' },
        { code: 'jamb', name: 'JAMB UTME', country: 'Nigeria', language: 'en', description: 'Nigerian unified tertiary matriculation examination.' },
    ];

    const subjectsByExam = {
        ielts: ['Listening', 'Reading', 'Writing', 'Speaking'],
        sat: ['Reading and Writing', 'Math'],
        gmat: ['Quantitative Reasoning', 'Verbal Reasoning', 'Data Insights'],
        jamb: ['Use of English', 'Mathematics', 'Physics', 'Chemistry'],
    };

    seedExams.forEach((e) => {
        let rec;
        try {
            rec = app.findFirstRecordByFilter('exams', 'code = {:c}', { c: e.code });
        } catch (_) {
            rec = new Record(exams);
        }
        rec.set('code', e.code);
        rec.set('name', e.name);
        rec.set('country', e.country);
        rec.set('language', e.language);
        rec.set('description', e.description);
        rec.set('active', true);
        app.save(rec);

        (subjectsByExam[e.code] || []).forEach((name, i) => {
            const slug = `${e.code}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            let s;
            try {
                s = app.findFirstRecordByFilter('subjects', 'slug = {:s}', { s: slug });
            } catch (_) {
                s = new Record(subjects);
            }
            s.set('exam', rec.id);
            s.set('name', name);
            s.set('slug', slug);
            s.set('order', i + 1);
            app.save(s);
        });
    });

    // one sample question per exam so practice works end to end
    seedExams.forEach((e) => {
        const exam = app.findFirstRecordByFilter('exams', 'code = {:c}', { c: e.code });
        const existing = app.findRecordsByFilter('questions', 'exam = {:e}', '', 1, 0, { e: exam.id });
        if (existing.length) return;
        const q = new Record(questions);
        q.set('exam', exam.id);
        q.set('prompt', `Sample ${e.name} diagnostic question: which option best completes the reasoning?`);
        q.set('choices', ['Option A', 'Option B', 'Option C', 'Option D']);
        q.set('answer', 'Option B');
        q.set('explanation', 'Option B is the only choice consistent with the stated premise.');
        q.set('difficulty', 'medium');
        q.set('type', 'mcq');
        app.save(q);
    });
}, (app) => {
    [
        'support_tickets', 'admin_users', 'hero_feature_entries', 'tutorial_sessions',
        'payments', 'subscriptions', 'essay_submissions', 'practice_sessions',
        'profiles', 'questions', 'subjects', 'exams',
    ].forEach((n) => {
        try {
            app.delete(app.findCollectionByNameOrId(n));
        } catch (_) { /* noop */ }
    });
});
