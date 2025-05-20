import { Router } from 'express';
import { validateUUID } from '../middleware/validation.js';
import { 
  createDashboard,
  createDashboardTemplate,
  createTemporaryDashboard,
  importDashboard,
  getDashboardByUID,
  deleteDashboardByUID
} from '../controllers/dashboard.controller.js';

const router = Router();

router.post('/dashboard', createDashboard);
router.post('/dashboard/template', createDashboardTemplate);
router.post('/dashboard/temp', createTemporaryDashboard);
router.post('/dashboard/import', importDashboard);
router.get('/dashboard/:uid', validateUUID('uid'), getDashboardByUID);
router.delete('/dashboard/:uid', validateUUID('uid'), deleteDashboardByUID);

export default router;
