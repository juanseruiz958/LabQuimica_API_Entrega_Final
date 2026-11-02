CREATE DATABASE IF NOT EXISTS lab_quimica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lab_quimica;

CREATE TABLE IF NOT EXISTS materiales (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL,
 categoria VARCHAR(50) NOT NULL,
 descripcion VARCHAR(255),
 cantidad_total INT NOT NULL,
 cantidad_disponible INT NOT NULL,
 estado ENUM('ACTIVO','INACTIVO') NOT NULL DEFAULT 'ACTIVO',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CHECK (cantidad_total >= 0),
 CHECK (cantidad_disponible >= 0 AND cantidad_disponible <= cantidad_total),
 INDEX idx_material_categoria(categoria),
 INDEX idx_material_estado(estado)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS prestamos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 material_id INT NOT NULL,
 responsable VARCHAR(120) NOT NULL,
 cantidad INT NOT NULL,
 fecha_prestamo DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 fecha_prevista_devolucion DATE NOT NULL,
 fecha_devolucion DATETIME NULL,
 observaciones VARCHAR(500),
 estado ENUM('ACTIVO','DEVUELTO') NOT NULL DEFAULT 'ACTIVO',
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CHECK (cantidad > 0),
 CONSTRAINT fk_prestamo_material FOREIGN KEY(material_id) REFERENCES materiales(id) ON UPDATE CASCADE ON DELETE RESTRICT,
 INDEX idx_prestamo_estado(estado),
 INDEX idx_prestamo_material(material_id)
) ENGINE=InnoDB;

INSERT INTO materiales(nombre,categoria,descripcion,cantidad_total,cantidad_disponible,estado)
SELECT 'Vaso de precipitados 250 ml','VIDRIERIA','Vaso de vidrio borosilicato de 250 ml.',15,15,'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre='Vaso de precipitados 250 ml');
INSERT INTO materiales(nombre,categoria,descripcion,cantidad_total,cantidad_disponible,estado)
SELECT 'Probeta 100 ml','VIDRIERIA','Probeta graduada para líquidos.',8,8,'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre='Probeta 100 ml');
INSERT INTO materiales(nombre,categoria,descripcion,cantidad_total,cantidad_disponible,estado)
SELECT 'Matraz Erlenmeyer 250 ml','VIDRIERIA','Matraz para preparar y mezclar soluciones.',10,10,'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre='Matraz Erlenmeyer 250 ml');
INSERT INTO materiales(nombre,categoria,descripcion,cantidad_total,cantidad_disponible,estado)
SELECT 'Pipeta graduada 10 ml','MEDICION','Pipeta para medir volúmenes.',15,15,'ACTIVO'
WHERE NOT EXISTS (SELECT 1 FROM materiales WHERE nombre='Pipeta graduada 10 ml');
