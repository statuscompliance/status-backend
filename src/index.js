import express from 'express'
import catalogRoutes from './routes/catalog.routes.js'
import mashupRoutes from './routes/mashup.routes.js'
import controlRoutes from './routes/control.routes.js'
import inputRoutes from './routes/input.routes.js'
import indexRoutes from './routes/index.routes.js'
import inputControlRoutes from './routes/input_control.routes.js'
import cors from 'cors'

const app = express()

app.use(express.json())

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));

app.use(indexRoutes)
app.use('/api', catalogRoutes)
app.use('/api', mashupRoutes)
app.use('/api', controlRoutes)
app.use('/api', inputRoutes)
app.use('/api', inputControlRoutes)

app.listen(3001)
console.log(`Server on port ${3001}`)