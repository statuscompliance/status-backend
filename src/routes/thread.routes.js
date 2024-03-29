import {Router} from 'express'

import { verifyAuthority } from '../middleware/verifyAuth.js'
import { getThreadsByUserId, createThread, deleteThread, addNewMessage, getThreadMessages, deleteUserThreads} from '../controllers/thread.controller.js'


const router = Router()

router.get('/thread', verifyAuthority,getThreadsByUserId)
router.get('/thread/:gptId', verifyAuthority, getThreadMessages)
router.post('/thread', verifyAuthority, createThread)
router.post('/thread/:gptId', verifyAuthority, addNewMessage)
router.delete('/thread/:gptId', verifyAuthority, deleteThread)
router.delete('/thread/', verifyAuthority, deleteUserThreads)



export default router