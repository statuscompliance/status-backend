import models from '../../db/models.js'
import jwt from 'jsonwebtoken'

export async function refreshToken(req, res) {
    if(!req.headers['authorization']){
        return res.status(401).json({message: 'No token provided'})
    }else {
        try{
            const refreshToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1]
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_JWT_SECRET)
            const userId = decoded.user_id

            // const user = (await pool.query('SELECT * FROM User WHERE id = ?', [userId]))[0][0]
            const user = await models.User.findByPk(userId)
            if(user){
                const accessToken = jwt.sign({ user_id: user.id, username: user.username , authority: user.authority }, process.env.JWT_SECRET, { expiresIn: '1h' })
                res.status(200).json({accessToken: accessToken})
            }else{
                res.status(401).json({message: 'Invalid token'})
            }
        } catch(error){
            res.status(500).json({message: `Failed to refresh token, error: ${error.message}`})
        }
    }
}