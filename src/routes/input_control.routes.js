import {Router} from 'express'
import {getInputControls, getInputControl, createInputControl, updateInputControl, deleteInputControl} from '../controllers/input_control.controller.js'

const router = Router()

router.get('/input_control', getInputControls)

router.get('/input_control/:id', getInputControl)

router.post('/input_control', createInputControl)

router.patch('/input_control/:id', updateInputControl)

router.delete('/input_control/:id', deleteInputControl)

export default router