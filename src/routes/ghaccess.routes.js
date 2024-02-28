import {Router} from 'express'
import dotenv from 'dotenv';

dotenv.config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

var client_id = process.env.GH_CLIENT_ID;
var client_secret = process.env.GH_CLIENT_SECRET;

const router = Router()
router.get('/ghAccessToken', async function (req, res) {
    try {
        const code = req.query.code;
        console.log(code);
        
        const params = `?client_id=${client_id}&client_secret=${client_secret}&code=${code}`;
        const response = await fetch("https://github.com/login/oauth/access_token" + params, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Error al solicitar el token de acceso a GitHub: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
        res.json(data);
    } catch (error) {
        console.error('Error al obtener el token de acceso de GitHub:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

router.get('/getAuth', async function (req, res) {
    try {
        const authorizationHeader = req.get('Authorization');
        console.log(authorizationHeader);
        res.json({ authorizationHeader });
    } catch (error) {
        console.error('Error al obtener el encabezado de autorización:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

export default router