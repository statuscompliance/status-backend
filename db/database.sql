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

CREATE TABLE User (
    id INT(11) NOT NULL AUTO_INCREMENT,
    username VARCHAR(60) NOT NULL,
    password VARCHAR(255) NOT NULL,
    authority ENUM('ADMIN','DEVELOPER','USER') NOT NULL,
    email VARCHAR(100) NOT NULL,
    refresh_token VARCHAR(255),
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

INSERT INTO catalog (name, url) VALUES ('Catalogo 1', 'http://catalogo1.com');
INSERT INTO catalog (name, url) VALUES ('Catalogo 2', 'http://catalogo2.com');

INSERT INTO mashup (name, description, url) VALUES ('Mashup 1', 'Descripción del Mashup 1', 'http://mashup1.com');
INSERT INTO mashup (name, description, url) VALUES ('Mashup 2', 'Descripción del Mashup 2', 'http://mashup2.com');

INSERT INTO control (name, description, period, startDate, endDate, mashup_id, catalog_id) VALUES ('Control 1', 'Descripción del Control 1', 'DAILY', '2023-01-01', '2023-01-31', 1, 1);
INSERT INTO control (name, description, period, mashup_id, catalog_id) VALUES ('Control 2', 'Descripción del Control 2', 'MONTHLY', 2, 1);

INSERT INTO input (name, type, mashup_id) VALUES ('Input 1', 'STRING', 1);
INSERT INTO input (name, type, mashup_id) VALUES ('Input 2', 'NUMBER', 1);
INSERT INTO input (name, type, mashup_id) VALUES ('Input 3', 'STRING', 2);

INSERT INTO input_control (input_id, control_id, value) VALUES (1, 1, 'Valor para Input 1');
INSERT INTO input_control (input_id, control_id, value) VALUES (2, 1, '100');
INSERT INTO input_control (input_id, control_id, value) VALUES (3, 2, 'Valor para Input 3');

