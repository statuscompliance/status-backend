import {Router} from 'express'
import {signIn,signUp, signOut, getUsers, getAuthority} from '../controllers/user.controller.js'
const router = Router()

router.post('/user/signIn',signIn)

router.post('/user/signUp', signUp)

router.get('/user/signOut', signOut)

router.get('/user',getUsers)

router.get('/user/auth/',getAuthority)

export default router