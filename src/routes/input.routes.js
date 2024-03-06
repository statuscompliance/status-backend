import {Router} from 'express'
import {getInputs, getInput, getInputsByMashupId, createInput, updateInput, deleteInput} from '../controllers/input.controller.js'

const router = Router()

router.get('/input', getInputs)

router.get('/input/:id', getInput)

router.get('/:id/inputs', getInputsByMashupId)

router.post('/input', createInput)

router.patch('/input/:id', updateInput)

router.delete('/input/:id', deleteInput)

export default router