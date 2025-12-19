import { Router } from 'express';
import { 
  listLinkers, 
  getLinker, 
  createLinker, 
  updateLinker, 
  deleteLinker,
  executeLinker,
  getLinkerDatasources
} from '../controllers/linker.controller.js';
import { verifyAuthority } from '../middleware/verifyAuth.js';

export default function () {
  const router = Router();

  router.use(verifyAuthority);

  router.get('/', listLinkers);
  router.get('/:id', getLinker);
  router.post('/', createLinker);
  router.patch('/:id', updateLinker);
  router.delete('/:id', deleteLinker);
  router.post('/:id/execute', executeLinker);
  router.get('/:id/datasources', getLinkerDatasources);

  return router;
}

/**
 * @swagger
 * tags:
 *   name: Databinder Linker
 *   description: Linker management - Coordinate multiple datasources
 */

/**
 * @swagger
 * /databinder/linker:
 *   get:
 *     summary: List all linkers owned by the authenticated user
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of linkers (configs are hidden)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Linker'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /databinder/linker/{id}:
 *   get:
 *     summary: Get a specific linker by ID (owned by the user)
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The linker including datasource configurations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Linker'
 *       404:
 *         description: Linker not found or unauthorized
 */

/**
 * @swagger
 * /databinder/linker:
 *   post:
 *     summary: Create a new linker
 *     description: |
 *       Create a new linker that coordinates multiple datasources. A linker can fetch data from 
 *       multiple datasources and combine the results using different merge strategies.
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - datasourceIds
 *               - datasourceConfigs
 *             properties:
 *               name:
 *                 type: string
 *                 description: Human-readable name for the linker
 *                 example: "Multi-Source Data Aggregator"
 *               defaultMethodName:
 *                 type: string
 *                 default: default
 *                 description: Default method name to use when fetching from datasources
 *                 example: "getAll"
 *               datasourceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of datasource IDs to coordinate
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "987fcdeb-51a2-43d7-b789-123456789abc"]
 *               datasourceConfigs:
 *                 type: object
 *                 required: true
 *                 description: |
 *                   Configuration map for each datasource (REQUIRED). 
 *                   Each datasource MUST have a methodConfig with a methodName specified.
 *                   This ensures proper method configuration for all datasources.
 *                 additionalProperties:
 *                   type: object
 *                   required:
 *                     - methodConfig
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     methodConfig:
 *                       type: object
 *                       required:
 *                         - methodName
 *                       properties:
 *                         methodName:
 *                           type: string
 *                           description: Name of the method to invoke (REQUIRED)
 *                         options:
 *                           type: object
 *                           description: Method-specific options
 *                     propertyMapping:
 *                       type: object
 *                       additionalProperties:
 *                         type: string
 *                 example:
 *                   "123e4567-e89b-12d3-a456-426614174000":
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     methodConfig:
 *                       methodName: "getAll"
 *                       options:
 *                         limit: 10
 *                     propertyMapping:
 *                       userId: "user_id"
 *                       userName: "user_name"
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: "Aggregates user data from multiple API sources"
 *               environment:
 *                 type: string
 *                 description: Environment (production, staging, dev)
 *                 enum: [production, staging, dev]
 *                 default: production
 *           examples:
 *             requiredConfigs:
 *               summary: Linker with Required Datasource Configs
 *               description: |
 *                 All linkers MUST specify datasourceConfigs with methodConfig for each datasource.
 *                 Each methodConfig MUST include a methodName.
 *               value:
 *                 name: "Enhanced Data Aggregator"
 *                 defaultMethodName: "getAll"
 *                 datasourceIds: 
 *                   - "123e4567-e89b-12d3-a456-426614174000"
 *                   - "987fcdeb-51a2-43d7-b789-123456789abc"
 *                 datasourceConfigs:
 *                   "123e4567-e89b-12d3-a456-426614174000":
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     methodConfig:
 *                       methodName: "getAll"
 *                       options:
 *                         limit: 100
 *                     propertyMapping:
 *                       userId: "id"
 *                       userName: "name"
 *                   "987fcdeb-51a2-43d7-b789-123456789abc":
 *                     id: "987fcdeb-51a2-43d7-b789-123456789abc"
 *                     methodConfig:
 *                       methodName: "listRecursive"
 *                       options:
 *                         path: "/"
 *                         maxDepth: 5
 *                     propertyMapping:
 *                       userEmail: "email"
 *                 description: "Advanced aggregator with property mappings"
 *                 environment: "production"
 *     responses:
 *       201:
 *         description: Linker created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Linker created successfully"
 *                 datasourceCount:
 *                   type: integer
 *                   example: 2
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 defaultMethodName:
 *                   type: string
 *                 datasourceIds:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request or configuration
 *       409:
 *         description: Linker with same name already exists
 */

