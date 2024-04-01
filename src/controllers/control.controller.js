import { pool } from "../db.js";

function formatControlDates(row) {
  return {
    ...row,
    startDate: row.startDate ? row.startDate.toISOString().split("T")[0] : null,
    endDate: row.endDate ? row.endDate.toISOString().split("T")[0] : null,
  };
}

export const getControls = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM control");
  const formattedRows = rows.map(formatControlDates);
  res.json(formattedRows);
};

export const getControl = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM control WHERE id = ?", [
    req.params.id,
  ]);

  if (rows.length <= 0)
    return res.status(404).json({
      message: "Control not found",
    });

  const formattedRow = formatControlDates(rows[0]);

  res.json(formattedRow);
};

export const getCatalogControls = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM control WHERE catalog_id = ?",
    [req.params.id]
  );
  const formattedRows = rows.map(formatControlDates);

  res.json(formattedRows);
};

export const getInputControlsByControlId = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM input_control WHERE control_id = ?",
    [req.params.id]
  );

  res.json(rows);
};

export const createControl = async (req, res) => {
  const {
    name,
    description,
    period,
    startDate,
    endDate,
    mashup_id,
    catalog_id,
  } = req.body;
  const [rows] = await pool.query(
    "INSERT INTO control (name,description,period,startDate,endDate,mashup_id,catalog_id) VALUES(?,?,?,?,?,?,?)",
    [name, description, period, startDate, endDate, mashup_id, catalog_id]
  );
  res.send({
    id: rows.insertId,
    name,
    description,
    period,
    startDate,
    endDate,
    mashup_id,
    catalog_id,
  });
};

export const updateControl = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    period,
    startDate,
    endDate,
    mashup_id,
    catalog_id,
  } = req.body;

  const [result] = await pool.query(
    "UPDATE control SET name = IFNULL(?, name), description = IFNULL(?, description), period = IFNULL(?, period), startDate = IFNULL(?, startDate), endDate = IFNULL(?, endDate), mashup_id = IFNULL(?, mashup_id), catalog_id = IFNULL(?, catalog_id) WHERE id = ?",
    [name, description, period, startDate, endDate, mashup_id, catalog_id, id]
  );

  if (result.affectedRows <= 0)
    return res.status(404).json({
      message: "Control not found",
    });

  const [rows] = await pool.query("SELECT * FROM control WHERE id = ?", [id]);
  const formattedRow = formatControlDates(rows[0]);
  res.json(formattedRow);
};

export const deleteControl = async (req, res) => {
  const [result] = await pool.query("DELETE FROM control WHERE id = ?", [
    req.params.id,
  ]);

  if (result.affectedRows <= 0)
    return res.status(404).json({
      message: "Control not found",
    });

  res.sendStatus(204);
};

export const deleteInputControlsByControlId = async (req, res) => {
  await pool.query("DELETE FROM input_control WHERE control_id = ?", [
    req.params.id,
  ]);

  res.sendStatus(204);
};
