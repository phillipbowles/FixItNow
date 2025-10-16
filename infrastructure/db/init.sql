-- Script de inicialización de la base de datos FixItNow
-- Se ejecuta automáticamente al crear el contenedor de PostgreSQL

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Las tablas se crean automáticamente por SQLAlchemy
-- Este script inicializa datos de ejemplo

-- Insertar usuarios de ejemplo
-- Contraseña para todos: "password123"
-- Hash bcrypt: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF8bLHLW

INSERT INTO users (email, full_name, password_hash, role, phone, address, is_active, created_at, updated_at)
VALUES 
    ('admin@fixitnow.com', 'Admin Principal', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF8bLHLW', 'admin', '+598 99 123 456', 'Montevideo, Uruguay', true, NOW(), NOW()),
    ('juan.perez@email.com', 'Juan Pérez', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF8bLHLW', 'provider', '+598 99 234 567', 'Av. Italia 3000, Montevideo', true, NOW(), NOW()),
    ('maria.garcia@email.com', 'María García', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF8bLHLW', 'provider', '+598 99 345 678', 'Bvar. Artigas 1500, Montevideo', true, NOW(), NOW()),
    ('carlos.rodriguez@email.com', 'Carlos Rodríguez', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF8bLHLW', 'user', '+598 99 456 789', 'Pocitos, Montevideo', true, NOW(), NOW()),
    ('ana.martinez@email.com', 'Ana Martínez', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIxF8bLHLW', 'user', '+598 99 567 890', 'Carrasco, Montevideo', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insertar servicios de ejemplo
INSERT INTO services (provider_id, name, description, category, base_price, price_unit, is_active, rating, total_reviews, created_at, updated_at)
VALUES 
    (2, 'Plomería Residencial', 'Reparación de fugas, instalación de cañerías, destapaciones. Más de 10 años de experiencia.', 'Plomería', 50.0, 'por hora', true, 4.8, 42, NOW(), NOW()),
    (2, 'Instalación de Calefones', 'Instalación y mantenimiento de calefones eléctricos y a gas. Servicio garantizado.', 'Plomería', 80.0, 'por trabajo', true, 4.9, 28, NOW(), NOW()),
    (3, 'Electricidad General', 'Instalaciones eléctricas, reparaciones, tableros. Electricista matriculada.', 'Electricidad', 60.0, 'por hora', true, 4.7, 35, NOW(), NOW()),
    (3, 'Instalación de Aires Acondicionados', 'Instalación profesional de aires acondicionados split. Incluye materiales.', 'Electricidad', 150.0, 'por trabajo', true, 4.9, 21, NOW(), NOW()),
    (2, 'Limpieza Profunda de Hogar', 'Limpieza completa de casas y apartamentos. Productos incluidos.', 'Limpieza', 40.0, 'por hora', true, 4.6, 58, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insertar reservas de ejemplo
INSERT INTO bookings (user_id, provider_id, service_id, title, description, status, scheduled_date, address, estimated_price, final_price, created_at, updated_at, accepted_at, completed_at)
VALUES 
    (4, 2, 1, 'Reparación de fuga en cocina', 'Tengo una fuga en la canilla de la cocina que necesita reparación urgente.', 'completed', NOW() - INTERVAL '5 days', 'Pocitos, Montevideo', 50.0, 60.0, NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days'),
    (4, 3, 3, 'Cambio de tomacorrientes', 'Necesito cambiar varios tomacorrientes viejos en mi apartamento.', 'completed', NOW() - INTERVAL '3 days', 'Pocitos, Montevideo', 60.0, 70.0, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
    (5, 2, 5, 'Limpieza antes de mudanza', 'Limpieza profunda de apartamento de 2 dormitorios antes de entrega.', 'in_progress', NOW() + INTERVAL '1 day', 'Carrasco, Montevideo', 120.0, NULL, NOW() - INTERVAL '2 days', NOW(), NOW() - INTERVAL '1 day', NULL),
    (5, 3, 4, 'Instalación de aire acondicionado', 'Quiero instalar un aire acondicionado en el dormitorio principal.', 'pending', NOW() + INTERVAL '3 days', 'Carrasco, Montevideo', 150.0, NULL, NOW() - INTERVAL '1 day', NOW(), NULL, NULL)
ON CONFLICT DO NOTHING;

-- Insertar reviews de ejemplo
INSERT INTO reviews (service_id, user_id, booking_id, rating, comment, created_at)
VALUES 
    (1, 4, 1, 5, 'Excelente trabajo! Llegó puntual y resolvió el problema rápidamente. Muy recomendable.', NOW() - INTERVAL '4 days'),
    (3, 4, 2, 5, 'Muy profesional. Hizo un trabajo prolijo y me explicó todo lo que hacía. Volveré a contratarla.', NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_services_provider ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_rating ON services(rating DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service_id);

-- Índice de búsqueda de texto en servicios
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING gin(to_tsvector('spanish', name || ' ' || description));

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vista para estadísticas del admin
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
    (SELECT COUNT(*) FROM users WHERE role = 'provider') as total_providers,
    (SELECT COUNT(*) FROM services WHERE is_active = true) as active_services,
    (SELECT COUNT(*) FROM bookings) as total_bookings,
    (SELECT COUNT(*) FROM bookings WHERE status = 'completed') as completed_bookings,
    (SELECT COALESCE(AVG(rating), 0) FROM services WHERE total_reviews > 0) as avg_service_rating,
    (SELECT COUNT(*) FROM reviews) as total_reviews;

-- Comentarios para documentación
COMMENT ON TABLE users IS 'Tabla de usuarios (clientes, proveedores y administradores)';
COMMENT ON TABLE services IS 'Catálogo de servicios ofrecidos por proveedores';
COMMENT ON TABLE bookings IS 'Solicitudes y reservas de servicios';
COMMENT ON TABLE reviews IS 'Reseñas y calificaciones de servicios';

COMMENT ON COLUMN users.role IS 'Rol del usuario: user, provider o admin';
COMMENT ON COLUMN services.base_price IS 'Precio base del servicio';
COMMENT ON COLUMN services.price_unit IS 'Unidad de precio: por hora, por trabajo, etc.';
COMMENT ON COLUMN bookings.status IS 'Estado: pending, accepted, in_progress, completed, cancelled';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Base de datos FixItNow inicializada correctamente';
    RAISE NOTICE '📊 Ejecutar: SELECT * FROM admin_stats; para ver estadísticas';
    RAISE NOTICE '👥 Usuarios de prueba creados (password: password123)';
    RAISE NOTICE '   - admin@fixitnow.com (Admin)';
    RAISE NOTICE '   - juan.perez@email.com (Provider)';
    RAISE NOTICE '   - carlos.rodriguez@email.com (User)';
END $$;
