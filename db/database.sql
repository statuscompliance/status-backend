DROP DATABASE statusdb;
CREATE DATABASE statusdb;

USE statusdb;

CREATE TABLE catalog (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    startDate DATE,
    endDate DATE,
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

CREATE TABLE thread (
    id INT(11) NOT NULL AUTO_INCREMENT,
    gpt_id VARCHAR(50) NOT NULL,
    user_id INT(11) NOT NULL,
    name VARCHAR(100) NOT NULL,
    run_id VARCHAR(50) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(user_id) REFERENCES User(id)
);

CREATE TABLE message (
    id INT(11) NOT NULL AUTO_INCREMENT,
    content TEXT NOT NULL,
    thread_id INT(11) NOT NULL,
    PRIMARY KEY(id),
    FOREIGN KEY(thread_id) REFERENCES thread(id)
);

CREATE TABLE assistant (
    id INT(11) NOT NULL AUTO_INCREMENT,
    assistantId VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    instructions TEXT NOT NULL,
    tools TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'INACTIVE'),
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

INSERT INTO catalog (name, startDate, endDate) VALUES ('Catalogo 1', '2015-01-01', '2020-12-31');
INSERT INTO catalog (name, startDate, endDate) VALUES ('Catalogo 2', null, null);

INSERT INTO mashup (name, description, url) VALUES ('posts', 'Descripción del Mashup 1', 'src/pages/catalog/mashup-example.json');
INSERT INTO mashup (name, description, url) VALUES ('albums', 'Descripción del Mashup 2', 'src/pages/catalog/mashup-example-2.json');
INSERT INTO mashup (name, description, url) VALUES ('existsPipe', 'Descripción del Mashup 3', 'src/pages/catalog/mashup-example-3.json');
INSERT INTO mashup (name, description, url) VALUES ('existsDocument', 'Verifies the existence of a given document', 'src/pages/catalog/mashup-example-4.json');

INSERT INTO control (name, description, period, startDate, endDate, mashup_id, catalog_id) VALUES ('Exists document', 'Descripción del Control 1', 'DAILY', '2023-01-01', '2023-01-31', 1, 1);
INSERT INTO control (name, description, period, mashup_id, catalog_id) VALUES ('Exists section in document', 'Descripción del Control 2', 'MONTHLY', 2, 1);

INSERT INTO input (name, type, mashup_id) VALUES ('Nombre del documento', 'STRING', 1);
INSERT INTO input (name, type, mashup_id) VALUES ('URL', 'STRING', 1);
INSERT INTO input (name, type, mashup_id) VALUES ('Nombre del documento', 'STRING', 2);
INSERT INTO input (name, type, mashup_id) VALUES ('Nombre de la sección', 'STRING', 2);
INSERT INTO input (name, type, mashup_id) VALUES ('URL', 'STRING', 2);
INSERT INTO input (name, type, mashup_id) VALUES ('Count', 'NUMBER', 3);
INSERT INTO input (name, type, mashup_id) VALUES ('Document', 'STRING', 4);

INSERT INTO input_control (input_id, control_id, value) VALUES (1, 1, 'Análisis funcional');
INSERT INTO input_control (input_id, control_id, value) VALUES (2, 1, 'http://github.com/prueba');
INSERT INTO input_control (input_id, control_id, value) VALUES (3, 2, 'Análisis funcional');
INSERT INTO input_control (input_id, control_id, value) VALUES (4, 2, 'Lecciones aprendidas');
INSERT INTO input_control (input_id, control_id, value) VALUES (5, 2, 'http://github.com/prueba');
