import { Router } from 'express';
import { validateUUID, checkIdParam } from '../middleware/validation.js';
import { 
  createDashboard,
  createDashboardTemplate,
  createTemporaryDashboard,
  importDashboard,
  getDashboardByUID,
  deleteDashboardByUID,
  getPanelsByDashboardUID,
  addDashboardPanel,
  updatePanelByID,
  deletePanelByID,
  getDashboardPanelQueriesByUID,
  getPanelQueryByID
} from '../controllers/dashboard.controller.js';

const router = Router();

router.post('/dashboard', createDashboard);
router.post('/dashboard/template', createDashboardTemplate);
router.post('/dashboard/temp', createTemporaryDashboard);
router.post('/dashboard/import', importDashboard);
router.get('/dashboard/:uid', validateUUID('uid'), getDashboardByUID);
router.delete('/dashboard/:uid', validateUUID('uid'), deleteDashboardByUID);
router.get('/dashboard/:uid/panel', validateUUID('uid'), getPanelsByDashboardUID);
router.post('/dashboard/:uid/panel', validateUUID('uid'), addDashboardPanel);
router.patch('/dashboard/:uid/panel/:id', validateUUID('uid'), checkIdParam, updatePanelByID);
router.delete('/dashboard/:uid/panel/:id', validateUUID('uid'), checkIdParam, deletePanelByID);
router.get(
  '/dashboard/:uid/panel/query',
  validateUUID('uid'), 
  getDashboardPanelQueriesByUID
);
router.get('/dashboard/:uid/panel/:id/query', validateUUID('uid'), checkIdParam, getPanelQueryByID);

export default router;
