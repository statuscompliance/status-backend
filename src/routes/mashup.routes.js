import {Router} from 'express'
import {getMashups, getMashup, createMashup, updateMashup, deleteMashup} from '../controllers/mashup.controller.js'

const router = Router()

router.get('/mashup', getMashups)

router.get('/mashup/:id', getMashup)

router.post('/mashup', createMashup)

router.patch('/mashup/:id', updateMashup)

router.delete('/mashup/:id', deleteMashup)

export default router