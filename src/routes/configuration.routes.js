import { Router } from 'express'
import { getConfiguration, getConfigurationByEndpoint, getAssistantLimit, updateConfiguration, updateAssistantLimit } from '../controllers/configuration.controller.js'

const router = Router()

router.get('/config', getConfiguration)
router.get('/config/assistant/limit', getAssistantLimit)
router.post('/config', getConfigurationByEndpoint)
router.put('/config', updateConfiguration)
router.put('/config/assistant/limit/:limit', updateAssistantLimit)

export default router