import {Router} from 'express'
import {getControls, getControl, getCatalogControls, createControl, updateControl, deleteControl} from '../controllers/control.controller.js'

const router = Router()

router.get('/control', getControls)

router.get('/control/:id', getControl)

router.get('/catalogControls/:id', getCatalogControls)

router.post('/control', createControl)

router.patch('/control/:id', updateControl)

router.delete('/control/:id', deleteControl)

export default router