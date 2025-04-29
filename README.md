<div align="center">
  <img src="https://github.com/user-attachments/assets/426f7e01-c065-4251-a0a1-b3fa16a55615" width = 256px>
  <h3>A Business Process Compliance Management System</h3>
</div>

## Quick Introduction

This repository is the **backend** of  [Status Compliance Proyect](https://github.com/statuscompliance). Its primary function is to provide the business logic, data management, and APIs necessary for the system's various functionalities, such as compliance automation, controls catalog management, and design-time & run-time compliance checking, providing a straight-foward automation experience.

This backend integrates with other parts of the system, including web interfaces and specific services like the registry (`bluejay-registry`) and Node-RED workflows.

## 📋Repository Overview

Here is a **deep overview** of the backend, so you can get a good idea of the concepts and features here, and how they are implemented.

### Controllers
These are the modules responsible for handling incoming requests and orchestrating the application's logic. They interact with models and services to process data and return responses.

<details>
  <summary><em>View all the controllers details</em></summary>
  <ul>
    <li>
      <strong>Assistant Controller</strong> <code>assistant.controller.js</code>
      <p>Defines controllers for managing assistants, implementing an artificial intelligence service or chatbot, using the OpenAI API.</p>
    </li>
    <li>
      <strong>Catalog Controller</strong> <code>catalog.controller.js</code>
      <p>Defines drivers for catalog management.</p>
    </li>
    <li>
      <strong>Configuration Controller</strong> <code>configuration.controller.js</code>
      <p>Defines controllers for managing application or module-specific configuration.</p>
    </li>
    <li>
      <strong>Control Controller</strong> <code>control.controller.js</code>
      <p>Defines controllers for managing controls. It includes functionality for managing controls in draft and finalized states, validating required properties, and managing dashboards associated with controls in Grafana.</p>
    </li>
    <li>
      <strong>Grafana Controller</strong> <code>grafana.controller.js</code>
      <p>Defines controllers to interact with the Grafana API.</p>
    </li>
    <li>
      <strong>Index Controller</strong> <code>index.js</code>
      <p>Defines a simple controller that simply sends a welcome message in response to requests.</p>
    </li>
    <li>
      <strong>Point Controller</strong> <code>point.controller.js</code>
      <p>Defines controllers for managing 'Points' using the 'Point' model.</p>
    </li>
    <li>
      <strong>Scope Controller</strong> <code>scope.controller.js</code>
      <p>Defines controllers for managing 'Scopes' (using Sequelize) and 'ScopeSets' (using Mongoose)</p>
    </li>
    <li>
      <strong>Script Controller</strong> <code>script.controller.js</code>
      <p>Defines controllers for managing scripts stored in Redis.</p>
    </li>
    <li>
      <strong>Thread Controller</strong> <code>thread.controller.js</code>
      <p>Defines controllers for managing conversation threads using the OpenAI API and the database (Sequelize). It also manages user authentication using JWT.</p>
    </li>
    <li>
      <strong>User Controller</strong> <code>user.controller.js</code>
      <p>Defines controllers for user authentication and authorization.</p>
    </li>
  </ul>
</details>

### Middlewares
These are functions that execute during the lifecycle of a request/response cycle. They can perform various tasks like authentication, validation, and logging.

<details>
  <summary><em>View all the middleware details</em></summary>
  <ul>
    <li>
      <strong>Endpoint</strong> <code>endpoint.js</code>
      <p>Manages the loading and verification of application configuration, including endpoint availability and limits (such as attendee limits).</p>
    </li>
    <li>
      <strong>Validation</strong> <code>validation.js</code>
      <p>Provides functions to validate parameters in requests, such as the existence of the 'id' and the UUID or Grafana UID format.</p>
    </li>
    <li>
      <strong>VerifyAdmin</strong> <code>verifyAdmin.js</code>
      <p>Checks if the user has is an admin using an access token.</p>
    </li>
    <li>
      <strong>VerifyAuth</strong> <code>verifyAuth.js</code>
      <p>Checks the validity of the access token and, if it's expired, attempt to renew it with a refresh token. It also checks if the user's authority is valid.</p>
    </li>
  </ul>
</details>

### Sequelize DB Models.
These are the definitions of the data structures used by Sequelize to interact with the relational database. They represent tables and their relationships.

<details>
  <summary><em>View all the models details</em></summary>
  <ul>
    <li>
      <strong>Models</strong> <code>models.js</code>
      <p>Initializes the application's Sequelize models. It reads the model files, imports each model, instantiates it with Sequelize, and stores it in the exported <code>models</code> object. It then associates the models with each other and applies additional settings defined in <code>extra-setup.js</code>.</p>
    </li>
    <li>
      <strong>Assitant</strong> <code>assistant.model.js</code>
      <p>Represents a wizard with its external ID, name, instructions, tools, AI model, and status (active/inactive).</p>
    </li>
    <li>
      <strong>Catalog</strong> <code>catalog.model.js</code>
      <p>Represents a catalog with name, description, start and end dates, associated dashboard ID, agreement ID, and status (draft/finalized).</p>
    </li>
    <li>
      <strong>Computation</strong> <code>computation.model.js</code>
      <p>Represents a calculation with a unique ID, associated calculation group, boolean value, scope, evidence, and validity period.</p>
    </li>
    <li>
      <strong>Configuration</strong> <code>configuration.model.js</code>
      <p>Represents the application configuration with an endpoint, availability status, and an optional limit.</p>
    </li>
    <li>
      <strong>Control</strong> <code>control.model.js</code>
      <p>Represents a control with name, description, periodicity, start and end dates, associated mashup ID, parameters, and status (draft/completed).</p>
    </li>
    <li>
      <strong>Message</strong> <code>message.model.js</code>
      <p>It represents a message with its content.</p>
    </li>
    <li>
      <strong>Panel</strong> <code>panel.model.js</code>
      <p>Represents a panel (possibly from Grafana) with a unique UID, an ID, and the UID of the associated dashboard.</p>
    </li>
    <li>
      <strong>Point</strong> <code>point.model.js</code>
      <p>Represents a data point with information about a deal, collateral, value, outcome, timestamp, metric, scope, and associated calculation group.</p>
    </li>
    <li>
      <strong>Scope</strong> <code>scope.model.js</code>
      <p>Represents a scope with a unique ID, name (lowercase with underscores), description, type, and default value.</p>
    </li>
    <li>
      <strong>Thread</strong> <code>thread.model.js</code>
      <p>Represents a conversation thread with its ID on the GPT platform.</p>
    </li>
    <li>
      <strong>User</strong> <code>user.model.js</code>
      <p>Represents a user with their unique username, password hash, role (authority), unique email, and refresh token.</p>
    </li>
  </ul>
</details>

### Routes
These are the definitions of the API endpoints, specifying the URL paths and the corresponding controller functions that handle requests to those paths.

<details>
  <summary><em>View all the express.js routes details</em></summary>
  <ul>
    <li>
      <strong>Assistant Routes</strong> <code>assistant.routes.js</code>
      <p>Defines routes for managing "attendants" using the Express.js framework.</p>
    </li>
    <li>
      <strong>Catalog Routes</strong> <code>catalog.routes.js</code>
      <p>Defines routes for managing "catalogs" using the Express.js framework.</p>
    </li>
    <li>
      <strong>Computation Routes</strong> <code>computation.routes.js</code>
      <p>Defines routes for managing "computations" using the Express.js framework.</p>
    </li>
    <li>
      <strong>Configuration Routes</strong> <code>configuration.routes.js</code>
      <p>Defines routes for managing application settings, including general settings and attendee limits, using the Express.js framework.</p>
    </li>
    <li>
      <strong>Control Routes</strong> <code>control.routes.js</code>
      <p>Defines routes for managing controls and their associated computations using the Express.js framework. It includes functionality for managing panels within controls and the concept of controls in a draft state. A validation middleware, <code>validation.js</code>, is used to ensure that ID parameters in routes are valid.</p>
    </li>
    <li>
      <strong>Github access Routes</strong> <code>ghaccess.routes.js</code>
      <p>Defines an Express.js router with two routes related to authentication and HTTP header handling. It uses the <code>axios</code> library to make HTTP requests and also includes Swagger documentation to describe the endpoints.</p>
    </li>
    <li>
      <strong>Grafana Routes</strong> <code>grafana.routes.js</code>
      <p>Defines an Express.js router to interact with the Grafana API, using functions from a <code>grafana.controller.js</code> controller and <code>validation.js</code> validation middleware.</p>
    </li>
    <li>
      <strong>Index Routes</strong> <code>index.routes.js</code>
      <p>Defines an Express.js router with a single root route that is associated with the <code>welcome</code> function in <code>index.controller.js</code>.</p>
    </li>
    <li>
      <strong>Point Routes</strong> <code>point.routes.js</code>
      <p>Defines an Express.js router to manage Points resources, using <code>point.controller.js</code>.</p>
    </li>
    <li>
      <strong>Scope Routes</strong> <code>scope.routes.js</code>
      <p>Defines a router in Express.js for managing "Scopes" and "Scope Sets", using <code>scope.controller.js</code> and <code>validation.js</code>.</p>
    </li>
    <li>
      <strong>Script Routes</strong> <code>script.routes.js</code>
      <p>Defines an Express.js router for managing "Scripts", using <code>script.controller.js</code> and <code>verifyAuth.js</code>.</p>
    </li>
    <li>
      <strong>Thread Routes</strong> <code>thread.routes.js</code>
      <p>Defines an Express.js router for managing "Threads", likely related to an OpenAI integration, as indicated by the description. Using <code>thread.controller.js</code> and <code>verifyAuth.js</code>.</p>
    </li>
    <li>
      <strong>User Routes</strong> <code>user.routes.js</code>
      <p>Defines an Express.js router for user authentication and management. Using <code>user.controller.js</code>) and <code>verifyAuth.js</code>.</p>
    </li>
  </ul>
