-- Crear tabla normalizada para las ubicaciones actuales de los equipos
CREATE TABLE IF NOT EXISTS equipos_ubicacion_actual (
  equipo_id VARCHAR(36) PRIMARY KEY REFERENCES equipos(id),
  latitud DECIMAL(10, 6) NOT NULL,
  longitud DECIMAL(10, 6) NOT NULL,
  velocidad DECIMAL(5, 2) NOT NULL DEFAULT 0,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_equipos_ubicacion_equipo_id ON equipos_ubicacion_actual(equipo_id);

-- Función para actualizar el timestamp cuando se actualiza un registro
CREATE OR REPLACE FUNCTION update_equipos_ubicacion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el timestamp automáticamente
DROP TRIGGER IF EXISTS equipos_ubicacion_update_timestamp ON equipos_ubicacion_actual;
CREATE TRIGGER equipos_ubicacion_update_timestamp
BEFORE UPDATE ON equipos_ubicacion_actual
FOR EACH ROW
EXECUTE FUNCTION update_equipos_ubicacion_timestamp();

-- Poblar la tabla con las ubicaciones más recientes de cada equipo
INSERT INTO equipos_ubicacion_actual (equipo_id, latitud, longitud, velocidad, timestamp)
SELECT g.equipo_id, g.latitud, g.longitud, g.velocidad, g.timestamp
FROM gps_registros g
INNER JOIN (
    SELECT equipo_id, MAX(timestamp) AS last_timestamp
    FROM gps_registros
    GROUP BY equipo_id
) AS latest ON g.equipo_id = latest.equipo_id AND g.timestamp = latest.last_timestamp
ON CONFLICT (equipo_id) 
DO UPDATE SET 
    latitud = EXCLUDED.latitud, 
    longitud = EXCLUDED.longitud, 
    velocidad = EXCLUDED.velocidad, 
    timestamp = EXCLUDED.timestamp; 