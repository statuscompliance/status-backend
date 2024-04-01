import { pool } from "../db.js";

export const getInputControls = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM input_control");
  res.json(rows);
};

export const getInputControl = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM input_control WHERE id = ?", [
    req.params.id,
  ]);

  if (rows.length <= 0)
    return res.status(404).json({
      message: "InputControl not found",
    });

  res.json(rows[0]);
};

export const getValuesByInputIdAndControlId = async (req, res) => {
  const [rows] = await pool.query(
    "SELECT * FROM input_control WHERE input_id = ? AND control_id = ?",
    [req.params.input_id, req.params.control_id]
  );
  res.json(rows[0]);
};

export const createInputControl = async (req, res) => {
  const { value, input_id, control_id } = req.body;
  const [rows] = await pool.query(
    "INSERT INTO input_control (value,input_id,control_id) VALUES(?,?,?)",
    [value, input_id, control_id]
  );
  res.send({
    id: rows.insertId,
    value,
    input_id,
    control_id,
  });
};

export const updateInputControl = async (req, res) => {
  const { id } = req.params;
  const { value, input_id, control_id } = req.body;

  const [result] = await pool.query(
    "UPDATE input_control SET value = IFNULL(?, value), input_id = IFNULL(?, input_id), control_id = IFNULL(?, control_id) WHERE id = ?",
    [value, input_id, control_id, id]
  );

  if (result.affectedRows <= 0)
    return res.status(404).json({
      message: "InputControl not found",
    });

  const [rows] = await pool.query("SELECT * FROM input_control WHERE id = ?", [
    id,
  ]);

  res.json(rows[0]);
};

export const deleteInputControl = async (req, res) => {
  const [result] = await pool.query("DELETE FROM input_control WHERE id = ?", [
    req.params.id,
  ]);

  if (result.affectedRows <= 0)
    return res.status(404).json({
      message: "InputControl not found",
    });

  res.sendStatus(204);
};
