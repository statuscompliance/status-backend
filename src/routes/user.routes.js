import {Router} from 'express'
import {signIn,signUp, signOut, getUsers, getAuthority} from '../controllers/user.controller.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { verifyAuthority } from '../middleware/verifyAuth.js'
import { validateParams } from '../middleware/validation.js'
const router = Router()

router.post('/user/signIn',validateParams,signIn)

router.post('/user/signUp', validateParams, signUp)

router.get('/user/signOut',validateParams, signOut)

router.get('/user',validateParams,verifyAuthority,getUsers)

router.get('/auth/:username',validateParams,verifyJWT,getAuthority)

export default router