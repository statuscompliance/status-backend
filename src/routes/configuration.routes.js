import {Router} from 'express'
import { getConfiguration, updateConfiguration } from '../controllers/configuration.controller.js'
import { verifyAuthority } from '../middleware/verifyAuth.js'
import { validateParams } from '../middleware/validation.js'
const router = Router()

router.get('/config',verifyAuthority, getConfiguration)
router.put('/config',validateParams,verifyAuthority, updateConfiguration)

export default router