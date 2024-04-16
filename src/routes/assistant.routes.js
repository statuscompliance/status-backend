import {Router} from 'express'
import { createAssistant, getAssistants, renewAssistant } from '../controllers/assistant.controller.js'

const router = Router()

router.get('/assistant', getAssistants)
router.post('/assistant', createAssistant)
router.post('/assistant/renew', renewAssistant)

export default router