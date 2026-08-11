/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    // Add target_subjects and learning_goal JSON fields to profiles
    const profiles = app.findCollectionByNameOrId('profiles');
    profiles.fields.add(new JSONField({ name: 'target_subjects', maxSize: 50000 }));
    profiles.fields.add(new JSONField({ name: 'learning_goal', maxSize: 200000 }));
    app.save(profiles);

    // Seed new supported exams: WAEC, GCE, NECO, KCSE (JAMB already exists)
    const exams = app.findCollectionByNameOrId('exams');
    const subjects = app.findCollectionByNameOrId('subjects');

    const newExams = [
        {
            code: 'waec', name: 'WAEC SSCE', country: 'Nigeria', language: 'en',
            description: 'West African Senior School Certificate Examination for Nigerian students.',
        },
        {
            code: 'gce', name: 'GCE O\'Level', country: 'West Africa', language: 'en',
            description: 'General Certificate of Education Ordinary Level examination.',
        },
        {
            code: 'neco', name: 'NECO SSCE', country: 'Nigeria', language: 'en',
            description: 'National Examinations Council Senior Secondary Certificate Examination.',
        },
        {
            code: 'kcse', name: 'KCSE', country: 'Kenya', language: 'en',
            description: 'Kenya Certificate of Secondary Education examination.',
        },
    ];

    const subjectsByExam = {
        waec: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature in English', 'Geography', 'Agricultural Science', 'Further Mathematics', 'Civic Education', 'Commerce', 'Accounting'],
        gce: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature in English', 'Geography', 'Commerce', 'Accounting'],
        neco: ['English Language', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature in English', 'Agricultural Science', 'Geography', 'Commerce', 'Civic Education'],
        kcse: ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History & Government', 'Geography', 'Business Studies', 'Agriculture', 'CRE', 'Kiswahili', 'Computer Studies'],
        jamb: ['Use of English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'Economics', 'Government', 'Literature in English', 'CRS/IRS', 'Geography', 'Commerce', 'Accounting'],
    };

    // Also update JAMB subjects if missing
    let jambRec;
    try { jambRec = app.findFirstRecordByFilter('exams', 'code = {:c}', { c: 'jamb' }); } catch (_) {}

    const allExamDefs = [
        ...newExams,
        ...(jambRec ? [] : [{
            code: 'jamb', name: 'JAMB UTME', country: 'Nigeria', language: 'en',
            description: 'Nigerian unified tertiary matriculation examination.',
        }]),
    ];

    allExamDefs.forEach((e) => {
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

    // Update JAMB subjects too
    if (jambRec) {
        (subjectsByExam.jamb || []).forEach((name, i) => {
            const slug = `jamb-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            let s;
            try {
                s = app.findFirstRecordByFilter('subjects', 'slug = {:s}', { s: slug });
            } catch (_) {
                s = new Record(subjects);
            }
            s.set('exam', jambRec.id);
            s.set('name', name);
            s.set('slug', slug);
            s.set('order', i + 1);
            app.save(s);
        });
    }
}, (app) => {
    try {
        const profiles = app.findCollectionByNameOrId('profiles');
        profiles.fields.removeByName('target_subjects');
        profiles.fields.removeByName('learning_goal');
        app.save(profiles);
    } catch (_) {}
});
