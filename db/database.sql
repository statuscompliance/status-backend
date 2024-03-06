DROP DATABASE statusdb;
CREATE DATABASE statusdb;

USE statusdb;

CREATE TABLE catalog (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(255),
    PRIMARY KEY(id)
);

CREATE TABLE mashup (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    url VARCHAR(255),
    PRIMARY KEY(id)
);

CREATE TABLE control (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    period ENUM('DAILY', 'MONTHLY', 'ANNUALLY') NOT NULL,
    startDate DATE,
    endDate DATE,
    mashup_id INT(11) NOT NULL,
    catalog_id INT(11) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(mashup_id) REFERENCES mashup(id),
    FOREIGN KEY(catalog_id) REFERENCES catalog(id)
);

CREATE TABLE input (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(60) NOT NULL,
    type ENUM('STRING', 'NUMBER') NOT NULL,
    mashup_id INT(11) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(mashup_id) REFERENCES mashup(id)
);

CREATE TABLE input_control (
    id INT(11) NOT NULL AUTO_INCREMENT,
    input_id INT(11) NOT NULL,
    control_id INT(11) NOT NULL,
    value VARCHAR(255) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(input_id) REFERENCES input(id),
    FOREIGN KEY(control_id) REFERENCES control(id)
);