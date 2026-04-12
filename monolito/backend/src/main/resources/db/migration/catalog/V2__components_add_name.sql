-- Alinea catalog.components con el modelo JPA (campo name).
ALTER TABLE components ADD COLUMN IF NOT EXISTS name VARCHAR(255);
