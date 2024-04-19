import { Router } from 'express'

import { verifyAuthority } from '../middleware/verifyAuth.js'
import { getThreads, getThreadsByUserId, createThread, deleteThread, addNewMessage, getThreadMessages, deleteUserThreads, changeThreadName} from '../controllers/thread.controller.js'
import { validateParams } from '../middleware/validation.js'


const router = Router()

router.get('/threads', validateParams,verifyAuthority, getThreads)  
router.get('/thread', validateParams,verifyAuthority,getThreadsByUserId)
router.get('/thread/:gptId', validateParams,verifyAuthority, getThreadMessages)
router.post('/thread', validateParams,verifyAuthority, createThread)
router.post('/thread/:gptId', validateParams,verifyAuthority, addNewMessage)
router.delete('/thread/:gptId',validateParams, verifyAuthority, deleteThread)
router.delete('/thread/', validateParams,verifyAuthority, deleteUserThreads)
router.put('/thread/:gptId', validateParams,verifyAuthority, changeThreadName)



export default router