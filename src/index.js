import express from 'express'
import catalogRoutes from './routes/catalog.routes.js'
import controlRoutes from './routes/control.routes.js'
import inputRoutes from './routes/input.routes.js'
import indexRoutes from './routes/index.routes.js'
import inputControlRoutes from './routes/input_control.routes.js'
import ghAccess from './routes/ghaccess.routes.js'
import userRoutes from './routes/user.routes.js'
import refresh from './routes/refresh.routes.js'
import assistantRoutes from './routes/assistant.routes.js'
import threadRoutes from './routes/thread.routes.js'
import configRoutes from './routes/configuration.routes.js'
import cors from 'cors'
import { verifyAuthority } from './middleware/verifyAuth.js'
import { validateParams } from './middleware/validation.js'
import { endpointAvailable } from './middleware/endpoint.js'
import cookieParser from 'cookie-parser'
import Configuration from './models/configuration.model.js';
import db from '../db/database.js';
import { verifyAdmin } from './middleware/verifyAdmin.js';

const app = express()

app.use(express.json())

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
}));

app.use(indexRoutes)
app.use(endpointAvailable)
app.use('/api', ghAccess)
app.use('/api', refresh)
app.use('/api', userRoutes)
app.use(validateParams)
app.use('/api', inputRoutes)
app.use('/api', inputControlRoutes)
app.use('/api', controlRoutes)
app.use('/api', catalogRoutes)
app.use(verifyAuthority)
app.use('/api', assistantRoutes)
app.use('/api', threadRoutes)
app.use(verifyAdmin)
app.use('/api', configRoutes)
app.use(cookieParser())

app.listen(3001)


async function insertEndpointsToConfig(){
    const endpoints = [
        "/api/config",
        "/api/refresh",
        "/api/user",
        "/api/input",
        "/api/input_control",
        "/api/control",
        "/api/thread",
        "/api/catalog",
        "/api/assistant",
        "/api/ghAccessToken"
    ];
    try {
        await db.sync(); 
        for (const endpoint of endpoints) {
            if (endpoint === "/api/assitant"){
                await Configuration.findOrCreate({
                    where: { endpoint },
                    defaults: { endpoint, available: true, limit: 5}
                });
            } else {
                await Configuration.findOrCreate({
                    where: { endpoint },
                    defaults: { endpoint, available: true }
                });
            }
            
        }
        console.log('Endpoints added to the configuration');
    } catch (error) {
        console.error('Error al insertar endpoints:', error);
    }
}
insertEndpointsToConfig();
console.log(`Server on port ${3001}`)