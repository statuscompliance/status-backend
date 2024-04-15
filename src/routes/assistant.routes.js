import {Router} from 'express'
import { verifyAuthority } from '../middleware/verifyAuth.js'
import { createAssistant, getAssistants, renewAssistant } from '../controllers/assistant.controller.js'
import { validateParams } from '../middleware/validation.js'

const router = Router()

router.get('/assistant', validateParams, verifyAuthority, getAssistants)
router.post('/assistant',validateParams, verifyAuthority, createAssistant)
router.post('/assistant/renew',validateParams, verifyAuthority, renewAssistant)

export default router