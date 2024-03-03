import {pool} from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export async function signUp(req, res) {
    const { username, password } = req.body

    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);
    if (rows.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const [row] = await pool.query('INSERT INTO user (username, password) VALUES(?,?)', [username, hashedPassword]);
        res.status(201).json({ message: `User ${username} created successfully` });
    } catch (error) {
        res.status(500).json({ message: `Failed to create user, error: ${error.message}` })
    }
}


export async function signIn(req, res) {
    const { username, password } = req.body;

    try {
        const user = (await pool.query('SELECT * FROM user WHERE username = ?', [username]))[0][0]
        if (!user || user.length === 0) {
            return res.status(404).json({ message: 'User not found' })
        }
        
        const hashedPassword = user.password;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' })
        }else{
            const accessToken = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' })
            const refreshToken = jwt.sign({ username: user.username }, process.env.REFRESH_JWT_SECRET, { expiresIn: '1d' })
            const [row] = await pool.query('UPDATE user SET refresh_token = ? WHERE username = ?', [refreshToken, username])
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'none' , maxAge: 24*60*60*1000})
            res.status(200).json({ message: `User ${username} signed in successfully, here you have your token`,accessToken: accessToken});
        }
    } catch (error) {
        console.error('Error during sign-in:', error);
        res.status(500).json({ message: 'Internal server error' })
    }
}

export async function signOut(req, res) {
    const cookies = req.cookies
    if(!cookies?.refreshToken){
        return res.sendStatus(204)
    }
    const refreshToken = cookies.refreshToken
    const user =(await pool.query('SELECT * FROM user WHERE refresh_token = ?', [refreshToken]))[0][0]
    if (user.length === 0) {
        res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none', maxAge: 24*60*60*1000})
        return res.sendStatus(204)
    }
    const [row] = await pool.query('UPDATE user SET refresh_token = ? WHERE refresh_token = ?', ['', refreshToken])
    res.clearCookie('refreshToken',{ httpOnly: true, secure: true, sameSite: 'none', maxAge: 24*60*60*1000})
    res.sendStatus(204)
}