import {Router} from 'express'
import { createAssistant, createAssistantWithInstructions, getAssistants, getAssistantsById, deleteAssistantById, getAssistantInstructions, updateAssistantInstructions, deleteAllAssistants } from '../controllers/assistant.controller.js'
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { assistantlimitReached } from '../middleware/endpoint.js';

const router = Router()

router.get('/assistant', getAssistants)
router.get('/assistant/:id', getAssistantsById)
router.get('/assistant/:id/instructions', getAssistantInstructions)
router.post('/assistant', assistantlimitReached, createAssistant)
router.post('/assistant/admin', verifyAdmin, assistantlimitReached ,createAssistantWithInstructions)
// router.post('/assistant/renew', renewAssistant)
router.put('/assistant/:id/instructions', updateAssistantInstructions)
router.delete('/assistant/:id', deleteAssistantById)
router.delete('/assistant', deleteAllAssistants)



export default router