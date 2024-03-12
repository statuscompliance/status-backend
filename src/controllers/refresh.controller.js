import {pool} from '../db.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export async function refreshToken(req, res) {
    const cookies = req.cookies
    if(!cookies?.refreshToken){
        return res.status(401).json({message: 'No token provided'})
    }
    const refreshToken = cookies.refreshToken
    const user = (await pool.query('SELECT * FROM User WHERE refresh_token = ?', [refreshToken]))[0][0]
    if(user.length === 0){
        return res.status(403).json({message: 'Invalid token'})
    }
    jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET, (err, decoded) => {
        if(err || user.username !== decoded.username){
            return res.status(403).json({message: 'Invalid token'})
        }
        const accessToken = jwt.sign({ username: user.username, authority: user.authority}, process.env.JWT_SECRET, { expiresIn: '1h' })
        res.status(200).json({accessToken: accessToken})
    })
}