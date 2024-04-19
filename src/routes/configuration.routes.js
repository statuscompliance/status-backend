import { Router } from 'express'
import { getConfiguration, getConfigurationByEndpoint, updateConfiguration } from '../controllers/configuration.controller.js'

const router = Router()

router.get('/config', getConfiguration)
router.post('/config', getConfigurationByEndpoint)
router.put('/config', updateConfiguration)

export default router