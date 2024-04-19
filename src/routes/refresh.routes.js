import { Router } from 'express'
import {refreshToken} from '../controllers/refresh.controller.js'
import { validateParams } from '../middleware/validation.js'

const router = Router()

router.get('/refresh', validateParams,refreshToken)

export default router