</details>

### Utilities
These are helper functions and modules that provide reusable logic and functionalities used across different parts of the backend.

<details>
  <summary><em>View all the utilities details</em></summary>
  <ul>
    <li>
      <strong>Agreement Builder</strong> <code>agreementBuilder.js</code>
      <p>Build the structure of an "agreement" with context (validity, definitions) and terms (control metrics, guarantees with thresholds).</p>
    </li>
    <li>
      <strong>Calculate Compliance</strong> <code>calculateCompliance.js</code>
      <p>Calculates compliance based on a list of computations. It extracts common properties, generates a "pruned" scope, counts total and true evidence, and calculates a percentage compliance value for a group of computations.</p>
    </li>
    <li>
      <strong>Check Required Properties</strong> <code>checkRequiredProperties.js</code>
      <p>Checks if a given object contains all required properties specified in an array.</p>
    </li>
    <li>
      <strong>Dates Utilities</strong> <code>dates.js</code>
      <p>Generates a series of dates between a start and end date based on a specified period (yearly, monthly, weekly, daily, hourly). It also includes logic to handle custom rules that require additional parameters.</p>
    </li>
    <li>
      <strong>Gauge Structure</strong> <code>gaugeStructure.js</code>
      <p>Defines the structure of a gauge panel for Grafana.</p>
    </li>
    <li>
      <strong>Noder Red Token</strong> <code>nodeRedToken.js</code>
      <p>Tries to obtain a Node-RED access token by sending a POST request with user credentials. Returns the token if authentication is successful or throws an error if it fails.</p>
    </li>
    <li>
      <strong>Panel Structures</strong> <code>panelStructures.js</code>
      <p>Defines an object that maps panel types (currently just 'gauge') to their configuration structures. It creates and returns a deep copy of the requested panel structure, raising an error if the type is not supported.</p>
    </li>
    <li>
      <strong>Scope Utilities</strong> <code>scopeUtilities.js</code>
      <p>Retrieves scope specifications from a Sequelize database, searching by scope names. It also retrieves scope sets associated with control IDs from a Mongoose model and extracts the unique scope keys from these sets.</p>
    </li>
    <li>
      <strong>SQL Query Builder</strong> <code>sqlQueryBuilder.js</code>
      <ul>
        <li><code>createSQLQuery</code>: Dynamically generates SQL queries from a parameter object.</li>
        <li><code>parseSQLQuery</code>: Parses back a given SQL query to extract its components into a structured object.</li>
      </ul>
    </li>
    <li>
      <strong>Store Guarantee Points</strong> <code>storeGuaranteePoints.js</code>
      <p>Stores the results of an agreement's guarantees in the database. Iterates over the guarantee statuses, extracting relevant information (period, metrics, scope).</p>
    </li>
    <li>
      <strong>Token Utilities</strong> <code>tokenUtils.js</code>
      <p>Implements JWT access token verification and renewal.</p>
    </li>
  </ul>