/**
 * @swagger
 * /databinder/linker/{id}:
 *   patch:
 *     summary: Update a linker
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               defaultMethodName:
 *                 type: string
 *               datasourceIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               datasourceConfigs:
 *                 type: object
 *               description:
 *                 type: string
 *               environment:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Linker updated successfully
 *       400:
 *         description: Invalid request or configuration
 *       404:
 *         description: Linker not found or unauthorized
 */

/**
 * @swagger
 * /databinder/linker/{id}:
 *   delete:
 *     summary: Delete a linker
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Linker deleted successfully
 *       404:
 *         description: Linker not found or unauthorized
 */

/**
 * @swagger
 * /databinder/linker/{id}/execute:
 *   post:
 *     summary: Execute a linker to fetch data from all configured datasources
 *     description: |
 *       Executes all datasources in the linker and returns combined results. Supports different 
 *       merge strategies to combine data from multiple sources.
 *       
 *       **New in v1.2.2**: Runtime method selection support. You can now specify `methodName` 
 *       in the options to override the configured method for all datasources, or the system will use:
 *       1. Method specified in options.methodName (runtime override)
 *       2. Method configured in datasourceConfigs.methodConfig.methodName
 *       3. Linker's defaultMethodName
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               options:
 *                 type: object
 *                 description: |
 *                   Options to pass to datasource methods. Can include `methodName` to override 
 *                   the configured method at runtime.
 *                 properties:
 *                   methodName:
 *                     type: string
 *                     description: |
 *                       Optional method name to override configured method for all datasources.
 *                       This provides runtime method selection without reconfiguration.
 *                     example: "getById"
 *                 example:
 *                   methodName: "listFiles"
 *                   path: "/documents"
 *               mergeStrategy:
 *                 type: string
 *                 enum: [concat, merge, override, indexed]
 *                 default: indexed
 *                 description: |
 *                   Strategy for merging results:
 *                   - concat: Concatenate arrays from all datasources
 *                   - merge: Merge objects from all datasources
 *                   - override: Use only the last datasource's result
 *                   - indexed: Return an object indexed by datasource ID
 *           examples:
 *             simpleExecution:
 *               summary: Simple Execution (Uses Configured Methods)
 *               description: Executes using methods configured in datasourceConfigs
 *               value:
 *                 options: {}
 *                 mergeStrategy: "indexed"
 *             runtimeMethodSelection:
 *               summary: Runtime Method Override (New in v1.2.2)
 *               description: Override configured method at runtime without reconfiguration
 *               value:
 *                 options:
 *                   methodName: "getById"
 *                   id: "12345"
 *                 mergeStrategy: "indexed"
 *             withOptions:
 *               summary: Execution with Method and Options
 *               description: Specify method and pass additional options
 *               value:
 *                 options:
 *                   methodName: "listFiles"
 *                   path: "/documents"
 *                   recursive: true
 *                 mergeStrategy: "concat"
 *     responses:
 *       200:
 *         description: Linker executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 linkerId:
 *                   type: string
 *                   format: uuid
 *                 linkerName:
 *                   type: string
 *                 executionStatus:
 *                   type: string
 *                   enum: [success, failure]
 *                 mergeStrategy:
 *                   type: string
 *                 mergedData:
 *                   description: Combined data from all datasources
 *                 executionMetadata:
 *                   type: object
 *                   properties:
 *                     linkerId:
 *                       type: string
 *                     executionId:
 *                       type: string
 *                     datasourceCount:
 *                       type: integer
 *                     executionDuration:
 *                       type: integer
 *                     successfulDatasources:
 *                       type: integer
 *                     failedDatasources:
 *                       type: integer
 *                 executionSummary:
 *                   type: object
 *                   properties:
 *                     totalDatasources:
 *                       type: integer
 *                     successful:
 *                       type: integer
 *                     failed:
 *                       type: integer
 *                     datasourceResults:
 *                       type: array
 *                       items:
 *                         type: object
 *                 detailedResults:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       datasourceId:
 *                         type: string
 *                       datasourceName:
 *                         type: string
 *                       success:
 *                         type: boolean
 *                       error:
 *                         type: string
 *                       data:
 *                         description: Data returned by this datasource
 *       400:
 *         description: Execution failed or datasources not available
 *       404:
 *         description: Linker not found or unauthorized
 */

/**
 * @swagger
 * /databinder/linker/{id}/datasources:
 *   get:
 *     summary: Get all datasources configured in a linker
 *     tags: [Databinder Linker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Datasources in the linker
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 linkerId:
 *                   type: string
 *                   format: uuid
 *                 linkerName:
 *                   type: string
 *                 datasourceCount:
 *                   type: integer
 *                 datasources:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       definitionId:
 *                         type: string
 *                       description:
 *                         type: string
 *                       environment:
 *                         type: string
 *                       isActive:
 *                         type: boolean
 *                       testStatus:
 *                         type: string
 *                       linkerConfig:
 *                         type: object
 *                         description: Linker-specific configuration for this datasource
 *       404:
 *         description: Linker not found or unauthorized
 */
