import mongoose from 'mongoose';

const scopeSetSchema = new mongoose.Schema({
  controlId: { type: Number, required: true },
  scopes: { type: Map, of: String },
});

export default mongoose.model('ScopeSet', scopeSetSchema);

/**
 * @swagger
 * components:
 *   schemas:
 *     ScopeSet:
 *       type: object
 *       required:
 *         - controlId
 *         - scopes
 *       properties:
 *         controlId:
 *           type: integer
 *           description: The ID of the control
 *         scopes:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           description: A map of scopes
 *       example:
 *         controlId: 1
 *         scopes: 
 *           "country": "Spain"
 *           "city": "Seville"
 */
