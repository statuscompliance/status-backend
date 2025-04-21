import { Router } from 'express';
import { welcome } from '../controllers/index.controller.js'

export default function () {
  const router = Router();
  router.get('/', welcome);

  return router;
}
