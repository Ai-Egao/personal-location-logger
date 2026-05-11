import express from 'express';
import { addVisit, getVisits, getAllVisits, deleteVisit, updateVisit, getReports } from '../controllers/visitsController.js';

const router = express.Router();

router.post('/visits', addVisit);
router.get('/visits', getVisits);
router.get('/visits/all', getAllVisits);
router.post('/visits/delete', deleteVisit);
router.post('/visits/update', updateVisit);

router.get('/reports', getReports);

export default router;