import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define('Thread', {
  gpt_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  run_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
});


/**
 * @swagger
 * components:
 *   schemas:
 *     Thread:
 *       type: object
 *       properties:
 *         gpt_id:
 *           type: string
 *           description: The GPT ID of the thread
 *         name:
 *           type: string
 *           description: The name of the thread
 *         run_id:
 *           type: string
 *           description: The run ID of the thread
 *       required:
 *         - gpt_id
 *         - name
 *         - run_id
 *       example:
 *         gpt_id: thread_a1231sad12ea
 *         name: Nuevo Hilo
 *         run_id: run_ajsd12eacxqwd
 */
