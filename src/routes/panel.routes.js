import { Router } from 'express';
import { validateUUID, checkIdParam } from '../middleware/validation.js';
import {
  getPanelsByDashboardUID,
  addDashboardPanel,
  updatePanelByID,
  deletePanelByID,
  getDashboardPanelQueriesByUID,
  getPanelQueryByID
} from '../controllers/panel.controller.js';

const router = Router();

// Todas estas rutas se montarán bajo /dashboard/:uid/, que es donde se usarán
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
