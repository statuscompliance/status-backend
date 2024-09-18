import models from '../../db/models.js'
import fs from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const getCatalogs = async (req, res) => {
    const catalogs = await models.Catalog.findAll();
    res.json(catalogs);
}

export const getCatalog = async (req, res) => {
    const row = await models.Catalog.findByPk(req.params.id);

    if (!row)
        return res.status(404).json({
          message: "Catalog not found",
        });
        
    res.json(row);
}

export const createCatalog = async (req, res) => {
    const {name,startDate,endDate} = req.body

    const formattedStartDate = startDate ? startDate : null;
    const formattedEndDate = endDate ? endDate : null;

    const rows = await models.Catalog.create({
        name,
        formattedStartDate,
        formattedEndDate
    }); 

    res.send({
        id: rows.id,
        name,
        formattedStartDate,
        formattedEndDate,
    })
}

export const getTpa = async (req, res) => {
    const { catalog_id } = req.params;
    const filePath = join(__dirname, "../tpa", `tpa-${catalog_id}.json`);
  
    try {
      const content = await fs.readFile(filePath, "utf8");
      res.json(JSON.parse(content));
    } catch (err) {
      console.error("Error al leer el archivo:", err);
      res.status(500).send("Error al cargar el TPA");
    }
};

export const saveTpa = async (req, res) => {
    const { content, catalog_id } = req.body;
    const filePath = join(__dirname, "../tpa", `tpa-${catalog_id}.json`);
  
    try {
      await fs.writeFile(filePath, content, "utf8");
      res.send("TPA guardado con éxito");
    } catch (err) {
      console.error("Error al escribir el archivo:", err);
      res.status(500).send("Error al guardar el TPA");
    }
};

export const deleteTPAByCatalogId = async (req, res) => {
    const { catalog_id } = req.params;
    const filePath = join(__dirname, "../tpa", `tpa-${catalog_id}.json`);
  
    try {
      await fs.unlink(filePath);
      res.send("TPA eliminado con éxito");
    } catch (err) {
      if (err.code === 'ENOENT') {
        res.status(404).send("El TPA no existe");
      } else {
        console.error("Error al eliminar el archivo:", err);
        res.status(500).send("Error al eliminar el TPA");
      }
    }
  };

export const updateCatalog = async (req, res) => {
    const {id} = req.params
    const {name, startDate, endDate} = req.body

    const currentCatalog = await models.Catalog.findByPk(id);
    if (!currentCatalog) {
        return res.status(404).json({ message: 'Catalog not found' });
    }

    await models.Catalog.update({
        name,
        startDate,
        endDate,
    }, {
        where: {
            id
        }
    });

    const row = await models.Catalog.findByPk(id);

    res.json(row);
}

export const deleteCatalog = async (req, res) => {
    const result = await models.Catalog.destroy({
        where: {
            id: req.params.id
        }
    });

    if (result <= 0)
        return res.status(404).json({
          message: "Catalog not found",
        });
    
    res.sendStatus(204);
}