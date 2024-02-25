import {Router} from 'express'
import {getCatalogs, getCatalog, createCatalog, updateCatalog, deleteCatalog} from '../controllers/catalog.controller.js'

const router = Router()

router.get('/catalog', getCatalogs)

router.get('/catalog/:id', getCatalog)

router.post('/catalog', createCatalog)

router.patch('/catalog/:id', updateCatalog)

router.delete('/catalog/:id', deleteCatalog)

export default router