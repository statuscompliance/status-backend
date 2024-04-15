import {Router} from 'express'

import { verifyAuthority } from '../middleware/verifyAuth.js'
import { getThreads, getThreadsByUserId, createThread, deleteThread, addNewMessage, getThreadMessages, deleteUserThreads, changeThreadName} from '../controllers/thread.controller.js'


const router = Router()

router.get('/threads', verifyAuthority, getThreads)  
router.get('/thread', verifyAuthority,getThreadsByUserId)
router.get('/thread/:gptId', verifyAuthority, getThreadMessages)
router.post('/thread', verifyAuthority, createThread)
router.post('/thread/:gptId', verifyAuthority, addNewMessage)
router.delete('/thread/:gptId', verifyAuthority, deleteThread)
router.delete('/thread/', verifyAuthority, deleteUserThreads)
router.put('/thread/:gptId', verifyAuthority, changeThreadName)



export default router