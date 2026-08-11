import { Router } from 'express';
import healthCheck from './health-check.js';
import integratedAiRouter from './integrated-ai.js';
import learningGoalRouter from './learningGoal.js';
import examContentRouter from './examContent.js';
import paymentRouter from './payment.js';
import adsRouter from './ads.js';
import supportRouter from './support.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/integrated-ai', integratedAiRouter);
    router.use('/payment', paymentRouter);
    router.use('/', adsRouter);
    router.use('/', examContentRouter);
    router.use('/', learningGoalRouter);
    router.use('/', supportRouter);

    return router;
};
