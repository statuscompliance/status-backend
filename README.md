<div align="center">
  <img src="https://avatars.githubusercontent.com/u/151918147?s=200&v=4" width = 256px>
  <h3>A Business Process Compliance Management System</h3>

[![Coverage Status](https://coveralls.io/repos/github/statuscompliance/status-backend/badge.svg)](https://coveralls.io/github/statuscompliance/status-backend)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend) 
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend) 
[![Technical Debt](https://sonarcloud.io/api/project_badges/measure?project=statuscompliance_status-backend&metric=sqale_index)](https://sonarcloud.io/summary/new_code?id=statuscompliance_status-backend)

</div>

## Quick Introduction

This repository is the **backend** of  [Status Compliance Proyect](https://github.com/statuscompliance). Its primary function is to provide the business logic, data management, and APIs necessary for the system's various functionalities, such as compliance automation, controls catalog management, and design-time & run-time compliance checking, providing a straight-foward automation experience.

This backend integrates with other parts of the system, including web interfaces and specific services like the registry (`bluejay-registry`) and Node-RED workflows.

<div align="center" >
  <img src="https://github.com/user-attachments/assets/9f63de02-6e30-4126-a0ea-36186b1b2537" width = 720px>
</div>

##  📚 Tech Stack
We've developed the **MERN** stack exclusively for this backend, which is built using the following technologies:

>
>**MERN STACK**
>
>- **MongoDB:** NoSQL document database for flexible data storage.
>- **Express:** Minimalist and flexible Node.js web application framework. 
>- **React**: Open Source Javascript library for flexible UI design.
>- **Node.js:** JavaScript runtime environment for server-side execution.
>

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

> 
> **Requirements**
> 
> - Be sure you have **[Node.js](https://nodejs.org/es)** installed (v.22.12.0).
> - Be sure to have **[Docker](https://www.docker.com/)** installed on your machine.
> - Be sure to install the main [Infrastructure](https://github.com/statuscompliance/infrastructure) of Status Compliance Proyect via Docker. 
> 

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
