import { Router } from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import { generateText } from '../utils/aiGenerate.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

// Public leaderboard: top 90%+ completed sessions
router.get('/leaderboard', async (req, res) => {
    const { exam, subject } = req.query;
    const parts = ['score_percent >= 90', 'status = "completed"'];
    if (exam) parts.push(pocketbaseClient.filter('exam = {:e}', { e: exam }));
    if (subject) parts.push(pocketbaseClient.filter('subject = {:s}', { s: subject }));

    let sessions = [];
    try {
        sessions = await pocketbaseClient.collection('practice_sessions').getList(1, 100, {
            filter: parts.join(' && '),
            sort: '-score_percent,-created',
            expand: 'exam,subject,user',
        });
    } catch (err) {
        logger.error('leaderboard query failed', err.message);
        return res.json({ entries: [] });
    }

    let optedOut = new Set();
    try {
        const profs = await pocketbaseClient.collection('profiles').getFullList({
            filter: 'leaderboard_opt_out = true',
        });
        optedOut = new Set(profs.map((p) => p.user));
    } catch (_) { /* noop */ }

    const entries = sessions.items.map((s) => ({
        id: s.id,
        name: optedOut.has(s.user)
            ? 'Anonymous'
            : (s.expand?.user?.full_name || s.expand?.user?.name || s.expand?.user?.email?.split('@')[0] || 'Student'),
        score: Math.round(s.score_percent),
        exam: s.expand?.exam?.name || '—',
        examId: s.exam || '',
        subject: s.expand?.subject?.name || 'General',
        subjectId: s.subject || '',
        date: s.created,
    }));

    return res.json({ entries });
});

router.use(pocketbaseAuth);

// AI essay grading
router.post('/grade-essay', async (req, res) => {
    const { body, title, examId, subjectId, essayType } = req.body || {};
    if (!body || body.trim().length < 50) {
        return res.status(422).json({ error: 'Essay must be at least 50 characters.' });
    }

    let examName = 'the exam';
    let subjectName = '';
    try { if (examId) examName = (await pocketbaseClient.collection('exams').getOne(examId)).name; } catch (_) {}
    try { if (subjectId) subjectName = (await pocketbaseClient.collection('subjects').getOne(subjectId)).name; } catch (_) {}

    const systemPrompt = 'You are a senior examiner for West and East African examination boards (WAEC, JAMB, GCE, NECO, KCSE). Grade essays strictly against exam-board rubrics. Respond ONLY with valid JSON. No markdown, no code fences, no commentary.';

    const userMessage = `Grade this ${essayType || 'essay'} for ${examName}${subjectName ? ` — ${subjectName}` : ''}.

Title: ${title || 'Untitled'}

Essay:
"""
${body.slice(0, 12000)}
"""

Return ONLY this JSON:
{
  "score": <overall score 0-100>,
  "grade": "<letter grade A1/B2/C4/etc or A-F>",
  "summary": "<2-3 sentence overall verdict>",
  "rubric": [
    {"criterion": "Structure & Organisation", "score": <0-25>, "max": 25, "comment": "..."},
    {"criterion": "Content & Argument Quality", "score": <0-25>, "max": 25, "comment": "..."},
    {"criterion": "Grammar & Mechanics", "score": <0-25>, "max": 25, "comment": "..."},
    {"criterion": "Relevance to Prompt", "score": <0-25>, "max": 25, "comment": "..."}
  ],
  "strengths": ["...", "..."],
  "improvements": ["...", "...", "..."]
}`;

    let raw;
    try {
        raw = await generateText({ systemPrompt, userMessage });
    } catch (err) {
        logger.error('essay grading failed', err.message);
        return res.status(502).json({ error: 'AI grading service unavailable. Please try again.' });
    }

    const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
    let result;
    try {
        result = JSON.parse(cleaned);
    } catch (_) {
        return res.status(502).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    let recordId = null;
    try {
        const rec = await pocketbaseClient.collection('essay_submissions').create({
            user: req.pocketbaseUserId,
            ...(examId && { exam: examId }),
            ...(subjectId && { subject: subjectId }),
            title: (title || 'Untitled essay').slice(0, 200),
            prompt: (essayType || '').slice(0, 4000),
            body: body.slice(0, 40000),
            word_count: body.trim().split(/\s+/).length,
            status: 'graded',
            score: result.score,
            feedback: JSON.stringify(result).slice(0, 20000),
        });
        recordId = rec.id;
    } catch (err) {
        logger.error('essay save failed', err.message);
    }

    return res.json({ result, recordId });
});

export default router;
