import {Router} from 'express'
import { verifyAuthority } from '../middleware/verifyAuth.js'

import { createAssistant, getAssistants } from '../controllers/assistant.controller.js'


const router = Router()

router.get('/assistant', verifyAuthority, getAssistants)
router.post('/assistant',verifyAuthority, createAssistant)

export default router