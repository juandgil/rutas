-- Crear tablas para el sistema de optimización de rutas

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS equipos (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  transportistas JSONB NOT NULL DEFAULT '[]',
  vehiculo_id VARCHAR(36) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  ciudad_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  id VARCHAR(36) PRIMARY KEY,
  placa VARCHAR(20) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  capacidad_peso DECIMAL(10, 2) NOT NULL,
  capacidad_volumen DECIMAL(10, 2) NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de envíos
CREATE TABLE IF NOT EXISTS envios (
  id VARCHAR(36) PRIMARY KEY,
  guia VARCHAR(50) NOT NULL UNIQUE,
  direccion_origen VARCHAR(255) NOT NULL,
  direccion_destino VARCHAR(255) NOT NULL,
  latitud_destino DECIMAL(10, 6) NOT NULL,
  longitud_destino DECIMAL(10, 6) NOT NULL,
  ciudad_id VARCHAR(36) NOT NULL,
  peso DECIMAL(10, 2) NOT NULL,
  volumen DECIMAL(10, 2) NOT NULL,
  estado VARCHAR(20) NOT NULL,
  sla_id VARCHAR(36) NOT NULL,
  equipo_id VARCHAR(36),
  orden_entrega INTEGER,
  fecha_entrega_estimada TIMESTAMP,
  fecha_entrega_real TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de rutas
CREATE TABLE IF NOT EXISTS rutas (
  id VARCHAR(36) PRIMARY KEY,
  equipo_id VARCHAR(36) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  envios JSONB NOT NULL DEFAULT '[]',
  estado VARCHAR(20) NOT NULL,
  distancia_total DECIMAL(10, 2) NOT NULL,
  tiempo_estimado INT NOT NULL,
  replanificada BOOLEAN NOT NULL DEFAULT FALSE,
  ultimo_evento_id VARCHAR(36),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id VARCHAR(36) PRIMARY KEY,
  equipo_id VARCHAR(36) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  descripcion TEXT NOT NULL,
  latitud DECIMAL(10, 6) NOT NULL,
  longitud DECIMAL(10, 6) NOT NULL,
  ciudad_id VARCHAR(36) NOT NULL,
  impacto VARCHAR(20) NOT NULL,
  fecha TIMESTAMP NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de registros GPS
CREATE TABLE IF NOT EXISTS gps_registros (
  id VARCHAR(36) PRIMARY KEY,
  equipo_id VARCHAR(36) NOT NULL,
  latitud DECIMAL(10, 6) NOT NULL,
  longitud DECIMAL(10, 6) NOT NULL,
  velocidad DECIMAL(5, 2) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de SLAs
CREATE TABLE IF NOT EXISTS slas (
  id VARCHAR(36) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT NOT NULL,
  tiempo_entrega INT NOT NULL,
  prioridad INT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  nombre VARCHAR(100),
  apellido VARCHAR(100),
  role VARCHAR(20) NOT NULL, -- ADMIN, OPERADOR, TRANSPORTISTA
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento

-- Índices para equipos
CREATE INDEX idx_equipos_vehiculo_id ON equipos(vehiculo_id);
CREATE INDEX idx_equipos_ciudad_id ON equipos(ciudad_id);
CREATE INDEX idx_equipos_disponible ON equipos(disponible);

-- Índices para vehículos
CREATE INDEX idx_vehiculos_tipo ON vehiculos(tipo);
CREATE INDEX idx_vehiculos_disponible ON vehiculos(disponible);

-- Índices para envíos
CREATE INDEX idx_envios_guia ON envios(guia);
CREATE INDEX idx_envios_ciudad_id ON envios(ciudad_id);
CREATE INDEX idx_envios_estado ON envios(estado);
CREATE INDEX idx_envios_sla_id ON envios(sla_id);
CREATE INDEX idx_envios_equipo_id ON envios(equipo_id);

-- Índices para rutas
CREATE INDEX idx_rutas_equipo_id ON rutas(equipo_id);
CREATE INDEX idx_rutas_fecha ON rutas(fecha);
CREATE INDEX idx_rutas_estado ON rutas(estado);
CREATE INDEX idx_rutas_equipo_fecha ON rutas(equipo_id, fecha);

-- Índices para eventos
CREATE INDEX idx_eventos_equipo_id ON eventos(equipo_id);
CREATE INDEX idx_eventos_ciudad_id ON eventos(ciudad_id);
CREATE INDEX idx_eventos_tipo ON eventos(tipo);
CREATE INDEX idx_eventos_fecha ON eventos(fecha);
CREATE INDEX idx_eventos_activo ON eventos(activo);

-- Índices para registros GPS
CREATE INDEX idx_gps_equipo_id ON gps_registros(equipo_id);
CREATE INDEX idx_gps_timestamp ON gps_registros(timestamp);
CREATE INDEX idx_gps_equipo_timestamp ON gps_registros(equipo_id, timestamp);

-- Índices para SLAs
CREATE INDEX idx_slas_prioridad ON slas(prioridad);
CREATE INDEX idx_slas_activo ON slas(activo);

-- Índice para búsqueda rápida por username
CREATE INDEX idx_usuarios_username ON usuarios(username);
CREATE INDEX idx_usuarios_role ON usuarios(role);

-- Datos de ejemplo para pruebas

-- SLAs
INSERT INTO slas (id, nombre, descripcion, tiempo_entrega, prioridad, activo)
VALUES 
  ('sla-001', 'Express', 'Entrega en menos de 12 horas', 12, 1, true),
  ('sla-002', 'Same Day', 'Entrega en el mismo día', 24, 2, true),
  ('sla-003', 'Next Day', 'Entrega al día siguiente', 48, 3, true),
  ('sla-004', 'Estándar', 'Entrega en 2-3 días', 72, 4, true),
  ('sla-005', 'Económico', 'Entrega en 3-5 días', 120, 5, true);

-- Vehículos
INSERT INTO vehiculos (id, placa, modelo, tipo, capacidad_peso, capacidad_volumen, disponible)
VALUES 
  ('veh-001', 'ABC123', 'Ford Transit 2023', 'FURGON', 1500, 12, true),
  ('veh-002', 'DEF456', 'Mercedes Sprinter 2022', 'FURGON', 2000, 15, true),
  ('veh-003', 'GHI789', 'Chevrolet NPR 2023', 'CAMION', 4500, 30, true),
  ('veh-004', 'JKL012', 'Yamaha YBR 2022', 'MOTOCICLETA', 20, 0.2, true);

-- Equipos
INSERT INTO equipos (id, nombre, transportistas, vehiculo_id, disponible, ciudad_id)
VALUES 
  ('equipo-001', 'Equipo Norte', '["Juan Pérez", "Carlos Gómez"]', 'veh-001', true, 'ciudad-001'),
  ('equipo-002', 'Equipo Sur', '["María Rodríguez", "Ana López"]', 'veh-002', true, 'ciudad-001'),
  ('equipo-003', 'Equipo Este', '["Pedro Martínez", "Luis Torres"]', 'veh-003', true, 'ciudad-002'),
  ('equipo-004', 'Mensajero Express', '["Roberto Díaz"]', 'veh-004', true, 'ciudad-001');

-- Envíos
INSERT INTO envios (id, guia, direccion_origen, direccion_destino, latitud_destino, longitud_destino, 
                  ciudad_id, peso, volumen, estado, sla_id, equipo_id, orden_entrega)
VALUES 
  ('envio-001', 'ENVExp001', 'Centro Logístico Norte', 'Calle 123 #45-67', 4.65, -74.05, 'ciudad-001', 10, 0.5, 'PENDIENTE', 'sla-001', NULL, NULL),
  ('envio-002', 'ENVExp002', 'Centro Logístico Norte', 'Avenida 7 #12-34', 4.66, -74.06, 'ciudad-001', 15, 0.8, 'PENDIENTE', 'sla-001', NULL, NULL),
  ('envio-003', 'ENVSame001', 'Centro Logístico Sur', 'Carrera 15 #67-89', 4.61, -74.08, 'ciudad-001', 20, 1.2, 'PENDIENTE', 'sla-002', NULL, NULL),
  ('envio-004', 'ENVNext001', 'Centro Logístico Este', 'Diagonal 23 #45-67', 4.7, -74.04, 'ciudad-002', 25, 1.5, 'PENDIENTE', 'sla-003', NULL, NULL),
  ('envio-005', 'ENVStd001', 'Centro Logístico Sur', 'Calle 34 #56-78', 4.63, -74.06, 'ciudad-001', 30, 2.0, 'PENDIENTE', 'sla-004', NULL, NULL),
  ('envio-006', 'ENVEco001', 'Centro Logístico Norte', 'Avenida 45 #67-89', 4.64, -74.07, 'ciudad-001', 35, 2.5, 'PENDIENTE', 'sla-005', NULL, NULL),
  ('envio-007', 'ENVExp003', 'Centro Logístico Este', 'Carrera 56 #78-90', 4.71, -74.03, 'ciudad-002', 5, 0.3, 'PENDIENTE', 'sla-001', NULL, NULL),
  ('envio-008', 'ENVSame002', 'Centro Logístico Norte', 'Diagonal 67 #89-01', 4.67, -74.05, 'ciudad-001', 8, 0.4, 'PENDIENTE', 'sla-002', NULL, NULL);

-- Usuarios de prueba (contraseña: admin123)
INSERT INTO usuarios (id, username, password, nombre, apellido, role, activo)
VALUES 
  ('usr-001', 'admin', '$2b$10$X5EEEUqTkAb1Ttj9jGTiS.QI0/Myd5VlnFqsAVHCx5KNZmFcf5/ka', 'Administrador', 'Sistema', 'ADMIN', true),
  ('usr-002', 'operador', '$2b$10$X5EEEUqTkAb1Ttj9jGTiS.QI0/Myd5VlnFqsAVHCx5KNZmFcf5/ka', 'Operador', 'Centro', 'OPERADOR', true),
  ('usr-003', 'transportista', '$2b$10$X5EEEUqTkAb1Ttj9jGTiS.QI0/Myd5VlnFqsAVHCx5KNZmFcf5/ka', 'Conductor', 'Principal', 'TRANSPORTISTA', true); 