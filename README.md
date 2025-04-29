
[![Coverage Status]([https://coveralls.io/repos/github/statuscompliance/status-backend/badge.svg)](https://coveralls.io/github/statuscompliance/status-backend)](https://coveralls.io/repos/github/statuscompliance/status-backend/badge.svg\)]\(https://coveralls.io/github/statuscompliance/status-backend\) "https://coveralls.io/repos/github/statuscompliance/status-backend/badge.svg)](https://coveralls.io/github/statuscompliance/status-backend)")

[![Duplicated Lines (%)]([https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)](https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=duplicated_lines_density\)]\(https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend\) "https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)")

[![Maintainability Rating]([https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)](https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_rating\)]\(https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend\) "https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)")

[![Technical Debt]([https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)](https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_index\)]\(https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend\) "https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)")
## Quick Introduction

This repository is the **backend** of  [Status Compliance Proyect](https://github.com/statuscompliance). Its primary function is to provide the business logic, data management, and APIs necessary for the system's various functionalities, such as compliance automation, controls catalog management, and design-time & run-time compliance checking, providing a straight-foward automation experience.

This backend integrates with other parts of the system, including web interfaces and specific services like the registry (`bluejay-registry`) and Node-RED workflows.
## 📋Repository Overview

Here is a **deep overview** of the backend, so you can get a good idea of the concepts and features here, and how they are implemented.
### Controllers 

Here on `src/controllers` we have all the controllers used on the backend:

**Assistant Controller** `assistant.controller.js`
Defines controllers for managing assistants, implementing an artificial intelligence service or chatbot, using the OpenAI API.

**Catalog Controller** `catalog.controller.js`
Defines drivers for catalog management.

**Configuration Controller** `configuration.controller.js`
Defines controllers for managing application or module-specific configuration.

**Control Controller** `control.controller.js`
Defines controllers for managing controls. It includes functionality for managing controls in draft and finalized states, validating required properties, and managing dashboards associated with controls in Grafana.

**Grafana Controller** `grafana.controller.js`
Defines controllers to interact with the Grafana API.

**Index Controller** `index.js`
Defines a simple controller that simply sends a welcome message in response to requests.

**Point Controller** `point.controller.js`
Defines controllers for managing 'Points' using the 'Point' model.

**Scope Controller** `scope.controller.js`
Defines controllers for managing 'Scopes' (using Sequelize) and 'ScopeSets' (using Mongoose)

**Script Controller** `script.controller.js`
Defines controllers for managing scripts stored in Redis.

**Thread Controller** `thread.controller.js
Defines controllers for managing conversation threads using the OpenAI API and the database (Sequelize). It also manages user authentication using JWT.

**User Controller** `user.controller.js`
Defines controllers for user authentication and authorization.

___
### Middlewares

Here is a quick look about all the middlewares on `src/middleware` :

**Endpoint** `endpoint.js`
Manages the loading and verification of application configuration, including endpoint availability and limits (such as attendee limits).
**Validation** `validation.js`
Provides functions to validate parameters in requests, such as the existence of the 'id' and the UUID or Grafana UID format.

**VerifyAdmin** `verifyAdmin.js`
Checks if the user has is an admin using an access token.

**VerifyAuth** `verifyAuth.js`
Check the validity of the access token and, if it's expired, attempt to renew it with a refresh token. It also checks if the user's authority is valid.

___
### Sequelize DB Models.

Here is a quick look of all the **Sequelize models** on `src/models` used on this backend:

**Models** `models.js` 
Initializes the application's Sequelize models. It reads the model files, imports each model, instantiates it with Sequelize, and stores it in the exported `models` object. It then associates the models with each other and applies additional settings defined in `extra-setup.js`.

**Assitant** `assistant.model.js`
Represents a wizard with its external ID, name, instructions, tools, AI model, and status (active/inactive).

**Catalog** `catalog.model.js`
Represents a catalog with name, description, start and end dates, associated dashboard ID, agreement ID, and status (draft/finalized).

**Computation** `computation.model.js`
Represents a calculation with a unique ID, associated calculation group, boolean value, scope, evidence, and validity period.

**Configuration** `configuration.model.js`
Represents the application configuration with an endpoint, availability status, and an optional limit.

**Control** `control.model.js`
Represents a control with name, description, periodicity, start and end dates, associated mashup ID, parameters, and status (draft/completed).

**Message** `message.model.js`
It represents a message with its content.

**Panel** `panel.model.js`
Represents a panel (possibly from Grafana) with a unique UID, an ID, and the UID of the associated dashboard.

**Point** `point.model.js`
Represents a data point with information about a deal, collateral, value, outcome, timestamp, metric, scope, and associated calculation group.

**Scope** `scope.model.js`
Represents a scope with a unique ID, name (lowercase with underscores), description, type, and default value.

**Thread** `thread.model.js`
Represents a conversation thread with its ID on the GPT platform.

**User** `user.model.js`
Represents a user with their unique username, password hash, role (authority), unique email, and refresh token.

___
### ROUTES

Assistant Routes `assistant.routes.js`
Catalog Routes `catalog.routes.js`
Computation Routes `computation.routes.js`
Configuration Routes `configuration.routes.js`
Control Routes `control.routes.js`
Github access Routes `ghaccess.routes.js`
Grafana Routes `grafana.routes.js`
Index Routes `index.routes.js`
Point Routes `point.routes.js`
Scope Routes `scope.routes.js`
Script Routes `script.routes.js`
Thread Routes `thread.routes.js`
User Routes `user.routes.js`

____

### UTILS

 We have `src/utils` we 

**Agreement Builder** `agreementBuilder.js`
Build the structure of an "agreement" with context (validity, definitions) and terms (control metrics, guarantees with thresholds).

**Calculate Compliance** `calculateCompliance.js`
Calculates compliance based on a list of computations. It extracts common properties, generates a "pruned" scope, counts total and true evidence, and calculates a percentage compliance value for a group of computations.

**Check Required Properties** `checkRequiredProperties.js`
Checks if a given object contains all required properties specified in an array.

**Dates Utilities** `dates.js`
Generates a series of dates between a start and end date based on a specified period (yearly, monthly, weekly, daily, hourly). It also includes logic to handle custom rules that require additional parameters.

**Gauge Structure** `gaugeStructure.js`
Defines the structure of a gauge panel for Grafana.

**Noder Red Token** `nodeRedToken.js`
Tries to obtain a Node-RED access token by sending a POST request with user credentials. Returns the token if authentication is successful or throws an error if it fails.

**Panel Structures** `panelStructures.js`
Defines an object that maps panel types (currently just 'gauge') to their configuration structures. It creates and returns a deep copy of the requested panel structure, raising an error if the type is not supported.

**Scope Utilities** `scopeUtilities.js`
Retrieves scope specifications from a Sequelize database, searching by scope names. It also retrieves scope sets associated with control IDs from a Mongoose model and extracts the unique scope keys from these sets.

**SQL Query Builder** `sqlQueryBuilder.js`
It defines two functions:
- `createSQLQuery`, which dynamically generates SQL queries from a parameter object (select, aggregations, WHERE, GROUP BY, ORDER BY).
- `parseSQLQuery`, which parses a given SQL query to extract its components into a structured object.

**Store Guarantee Points** `storeGuaranteePoints.js`
Stores the results of an agreement's guarantees in the database. Iterates over the guarantee statuses, extracting relevant information (period, metrics, scope).

**Token Utilities** `tokenUtils.js`
Implements JWT access token verification and renewal.

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

Status Compliance - 2025
