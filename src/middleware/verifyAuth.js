import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function verifyAuthority(req, res, next) {
    const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' })
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
        const authority = decoded.authority
        if (authority === 'ADMIN') {
            next()
        } else {
            return res.status(403).json({ message: 'Forbidden' })
        }
    } catch (error) {
        return res.status(401).json({ message: `Unauthorized, ${error}` })
    }
}
