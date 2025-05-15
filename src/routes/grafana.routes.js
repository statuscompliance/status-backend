import { Router } from 'express';
import searchRoutes from './search.routes.js';
import serviceAccountRoutes from './serviceAccount.routes.js';
import folderRoutes from './folder.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import datasourceRoutes from './datasource.routes.js';
import queryRoutes from './query.routes.js';

export default function () {
  const router = Router();
  
  // Incorporar todas las rutas específicas bajo el prefijo /grafana
  router.use('', searchRoutes);
  router.use('', serviceAccountRoutes);
  router.use('', folderRoutes);
  router.use('', dashboardRoutes);
  router.use('', datasourceRoutes);
  router.use('', queryRoutes);

  return router;
}
