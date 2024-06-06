import {Router} from 'express'
import {getInputs, getInput, getInputsByMashupId, createInput, updateInput, deleteInput} from '../controllers/input.controller.js'

const router = Router()

router.get('/inputs', getInputs)
router.get('/inputs/:id', getInput)
router.get('/mashups/:mashup_id/inputs', getInputsByMashupId)
router.post('/inputs', createInput)
router.patch('/inputs/:id', updateInput)
router.delete('/inputs/:id', deleteInput) 

export default router