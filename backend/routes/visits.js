import express from 'express';
import {
    addVisit,
    getVisits,
    deleteVisit,
    updateVisit,
    getReports
} from '../controllers/visitsController.js';

const router = express.Router();

router.post('/visits', addVisit);
router.get('/visits', getVisits);
router.post('/visits/delete', deleteVisit);
router.post('/visits/update', updateVisit);

router.get('/reports', getReports);

export default router;