import {Router} from 'express'
import {getMashups, getMashup, createMashup, updateMashup, deleteMashup} from '../controllers/mashup.controller.js'

const router = Router()

router.get('/mashups', getMashups)
router.get('/mashups/:id', getMashup)
router.post('/mashups', createMashup)
router.patch('/mashups/:id', updateMashup)
router.delete('/mashups/:id', deleteMashup)

export default router