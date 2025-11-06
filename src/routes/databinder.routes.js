import { Router } from 'express';
import {
  listDatasources,
  getDatasource,
  createDatasource,
  updateDatasource,
  deleteDatasource,
  testDatasource,
  listAvailableDefinitions,
  fetchFromDatasource,
  getDatasourceMethods
} from '../controllers/databinder.controller.js';
import { verifyAuthority } from '../middleware/verifyAuth.js';

export default function () {
  const router = Router();

  // Datasource definitions (available types) - no auth required for listing available types
  router.get('/definitions/available', listAvailableDefinitions);

  // Datasource instances CRUD - using /ds for better readability
  router.get('/ds', verifyAuthority, listDatasources);
  router.get('/ds/:id', verifyAuthority, getDatasource);
  router.post('/ds', verifyAuthority, createDatasource);
  router.patch('/ds/:id', verifyAuthority, updateDatasource);
  router.delete('/ds/:id', verifyAuthority, deleteDatasource);
  
  // Additional datasource operations
  router.post('/ds/:id/test', verifyAuthority, testDatasource);
  router.get('/ds/:id/methods', verifyAuthority, getDatasourceMethods);
  router.post('/ds/:id/fetch', verifyAuthority, fetchFromDatasource);

  return router;
}

/**
 * @swagger
 * tags:
 *   name: Databinder Datasources
 *   description: Databinder datasources management
 */

/**
 * @swagger
 * /databinder/ds:
 *   get:
 *     summary: List all datasources owned by the authenticated user
 *     tags: [Databinder Datasources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of datasources (configs are hidden)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Datasource'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /databinder/ds/{id}:
 *   get:
 *     summary: Get a specific datasource by ID (owned by the user)
 *     tags: [Databinder Datasources]
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
 *         description: The datasource including configuration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Datasource'
 *       404:
 *         description: Datasource not found or unauthorized
 */