</details>

___

You can find on `tests/`,  the proper tests for all the source code on `src/`, by implementing **ViTest** we can ensure the proper functioning of the source code.

*Important Note:  This proyect is right now under development, we are currently developing on `branch/develop`.*
##  📚 Tech Stack

We've developed the **MERN** stack exclusively for this backend, which is built using the following technologies:


> [!NOTE] MERN STACK
> * **MongoDB:** NoSQL document database for flexible data storage.
> * **Express:** Minimalist and flexible Node.js web application framework. 
> * **React**: Open Source Javascript library for flexible UI design.
> * **Node.js:** JavaScript runtime environment for server-side execution.

By follwoing this tech-stack, wea can easily implement the following features:

* **API Management:** Provides RESTful APIs for interaction with the user interface and other services.
* **Business Logic:** Implements the rules and logic for compliance verification and management.
* **Database Integration:** Facilitates reading and writing data to MySQL and MongoDB.
* **Redis Communication:** Utilizes Redis for caching and real-time data management.
* **Registry Integration:** Enables the management and access of compliance catalog computations. Using `bluejay-registry`.
* **Node-RED Integration Support:** Offers the necessary endpoints for interaction with compliance workflows defined in Node-RED.
* **Potential Blockchain Integration:** Lays the groundwork for immutable verification of compliance checks.
## 🔧Installation

