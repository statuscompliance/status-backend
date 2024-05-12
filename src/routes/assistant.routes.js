import {Router} from 'express'
import { createAssistant, getAssistants, getAssistantsById, deleteAssistantById, getAssistantInstructions, updateAssistantInstructions, deleteAllAssistants } from '../controllers/assistant.controller.js'

const router = Router()

router.get('/assistant', getAssistants)
router.get('/assistant/:id', getAssistantsById)
router.get('/assistant/:id/instructions', getAssistantInstructions)
router.post('/assistant', createAssistant)
// router.post('/assistant/renew', renewAssistant)
router.put('/assistant/:id/instructions', updateAssistantInstructions)
router.delete('/assistant/:id', deleteAssistantById)
router.delete('/assistant', deleteAllAssistants)



export default router