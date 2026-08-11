import { Router } from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import { integratedAiRateLimit } from '../middleware/integrated-ai-rate-limit.js';
import { generateText } from '../utils/aiGenerate.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

router.use(pocketbaseAuth);

// POST /generate-goal
// Generates or recalibrates the AI learning goal for the authenticated user.
router.post('/generate-goal', integratedAiRateLimit, async (req, res) => {
    const userId = req.pocketbaseUserId;

    // Fetch profile
    let profileRec;
    try {
        profileRec = await pocketbaseClient.collection('profiles').getFirstListItem(
            pocketbaseClient.filter('user = {:u}', { u: userId }),
        );
    } catch (_) {
        return res.status(404).json({ error: 'Profile not found. Complete onboarding first.' });
    }

    // Fetch the target exam name
    let examName = 'the exam';
    if (profileRec.target_exam) {
        try {
            const exam = await pocketbaseClient.collection('exams').getOne(profileRec.target_exam);
            examName = exam.name;
        } catch (_) {}
    }

    // Fetch recent sessions (last 15)
    let sessions = [];
    try {
        sessions = await pocketbaseClient.collection('practice_sessions').getFullList({
            filter: pocketbaseClient.filter('user = {:u}', { u: userId }),
            sort: '-created',
            expand: 'subject',
            perPage: 15,
        });
    } catch (_) {}

    const sessionsSummary = sessions.length === 0
        ? 'No sessions completed yet.'
        : sessions.map(s => {
            const subName = s.expand?.subject?.name || 'General';
            const score = s.score_percent != null ? `${Math.round(s.score_percent)}%` : 'unscored';
            return `${subName}: ${score} (${s.mode || 'drill'})`;
        }).join(', ');

    const targetSubjects = Array.isArray(profileRec.target_subjects) ? profileRec.target_subjects : [];
    const examDate = profileRec.exam_date ? new Date(profileRec.exam_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'not set';
    const weeklyHours = profileRec.weekly_goal_minutes ? Math.round(profileRec.weekly_goal_minutes / 60) : 2;

    const systemPrompt = `You are an expert exam preparation coach specializing in African secondary and tertiary examinations (WAEC, JAMB, GCE, NECO, KCSE). You produce structured, motivating, and realistic study plans in JSON format only. Respond ONLY with valid JSON — no markdown, no explanation, no code fences.`;

    const userMessage = `Generate a personalized learning goal plan for this student:
- Exam: ${examName}
- Target subjects: ${targetSubjects.length > 0 ? targetSubjects.join(', ') : 'all subjects'}
- Exam date: ${examDate}
- Available study time: ${weeklyHours} hours/week
- Recent session performance: ${sessionsSummary}

Return ONLY this JSON structure (no markdown, no code blocks):
{
  "goal_summary": "2-3 sentence motivating summary personalized to this student",
  "priority_subjects": ["subject1", "subject2"],
  "weekly_plan": [
    {"day": "Monday", "subject": "Subject Name", "duration_minutes": 60, "focus": "Brief description of what to study"},
    {"day": "Tuesday", "subject": "Subject Name", "duration_minutes": 60, "focus": "..."},
    {"day": "Wednesday", "subject": "Subject Name", "duration_minutes": 45, "focus": "..."},
    {"day": "Thursday", "subject": "Subject Name", "duration_minutes": 60, "focus": "..."},
    {"day": "Friday", "subject": "Subject Name", "duration_minutes": 45, "focus": "..."},
    {"day": "Saturday", "subject": "Subject Name", "duration_minutes": 90, "focus": "Mock practice"},
    {"day": "Sunday", "subject": "Rest / Review", "duration_minutes": 30, "focus": "Review notes and rest"}
  ],
  "milestones": [
    {"week": 1, "title": "Foundation", "description": "...", "checkpoint": "Achieve X% on Y"},
    {"week": 2, "title": "...", "description": "...", "checkpoint": "..."},
    {"week": 4, "title": "...", "description": "...", "checkpoint": "..."},
    {"week": 6, "title": "...", "description": "...", "checkpoint": "..."}
  ]
}`;

    let rawText;
    try {
        rawText = await generateText({ systemPrompt, userMessage });
    } catch (err) {
        logger.error('AI generate failed:', err.message);
        return res.status(502).json({ error: 'AI service unavailable. Please try again.' });
    }

    // Strip any accidental markdown fences
    const cleaned = rawText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

    let goal;
    try {
        goal = JSON.parse(cleaned);
    } catch (_) {
        logger.error('AI returned non-JSON:', rawText.slice(0, 200));
        return res.status(502).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    goal.generated_at = new Date().toISOString();

    // Save to profile
    try {
        await pocketbaseClient.collection('profiles').update(profileRec.id, {
            learning_goal: goal,
        });
    } catch (err) {
        logger.error('Failed to save learning_goal:', err.message);
    }

    return res.json({ goal });
});

export default router;
