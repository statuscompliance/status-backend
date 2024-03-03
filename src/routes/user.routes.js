import {Router} from 'express'
import {signIn,signUp, signOut} from '../controllers/user.controller.js'

const router = Router()

router.get('/user/signIn', signIn)

router.post('/user/signUp', signUp)

router.get('/user/signOut', signOut)

export default router