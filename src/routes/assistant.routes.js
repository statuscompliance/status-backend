import {Router} from 'express'
import { createAssistant, getAssistants, getAssistantsById, deleteAssistant, getAssistantInstructions, updateAssistantInstructions } from '../controllers/assistant.controller.js'

const router = Router()

router.get('/assistant', getAssistants)
router.get('/assistant/:id', getAssistantsById)
router.get('/assistant/:id/instructions', getAssistantInstructions)
router.post('/assistant', createAssistant)
// router.post('/assistant/renew', renewAssistant)
router.put('/assistant/instructions', updateAssistantInstructions)
router.delete('/assistant/:id', deleteAssistant)



export default router