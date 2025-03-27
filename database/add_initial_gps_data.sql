-- Verificar que la tabla gps_registros tenga todos los campos necesarios
ALTER TABLE gps_registros 
ADD COLUMN IF NOT EXISTS velocidad DECIMAL(5, 2) DEFAULT 0.0 NOT NULL,
ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT NOW() NOT NULL;

-- Crear registros GPS iniciales para los equipos (si no existen ya)
DO $$
DECLARE
    registro_count INTEGER;
BEGIN
    -- Verificar si ya existen registros para equipo-001
    SELECT COUNT(*) INTO registro_count FROM gps_registros WHERE equipo_id = 'equipo-001';
    IF registro_count = 0 THEN
        INSERT INTO gps_registros (id, equipo_id, latitud, longitud, velocidad, timestamp)
        VALUES 
          ('gps-001', 'equipo-001', 4.65, -74.05, 35.5, NOW() - INTERVAL '1 hour'),
          ('gps-002', 'equipo-001', 4.66, -74.06, 40.2, NOW() - INTERVAL '45 minutes'),
          ('gps-003', 'equipo-001', 4.67, -74.07, 25.8, NOW() - INTERVAL '30 minutes'),
          ('gps-004', 'equipo-001', 4.68, -74.08, 15.3, NOW() - INTERVAL '15 minutes'),
          ('gps-005', 'equipo-001', 4.69, -74.09, 0.0, NOW());
    END IF;

    -- Verificar si ya existen registros para equipo-002
    SELECT COUNT(*) INTO registro_count FROM gps_registros WHERE equipo_id = 'equipo-002';
    IF registro_count = 0 THEN
        INSERT INTO gps_registros (id, equipo_id, latitud, longitud, velocidad, timestamp)
        VALUES 
          ('gps-006', 'equipo-002', 4.61, -74.08, 42.1, NOW() - INTERVAL '2 hours'),
          ('gps-007', 'equipo-002', 4.62, -74.07, 38.7, NOW() - INTERVAL '1 hour'),
          ('gps-008', 'equipo-002', 4.63, -74.06, 22.4, NOW() - INTERVAL '30 minutes'),
          ('gps-009', 'equipo-002', 4.64, -74.05, 10.8, NOW());
    END IF;

    -- Añadir registros iniciales para equipo-003 y equipo-004 si no existen
    SELECT COUNT(*) INTO registro_count FROM gps_registros WHERE equipo_id = 'equipo-003';
    IF registro_count = 0 THEN
        INSERT INTO gps_registros (id, equipo_id, latitud, longitud, velocidad, timestamp)
        VALUES ('gps-010', 'equipo-003', 4.70, -74.04, 5.3, NOW());
    END IF;

    SELECT COUNT(*) INTO registro_count FROM gps_registros WHERE equipo_id = 'equipo-004';
    IF registro_count = 0 THEN
        INSERT INTO gps_registros (id, equipo_id, latitud, longitud, velocidad, timestamp)
        VALUES ('gps-011', 'equipo-004', 4.67, -74.07, 12.8, NOW());
    END IF;
END $$; 