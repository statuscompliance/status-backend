import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function verifyJWT(req, res, next) {
    const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' })
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
        req.username = decoded.username
        next()
    } catch (error) {
        return res.status(401).json({ message: `Unauthorized, ${error}` })
    }
}