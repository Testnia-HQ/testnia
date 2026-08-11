/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
    const exams = app.findCollectionByNameOrId('exams');
    const subjects = app.findCollectionByNameOrId('subjects');

    let col;
    try {
        col = app.findCollectionByNameOrId('exam_subjects');
    } catch (_) {
        col = new Collection({ type: 'base', name: 'exam_subjects' });
    }

    col.listRule = '';
    col.viewRule = '';
    col.createRule = null;
    col.updateRule = null;
    col.deleteRule = null;

    col.fields.add(new RelationField({ name: 'exam', required: true, collectionId: exams.id, cascadeDelete: true, maxSelect: 1 }));
    col.fields.add(new RelationField({ name: 'subject', required: true, collectionId: subjects.id, cascadeDelete: true, maxSelect: 1 }));
    col.fields.add(new NumberField({ name: 'weight' }));
    col.fields.add(new NumberField({ name: 'typical_question_count', onlyInt: true }));
    col.fields.add(new BoolField({ name: 'core' }));
    col.fields.add(new AutodateField({ name: 'created', onCreate: true, onUpdate: false }));
    col.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }));
    col.indexes = [
        'CREATE UNIQUE INDEX idx_exam_subjects_pair ON exam_subjects (exam, subject)',
        'CREATE INDEX idx_exam_subjects_exam ON exam_subjects (exam)',
    ];
    app.save(col);

    const coreNames = ['English Language', 'English', 'Use of English', 'Mathematics'];
    const counts = { waec: 50, jamb: 40, gce: 50, neco: 50, kcse: 45 };

    const allSubjects = app.findRecordsByFilter('subjects', 'id != ""', 'name', 500, 0);
    allSubjects.forEach((s) => {
        let examRec;
        try { examRec = app.findRecordById('exams', s.getString('exam')); } catch (_) { return; }
        const code = examRec.getString('code');
        if (!['waec', 'jamb', 'gce', 'neco', 'kcse'].includes(code)) return;

        try {
            app.findFirstRecordByFilter('exam_subjects', 'exam = {:e} && subject = {:s}', { e: examRec.id, s: s.id });
            return;
        } catch (_) {}

        const isCore = coreNames.includes(s.getString('name'));
        const rec = new Record(col);
        rec.set('exam', examRec.id);
        rec.set('subject', s.id);
        rec.set('weight', isCore ? 1.5 : 1);
        rec.set('typical_question_count', counts[code] || 40);
        rec.set('core', isCore);
        app.save(rec);
    });
}, (app) => {
    try { app.delete(app.findCollectionByNameOrId('exam_subjects')); } catch (_) {}
});
