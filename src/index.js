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
import cors from 'cors'
import { verifyJWT } from './middleware/verifyJWT.js'
import cookieParser from 'cookie-parser'

const app = express()

app.use(express.json())

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
}));

app.use(indexRoutes)
app.use('/api', inputRoutes)
app.use('/api', refresh)
app.use('/api', userRoutes)
// app.use(verifyJWT) // All routes below this line are protected
app.use('/api', inputControlRoutes)
app.use('/api', controlRoutes)
app.use('/api', ghAccess)
app.use('/api', catalogRoutes)
app.use('/api', assistantRoutes)
app.use('/api', threadRoutes)
app.use(cookieParser())

app.listen(3001)
console.log(`Server on port ${3001}`)