Let's setup your enviroment, so you can easily install this repository locally on your machine:

> [!NOTE] **Requirements**
> * Be sure you have **[Node.js](https://nodejs.org/es)** installed (v.22.12.0).
> * Be sure to have **[Docker](https://www.docker.com/)** installed on your machine.
> * Be sure to install the main [Infrastructure](https://github.com/statuscompliance/infrastructure) of Status Compliance Proyect via Docker. 

**Clone the Repository:**
```bash
git clone https://github.com/statuscompliance/status-backend.git
```

**Install Node.js dependencies:**
```bash
 npm install
 ```

*Note: Highly recommended to have installed [NVM (Node Version Manager)](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/)*

## 🏃‍♂️Running the Backend

*Important Annotation: Be sure you first run `npm ci` or `npm install` so you have correctly installed all the node modules used on the backend.*

After finishing installing the backend and the infrastructure, you can finally run the backend:

```bash
npm run dev
```

*Important Annotation: Be sure you **stop** the **status-backend container** on your docker-compose infrastructure. 
Be sure to also configure your ``.env`` file with all the other containers ports, and other configuration, so you have succesfully connected the backend with the infrastructure*

## 🧪 Testing the backend

*Important Annotation: Be sure you first run `npm ci` or `npm install` so you have correctly installed all the node modules used on the backend.*

After you succesfully installed the backend and the infrastructure, we'll give you a quick guide about how to run some tests:

1. Open your backend folder on VS Code, and install the official **Vitest extension.**
2. Pop up a terminal and let's start testing.
### Running the tests

Developer [alvarobernal2412](https://github.com/alvarobernal2412) have implemented the [Vitest](https://vitest.dev/) framework for testing the backend,

**Running all the tests**
```bash
npm run test
```

**Running only a test file**
``` bash
npm test 'filepath'
```

___
### Running coverage

We've also added [istanbul](https://istanbul.js.org/) to integrate code coverage.
 
**Running coverage on all files.**
```bash
npm run coverage
```

**Running coverage on one single file.**
```bash
npm run coverage 'filepath'
```

___
