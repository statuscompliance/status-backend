import {Router} from 'express'
import {signIn,signUp, signOut, getUsers, getAuthority} from '../controllers/user.controller.js'
import { verifyJWT } from '../middleware/verifyJWT.js'

const router = Router()

router.post('/user/signIn', signIn)

router.post('/user/signUp', signUp)

router.get('/user/signOut', signOut)

router.get('/user',getUsers)

router.get('/auth/:username',verifyJWT,getAuthority)

export default router