/**
 * @swagger
 * /databinder/ds:
 *   post:
 *     summary: Create a new datasource
 *     description: |
 *       Create a new datasource instance with configuration validation. The datasource will be 
 *       validated against the definition schema and tested for basic connectivity.
 *     tags: [Databinder Datasources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - definitionId
 *               - config
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the datasource
 *                 example: "External API"
 *               definitionId:
 *                 type: string
 *                 description: ID of the datasource definition to use
 *                 enum: [rest-api, microsoft-graph]
 *                 example: "rest-api"
 *               config:
 *                 type: object
 *                 description: Configuration object for the datasource
 *                 example:
 *                   baseUrl: "https://api.example.com"
 *                   defaultEndpoint: "/data"
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: "External REST API for data integration"
 *               environment:
 *                 type: string
 *                 description: Environment (production, staging, dev)
 *                 enum: [production, staging, dev]
 *                 default: production
 *           examples:
 *             jsonplaceholder:
 *               summary: JSONPlaceholder API
 *               description: Simple test API for prototyping
 *               value:
 *                 name: "JSONPlaceholder Posts"
 *                 definitionId: "rest-api"
 *                 config:
 *                   baseUrl: "https://jsonplaceholder.typicode.com"
 *                   defaultEndpoint: "/posts"
 *                 description: "Test API for posts data"
 *                 environment: "dev"
 *             restApiWithAuth:
 *               summary: REST API with Bearer Authentication
 *               description: External API with bearer token authentication
 *               value:
 *                 name: "External API with Auth"
 *                 definitionId: "rest-api"
 *                 config:
 *                   baseUrl: "https://api.example.com"
 *                   defaultEndpoint: "/data"
 *                   auth:
 *                     type: "bearer"
 *                     token: "your-api-token"
 *                   timeout: 10000
 *                   headers:
 *                     "Accept": "application/json"
 *                     "User-Agent": "MyApp/1.0"
 *                 description: "External REST API with authentication"
 *                 environment: "production"
 *             restApiWithBasicAuth:
 *               summary: REST API with Basic Authentication
 *               description: API using username/password authentication
 *               value:
 *                 name: "Legacy API"
 *                 definitionId: "rest-api"
 *                 config:
 *                   baseUrl: "https://legacy-api.company.com"
 *                   defaultEndpoint: "/api/v1/data"
 *                   auth:
 *                     type: "basic"
 *                     username: "api_user"
 *                     password: "secure_password"
 *                   requestOptions:
 *                     timeout: 30000
 *                 description: "Legacy API with basic authentication"
 *                 environment: "production"
 *             microsoftGraph:
 *               summary: Microsoft Graph API
 *               description: Microsoft Graph for Office 365 integration
 *               value:
 *                 name: "Company Directory"
 *                 definitionId: "microsoft-graph"
 *                 config:
 *                   tenantId: "12345678-1234-1234-1234-123456789012"
 *                   clientId: "87654321-4321-4321-4321-210987654321"
 *                   clientSecret: "your-client-secret"
 *                   scopes: ["https://graph.microsoft.com/.default"]
 *                 description: "Microsoft Graph for user directory access"
 *                 environment: "production"
 *             restApiWithCookies:
 *               summary: REST API with Cookie Authentication
 *               description: API using session cookies for authentication
 *               value:
 *                 name: "Session-based API"
 *                 definitionId: "rest-api"
 *                 config:
 *                   baseUrl: "https://session-api.example.com"
 *                   defaultEndpoint: "/api/data"
 *                   auth:
 *                     type: "cookie"
 *                     cookies:
 *                       JSESSIONID: "session-token-here"
 *                       auth_token: "additional-auth-token"
 *                   headers:
 *                     "X-Requested-With": "XMLHttpRequest"
 *                 description: "API using session cookies"
 *                 environment: "staging"
 *             customHeaderAuth:
 *               summary: REST API with Custom Header Authentication
 *               description: API using custom headers for authentication
 *               value:
 *                 name: "Custom Auth API"
 *                 definitionId: "rest-api"
 *                 config:
 *                   baseUrl: "https://custom-api.example.com"
 *                   defaultEndpoint: "/v2/data"
 *                   auth:
 *                     type: "custom"
 *                     headerValue: "ApiKey your-custom-api-key"
 *                   headers:
 *                     "X-API-Version": "2.0"
 *                     "Accept": "application/vnd.api+json"
 *                   timeout: 15000
 *                 description: "API with custom header authentication"
 *                 environment: "production"
 *     responses:
 *       201:
 *         description: Datasource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Datasource created successfully"
 *                 instanceId:
 *                   type: string
 *                   example: "123_external_api_1634567890123"
 *                 availableMethods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["getAll", "getById", "create", "update", "delete", "default"]
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 definitionId:
 *                   type: string
 *                 config:
 *                   type: object
 *                   description: The datasource configuration (sensitive fields may be hidden)
 *       400:
 *         description: Invalid request or configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid definitionId 'invalid-type'. Available types: rest-api, microsoft-graph"
 *       409:
 *         description: Datasource with same name already exists
 */

/**
 * @swagger
 * /databinder/ds/{id}:
 *   patch:
 *     summary: Update a datasource
 *     tags: [Databinder Datasources]
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
 *               definitionId:
 *                 type: string
 *               config:
 *                 type: object
 *               description:
 *                 type: string
 *               environment:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Datasource updated successfully
 *       400:
 *         description: Invalid request or configuration
 *       404:
 *         description: Datasource not found or unauthorized
 */

/**
 * @swagger
 * /databinder/ds/{id}:
 *   delete:
 *     summary: Delete a datasource
 *     tags: [Databinder Datasources]
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
 *         description: Datasource deleted successfully
 *       404:
 *         description: Datasource not found or unauthorized
 */

/**
 * @swagger
 * /databinder/ds/{id}/test:
 *   post:
 *     summary: Test a datasource connection with detailed test information
 *     tags: [Databinder Datasources]
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
 *         description: Test completed successfully with detailed results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Datasource test completed with status: success"
 *                 testStatus:
 *                   type: string
 *                   enum: [success, failure]
 *                 testDetails:
 *                   type: object
 *                   properties:
 *                     datasourceType:
 *                       type: string
 *                       example: "rest-api"
 *                     availableMethods:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["default", "getAll", "getById", "create", "update", "delete"]
 *                     testsPerformed:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           method:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [success, failure]
 *                           description:
 *                             type: string
 *                           error:
 *                             type: string
 *                 testResults:
 *                   type: object
 *                   description: Detailed results for each test performed
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalTests:
 *                       type: integer
 *                     successfulTests:
 *                       type: integer
 *                     failedTests:
 *                       type: integer
 *                     primaryMethod:
 *                       type: string
 *       400:
 *         description: Test failed
 *       404:
 *         description: Datasource not found or unauthorized
 */

