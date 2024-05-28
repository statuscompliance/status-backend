import { pool } from "../db.js";
import fs from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatControlDates(row) {
  function toLocalISOString(date) {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString();
    return localISOTime.split("T")[0];
  }

  return {
    ...row,
    startDate: row.startDate ? toLocalISOString(row.startDate) : null,
    endDate: row.endDate ? toLocalISOString(row.endDate) : null,
  };
}


export const getCatalogs = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM catalog");
  const formattedRows = rows.map(formatControlDates);
  res.json(formattedRows);
};

export const getCatalog = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM catalog WHERE id = ?", [
    req.params.id,
  ]);

  if (rows.length <= 0)
    return res.status(404).json({
      message: "Catalog not found",
    });

  const formattedRow = formatControlDates(rows[0]);

  res.json(formattedRow);
};

export const createCatalog = async (req, res) => {
  const { name, url, startDate, endDate } = req.body;
  const [rows] = await pool.query(
    "INSERT INTO catalog (name,url,startDate,endDate) VALUES(?,?,?,?)",
    [name, url, startDate, endDate]
  );
  res.send({
    id: rows.insertId,
    name,
    url,
    startDate,
    endDate,
  });
};

export const getTpa = async (req, res) => {
  const { catalogId } = req.params;
  const filePath = join(__dirname, "../tpa", `tpa-${catalogId}.json`);

  try {
    const content = await fs.readFile(filePath, "utf8");
    res.json(JSON.parse(content));
  } catch (err) {
    console.error("Error al leer el archivo:", err);
    res.status(500).send("Error al cargar el TPA");
  }
};

export const saveTpa = async (req, res) => {
  const { content, catalogId } = req.body;
  const filePath = join(__dirname, "../tpa", `tpa-${catalogId}.json`);

  try {
    await fs.writeFile(filePath, content, "utf8");
    res.send("TPA guardado con éxito");
  } catch (err) {
    console.error("Error al escribir el archivo:", err);
    res.status(500).send("Error al guardar el TPA");
  }
};

export const deleteTPAByCatalogId = async (req, res) => {
  const { catalogId } = req.params;
  const filePath = join(__dirname, "../tpa", `tpa-${catalogId}.json`);

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
  const { id } = req.params;
  const { name, url, startDate, endDate } = req.body;

  const [result] = await pool.query(
    "UPDATE catalog SET name = IFNULL(?, name), url = IFNULL(?, url), startDate = IFNULL(?, startDate), endDate = IFNULL(?, endDate) WHERE id = ?",
    [name, url, startDate, endDate, id]
  );

  if (result.affectedRows <= 0)
    return res.status(404).json({
      message: "Catalog not found",
    });

  const [rows] = await pool.query("SELECT * FROM catalog WHERE id = ?", [id]);
  const formattedRow = formatControlDates(rows[0]);

  res.json(formattedRow);
};

export const deleteCatalog = async (req, res) => {
  const [result] = await pool.query("DELETE FROM catalog WHERE id = ?", [
    req.params.id,
  ]);

  if (result.affectedRows <= 0)
    return res.status(404).json({
      message: "Catalog not found",
    });

  res.sendStatus(204);
};
