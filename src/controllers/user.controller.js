import {pool} from '../db.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


export async function signUp(req, res) {
    const { username, password, email } = req.body
    const [rows] = await pool.query('SELECT * FROM User WHERE username = ?', [username]);

    if (rows.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
    }
    const authority = 'ADMIN'
    const hashedPassword = await bcrypt.hash(password, 10)
    try {
        await pool.query('INSERT INTO User (username, password, authority, email) VALUES(?,?,?,?)', [username, hashedPassword,authority,email]);
        res.status(201).json({ message: `User ${username} created successfully with authority ${authority}` });
    } catch (error) {
        res.status(500).json({ message: `Failed to create user, error: ${error.message}` })
    }
}


export async function signIn(req, res) {
    const { username, password } = req.body;
    try {
        const user = (await pool.query('SELECT * FROM User WHERE username = ?', [username]))[0][0]
        if (!user || user.length === 0) {
            return res.status(404).json({ message: 'User not found' })
        }
        const hashedPassword = user.password;

        const isPasswordValid = await bcrypt.compare(password, hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' })
        }else{
            const accessToken = jwt.sign({ user_id: user.id, username: user.username , authority: user.authority }, process.env.JWT_SECRET, { expiresIn: '1h' })
            const refreshToken = jwt.sign({ user_id: user.id, username: user.username, authority: user.authority }, process.env.REFRESH_JWT_SECRET, { expiresIn: '1d' })
            await pool.query('UPDATE User SET refresh_token = ? WHERE username = ?', [refreshToken, username])
            res.status(200).json({ username:username ,accessToken: accessToken, refreshToken: refreshToken});
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
    const user =(await pool.query('SELECT * FROM User WHERE refresh_token = ?', [refreshToken]))[0][0]
    if (user.length === 0) {
        res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'none', maxAge: 24*60*60*1000})
        return res.sendStatus(204)
    }
    await pool.query('UPDATE User SET refresh_token = ? WHERE refresh_token = ?', ['', refreshToken])
    res.clearCookie('refreshToken',{ httpOnly: true, secure: true, sameSite: 'none', maxAge: 24*60*60*1000})
    res.sendStatus(204)
}

export async function getUsers(req, res) { // THIS IS A TEST FUNCTION
    const [rows] = await pool.query('SELECT * FROM User');
    res.status(200).json(rows);
}

export async function getAuthority(req, res) {
    const username = req.params.username
    const [rows] = await pool.query('SELECT authority FROM User WHERE username = ?', [username]);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(rows[0]);
}