/**
 * @swagger
 * /databinder/ds/{id}/methods:
 *   get:
 *     summary: Get available methods for a datasource
 *     tags: [Databinder Datasources]
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
 *         description: Available methods for the datasource
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 datasourceId:
 *                   type: string
 *                   format: uuid
 *                 datasourceName:
 *                   type: string
 *                 definitionId:
 *                   type: string
 *                 availableMethods:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       available:
 *                         type: boolean
 *                       type:
 *                         type: string
 *                       description:
 *                         type: string
 *                 methodCount:
 *                   type: integer
 *       404:
 *         description: Datasource not found or unauthorized
 */

/**
 * @swagger
 * /databinder/ds/{id}/fetch:
 *   post:
 *     summary: Fetch data from a datasource using a specific method
 *     description: |
 *       Fetch data from a datasource with various options including pagination, filtering, sorting, 
 *       response formats, and authentication overrides. This endpoint supports multiple response 
 *       formats and advanced querying capabilities.
 *       
 *       **Important**: When creating a datasource with `definitionId: "rest-api"`, you must specify
 *       the endpoint using `defaultEndpoint` in the config (e.g., `"defaultEndpoint": "/posts"`), 
 *       or override it in the fetch options using `endpoint` (e.g., `"options": {"endpoint": "/posts"}`).
 *       The datasource will default to `/data` if no endpoint is specified.
 *     tags: [Databinder Datasources]
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
 *               methodName:
 *                 type: string
 *                 default: "default"
 *                 description: Name of the method to execute
 *                 example: "getAll"
 *               propertyMapping:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *                 description: |
 *                   Optional property mapping to transform property names in the response data.
 *                   The system automatically extracts data from nested structures (e.g., {data: [...]})
 *                   and returns the extracted data directly as the result.
 *                   Property mapping is then applied to the clean data structure.
 *                 example:
 *                   "title": "name"
 *                   "created_at": "createdTimestamp"
 *                   "user_id": "userId"
 *               options:
 *                 type: object
 *                 description: Advanced options for data fetching
 *                 properties:
 *                   responseFormat:
 *                     type: string
 *                     enum: [full, batch, iterator, stream]
 *                     default: full
 *                     description: Format of the response data
 *                   pagination:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         default: false
 *                       pageSize:
 *                         type: integer
 *                         minimum: 1
 *                         maximum: 1000
 *                         example: 20
 *                       startPage:
 *                         type: integer
 *                         minimum: 1
 *                         example: 1
 *                   query:
 *                     type: object
 *                     properties:
 *                       filters:
 *                         type: object
 *                         additionalProperties: true
 *                         example:
 *                           category: "technology"
 *                           status: "active"
 *                           price_gt: 100
 *                       sort:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             field:
 *                               type: string
 *                             direction:
 *                               type: string
 *                               enum: [asc, desc]
 *                         example:
 *                           - field: "createdAt"
 *                             direction: "desc"
 *                           - field: "title"
 *                             direction: "asc"
 *                   batchSize:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 1000
 *                     default: 100
 *                     description: Number of items per batch (for iterator/batch formats)
 *                   headers:
 *                     type: object
 *                     additionalProperties:
 *                       type: string
 *                     example:
 *                       "X-Custom-Header": "custom-value"
 *                       "Accept-Language": "en-US"
 *                   cookies:
 *                     type: object
 *                     additionalProperties:
 *                       type: string
 *                     example:
 *                       sessionId: "abc123"
 *                       preferences: "theme=dark"
 *                   authOverride:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         enum: [cookie, bearer, basic, custom]
 *                       token:
 *                         type: string
 *                         description: Bearer token
 *                       username:
 *                         type: string
 *                         description: Basic auth username
 *                       password:
 *                         type: string
 *                         description: Basic auth password
 *                       headerValue:
 *                         type: string
 *                         description: Custom auth header value
 *                       cookies:
 *                         type: object
 *                         additionalProperties:
 *                           type: string
 *                   responseOptions:
 *                     type: object
 *                     properties:
 *                       fullResponse:
 *                         type: boolean
 *                         default: false
 *                         description: Return full HTTP response including headers and status
 *                       throwHttpErrors:
 *                         type: boolean
 *                         default: true
 *                         description: Whether to throw on HTTP errors
 *                   retryOptions:
 *                     type: object
 *                     properties:
 *                       maxRetries:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 10
 *                         default: 2
 *                       baseDelay:
 *                         type: integer
 *                         minimum: 100
 *                         default: 300
 *                         description: Base delay between retries in milliseconds
 *                       exponential:
 *                         type: boolean
 *                         default: false
 *                         description: Use exponential backoff
 *                   endpoint:
 *                     type: string
 *                     description: Override the default endpoint
 *                     example: "/api/v2/posts"
 *                   method:
 *                     type: string
 *                     enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
 *                     default: GET
 *                   body:
 *                     type: object
 *                     description: Request body for POST/PUT/PATCH requests
 *           examples:
 *             basicFetch:
 *               summary: Basic data fetch
 *               description: Simple fetch using default method
 *               value:
 *                 methodName: "default"
 *                 options:
 *                   method: "GET"
 *             paginatedFetch:
 *               summary: Paginated data with filtering and sorting
 *               description: Fetch paginated data with filters and sorting applied
 *               value:
 *                 methodName: "getAll"
 *                 options:
 *                   responseFormat: "full"
 *                   pagination:
 *                     enabled: true
 *                     pageSize: 20
 *                     startPage: 1
 *                   query:
 *                     filters:
 *                       category: "technology"
 *                       status: "published"
 *                       price_gte: 50
 *                     sort:
 *                       - field: "createdAt"
 *                         direction: "desc"
 *                       - field: "title"
 *                         direction: "asc"
 *             batchProcessing:
 *               summary: Batch processing for large datasets
 *               description: Process large datasets in batches
 *               value:
 *                 methodName: "getAll"
 *                 options:
 *                   responseFormat: "batch"
 *                   batchSize: 50
 *                   query:
 *                     filters:
 *                       dateRange: "2023-01-01,2023-12-31"
 *             streamingData:
 *               summary: Streaming large datasets
 *               description: Stream large datasets for memory-efficient processing
 *               value:
 *                 methodName: "getAll"
 *                 options:
 *                   responseFormat: "stream"
 *                   endpoint: "/large-dataset"
 *             customAuthentication:
 *               summary: Custom authentication override
 *               description: Override datasource authentication for specific requests
 *               value:
 *                 methodName: "getAll"
 *                 options:
 *                   authOverride:
 *                     type: "bearer"
 *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                   headers:
 *                     "X-API-Version": "2.0"
 *                     "Accept": "application/json"
 *             postWithRetry:
 *               summary: POST request with retry logic
 *               description: Create data with custom retry configuration
 *               value:
 *                 methodName: "create"
 *                 options:
 *                   method: "POST"
 *                   body:
 *                     title: "New Post"
 *                     content: "This is a new post content"
 *                     category: "technology"
 *                   retryOptions:
 *                     maxRetries: 3
 *                     baseDelay: 500
 *                     exponential: true
 *                   responseOptions:
 *                     fullResponse: true
 *             advancedFiltering:
 *               summary: Advanced filtering and querying
 *               description: Complex filtering with multiple conditions
 *               value:
 *                 methodName: "search"
 *                 options:
 *                   query:
 *                     filters:
 *                       status: ["published", "draft"]
 *                       author:
 *                         name: "John Doe"
 *                         verified: true
 *                       tags_contains: "javascript"
 *                       price_between: [10, 100]
 *                       created_after: "2023-01-01T00:00:00Z"
 *                     sort:
 *                       - field: "relevance"
 *                         direction: "desc"
 *                       - field: "publishedAt"
 *                         direction: "desc"
 *                   pagination:
 *                     enabled: true
 *                     pageSize: 25
 *                     startPage: 1
 *             cookieAuthentication:
 *               summary: Cookie-based authentication
 *               description: Use cookie authentication for legacy systems
 *               value:
 *                 methodName: "default"
 *                 options:
 *                   authOverride:
 *                     type: "cookie"
 *                     cookies:
 *                       JSESSIONID: "ABC123DEF456"
 *                       auth_token: "user_token_here"
 *                   cookies:
 *                     preferences: "lang=en&theme=dark"
 *             propertyMappingExample:
 *               summary: Property mapping transformation
 *               description: Transform property names in the response using property mapping
 *               value:
 *                 methodName: "getAll"
 *                 propertyMapping:
 *                   "title": "name"
 *                   "created_at": "createdTimestamp"
 *                   "updated_at": "modifiedTimestamp"
 *                   "user_id": "userId"
 *                   "is_active": "isActive"
 *                 options:
 *                   method: "GET"
 *                   query:
 *                     filters:
 *                       status: "active"
 *     responses:
 *       200:
 *         description: Data fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Data fetched successfully"
 *                 datasourceId:
 *                   type: string
 *                   format: uuid
 *                 datasourceName:
 *                   type: string
 *                 methodUsed:
 *                   type: string
 *                 result:
 *                   oneOf:
 *                     - type: object
 *                       description: Full response format
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             type: object
 *                         metadata:
 *                           type: object
 *                           properties:
 *                             timestamp:
 *                               type: number
 *                             source:
 *                               type: string
 *                             totalItems:
 *                               type: integer
 *                             currentPage:
 *                               type: integer
 *                             hasNextPage:
 *                               type: boolean
 *                     - type: object
 *                       description: Stream response format
 *                       properties:
 *                         stream:
 *                           type: object
 *                           description: Readable stream
 *                         metadata:
 *                           type: object
 *                     - type: object
 *                       description: Full HTTP response (when fullResponse=true)
 *                       properties:
 *                         status:
 *                           type: integer
 *                         statusText:
 *                           type: string
 *                         data:
 *                           type: object
 *                         ok:
 *                           type: boolean
 *                 callInfo:
 *                   type: object
 *                   description: Detailed information about the call execution
 *                   properties:
 *                     executionId:
 *                       type: string
 *                       example: "exec_123_1634567890123_xyz789"
 *                       description: Unique identifier for this execution
 *                     executionDuration:
 *                       type: string
 *                       example: "245ms"
 *                       description: Total time taken to execute the call
 *                     callStartTime:
 *                       type: string
 *                       format: date-time
 *                       description: ISO timestamp when the call started
 *                     callEndTime:
 *                       type: string
 *                       format: date-time
 *                       description: ISO timestamp when the call ended
 *                     httpCallDetails:
 *                       type: object
 *                       description: Details of the underlying HTTP call made
 *                       properties:
 *                         httpMethod:
 *                           type: string
 *                           example: "GET"
 *                           description: HTTP method used (GET, POST, PUT, etc.)
 *                         fullUrl:
 *                           type: string
 *                           example: "https://api.example.com/data"
 *                           description: Complete URL that was called
 *                         baseUrl:
 *                           type: string
 *                           example: "https://api.example.com"
 *                         endpoint:
 *                           type: string
 *                           example: "/data"
 *                         resourceType:
 *                           type: string
 *                           example: "posts"
 *                           description: Resource type for specific API implementations
 *                         timeout:
 *                           oneOf:
 *                             - type: string
 *                               example: "default"
 *                             - type: integer
 *                               example: 10000
 *                     requestId:
 *                       type: string
 *                       example: "req_abc123def456"
 *                       description: Request ID for tracing purposes
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     datasourceType:
 *                       type: string
 *                     environment:
 *                       type: string
 *                     instanceId:
 *                       type: string
 *                       description: Instance identifier used for this call
 *                     version:
 *                       type: integer
 *                       description: Datasource configuration version
 *                     resultMetrics:
 *                       type: object
 *                       description: Metrics about the returned data
 *                       properties:
 *                         responseSize:
 *                           type: integer
 *                           description: Size of the response in bytes
 *                         isArray:
 *                           type: boolean
 *                           description: Whether the result is an array
 *                         itemCount:
 *                           type: integer
 *                           nullable: true
 *                           description: Number of items if result is an array
 *             examples:
 *               fullResponse:
 *                 summary: Full response with pagination
 *                 value:
 *                   message: "Data fetched successfully"
 *                   datasourceId: "123e4567-e89b-12d3-a456-426614174000"
 *                   datasourceName: "External API"
 *                   methodUsed: "getAll"
 *                   result:
 *                     data:
 *                       - id: 1
 *                         title: "Post Title"
 *                         body: "Post content..."
 *                         userId: 1
 *                       - id: 2
 *                         title: "Another Post"
 *                         body: "More content..."
 *                         userId: 2
 *                     metadata:
 *                       timestamp: 1634567890123
 *                       source: "rest-api"
 *                       totalItems: 100
 *                       currentPage: 1
 *                       hasNextPage: true
 *                   metadata:
 *                     timestamp: "2023-10-18T10:30:00.000Z"
 *                     datasourceType: "rest-api"
 *                     environment: "production"
 *                   callInfo:
 *                     executionId: "exec_123_1634567890123_abc789"
 *                     executionDuration: "245ms"
 *                     callStartTime: "2023-10-18T10:29:59.755Z"
 *                     callEndTime: "2023-10-18T10:30:00.000Z"
 *                     httpCallDetails:
 *                       httpMethod: "GET"
 *                       fullUrl: "https://api.example.com/data"
 *                       baseUrl: "https://api.example.com"
 *                       endpoint: "/data"
 *                       resourceType: "posts"
 *                       timeout: "default"
 *                     requestId: "req_abc123def456"
 *               batchResponse:
 *                 summary: Batch response format
 *                 value:
 *                   message: "Data fetched successfully"
 *                   datasourceId: "123e4567-e89b-12d3-a456-426614174000"
 *                   methodUsed: "getAll"
 *                   result:
 *                     data:
 *                       - id: 1
 *                         title: "Batch Item 1"
 *                       - id: 2
 *                         title: "Batch Item 2"
 *                     metadata:
 *                       currentPage: 1
 *                       totalPages: 5
 *                       hasNextPage: true
 *                       totalItems: 250
 *                       batchIndex: 0
 *                       batchSize: 50
 *                   callInfo:
 *                     executionId: "exec_456_1634567950456_def123"
 *                     executionDuration: "180ms"
 *                     callStartTime: "2023-10-18T10:32:30.270Z"
 *                     callEndTime: "2023-10-18T10:32:30.450Z"
 *                     httpCallDetails:
 *                       httpMethod: "GET"
 *                       fullUrl: "https://api.example.com/data?page=1&limit=50"
 *                       baseUrl: "https://api.example.com"
 *                       endpoint: "/data"
 *                       timeout: 10000
 *                     requestId: "req_def456ghi789"
 *                   metadata:
 *                     timestamp: "2023-10-18T10:32:30.450Z"
 *                     datasourceType: "rest-api"
 *                     environment: "production"
 *                     instanceId: "fetch_456_1634567950456"
 *                     version: 2
 *                     resultMetrics:
 *                       responseSize: 2048
 *                       isArray: true
 *                       itemCount: 50
 *               propertyMappingResponse:
 *                 summary: Response with property mapping applied
 *                 description: Shows how property names are transformed when property mapping is used
 *                 value:
 *                   message: "Data fetched successfully"
 *                   datasourceId: "123e4567-e89b-12d3-a456-426614174000"
 *                   datasourceName: "User API"
 *                   methodUsed: "getUsers"
 *                   result:
 *                     - id: 1
 *                       name: "User Profile Name"
 *                       createdTimestamp: "2023-01-15T10:30:00Z"
 *                       modifiedTimestamp: "2023-10-15T14:20:00Z"
 *                       userId: 42
 *                       isActive: true
 *                     - id: 2
 *                       name: "Another User"
 *                       createdTimestamp: "2023-02-20T09:15:00Z"
 *                       modifiedTimestamp: "2023-10-16T11:45:00Z"
 *                       userId: 43
 *                       isActive: false
 *                   callInfo:
 *                     executionId: "exec_123_1634567890123_xyz789"
 *                     executionDuration: "182ms"
 *                     callStartTime: "2023-10-18T10:29:59.818Z"
 *                     callEndTime: "2023-10-18T10:30:00.000Z"
 *                     httpCallDetails:
 *                       httpMethod: "GET"
 *                       fullUrl: "https://api.example.com/users"
 *                       baseUrl: "https://api.example.com"
 *                       endpoint: "/users"
 *                       timeout: "default"
 *                     requestId: "req_mapping_example"
 *                     traceId: "trace_1634567890123_abc456"
 *                     spanId: "span_def789"
 *                     spanAttributes:
 *                       "http.method": "GET"
 *                       "http.url": "https://api.example.com/users"
 *                       "databinder.datasource": "rest-api"
 *                       "databinder.datasource.id": "123e4567-e89b-12d3-a456-426614174000"
 *                       "databinder.method": "getUsers"
 *                       "databinder.environment": "production"
 *                       "databinder.version": 1
 *                   metadata:
 *                     timestamp: "2023-10-18T10:30:00.000Z"
 *                     datasourceType: "rest-api"
 *                     environment: "production"
 *                     instanceId: "fetch_123_1634567890123"
 *                     version: 1
 *                     resultMetrics:
 *                       responseSize: 1456
 *                       isArray: true
 *                       itemCount: 2
 *                     propertyMapping:
 *                       applied: true
 *                       mappingRules:
 *                         "title": "name"
 *                         "created_at": "createdTimestamp"
 *                         "updated_at": "modifiedTimestamp"
 *                         "user_id": "userId"
 *                         "is_active": "isActive"
 *                       originalSize: 1523
 *                       transformedSize: 1456
 *                     dataExtraction:
 *                       wasExtracted: true
 *                       originalHadDataProperty: true
 *                       extractedSize: 1489
 *                     logMetadata:
 *                       datasourceId: "123e4567-e89b-12d3-a456-426614174000"
 *                       methodName: "getUsers"
 *                       userId: "user_456"
 *                       operationType: "fetch"
 *                       success: true
 *                     telemetryContext:
 *                       traceId: "trace_1634567890123_abc456"
 *                       spanId: "span_def789"
 *                       parentSpanId: null
 *                       operationName: "databinder.fetch.rest-api.getUsers"
 *                       correlationId: "exec_123_1634567890123_xyz789"
 *       400:
 *         description: Invalid method or request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Method 'invalidMethod' not available for this datasource"
 *                 availableMethods:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["default", "getAll", "getById", "create"]
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication failed: Invalid token"
 *       404:
 *         description: Datasource not found or unauthorized
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Rate limit exceeded. Please retry after 60 seconds"
 *                 retryAfter:
 *                   type: integer
 *                   example: 60
 *       500:
 *         description: Error fetching data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Error fetching from datasource"
 *                 error:
 *                   type: string
 *                 datasourceId:
 *                   type: string
 *                   format: uuid
 *                 callInfo:
 *                   type: object
 *                   description: Information about the failed call
 *                   properties:
 *                     failed:
 *                       type: boolean
 *                       example: true
 *                     errorTime:
 *                       type: string
 *                       format: date-time
 *                       description: ISO timestamp when the error occurred
 *                     errorContext:
 *                       type: object
 *                       properties:
 *                         datasourceId:
 *                           type: string
 *                         methodName:
 *                           type: string
 *                         error:
 *                           type: string
 *                         requestId:
 *                           type: string
 */

/**
 * @swagger
 * /databinder/definitions/available:
 *   get:
 *     summary: List available datasource definitions
 *     tags: [Databinder Datasources]
 *     responses:
 *       200:
 *         description: A list of available datasource definitions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "rest-api"
 *                   name:
 *                     type: string
 *                     example: "External REST API"
 *                   description:
 *                     type: string
 *                     example: "External REST API for data integration and testing"
 *                   configSchema:
 *                     type: object
 *                   availableMethods:
 *                     type: array
 *                     items:
 *                       type: string
 */
