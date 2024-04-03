import {Router} from 'express'
import { verifyAuthority } from '../middleware/verifyAuth.js'

import { createAssistant, getAssistants, renewAssistant } from '../controllers/assistant.controller.js'


const router = Router()

router.get('/assistant', verifyAuthority, getAssistants)
router.post('/assistant',verifyAuthority, createAssistant)
router.post('/assistant/renew',verifyAuthority, renewAssistant)

export default router