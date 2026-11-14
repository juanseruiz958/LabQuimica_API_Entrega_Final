-- Migración única para bases creadas antes de asociar los préstamos a usuarios.
-- Los préstamos existentes quedan con usuario_id NULL porque no se puede atribuir
-- con certeza un registro histórico a una cuenta. Los laboratoristas conservan la vista.
ALTER TABLE prestamos
  ADD COLUMN usuario_id INT NULL AFTER material_id,
  ADD INDEX idx_prestamo_usuario (usuario_id),
  ADD CONSTRAINT fk_prestamo_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
