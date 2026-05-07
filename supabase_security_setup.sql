-- ============================================================
-- PASO 1: Crear usuario en Supabase Authentication
-- ============================================================
-- Ve a: https://supabase.com/dashboard → tu proyecto
--       → Authentication → Users → Add user
--
--   Email:    samu@samudrop.com
--   Password: [tu PIN o contraseña, mínimo 6 caracteres]
--
-- El email no es secreto (está en el código como AUTH_EMAIL).
-- La CONTRASEÑA sí es secreta y NUNCA va en el código.
-- ============================================================


-- ============================================================
-- PASO 2: Actualizar las políticas RLS para requerir sesión autenticada
-- Ejecuta este bloque en: SQL Editor → New query
-- ============================================================

-- ── Tabla: subscriptions ────────────────────────────────────

-- Eliminar política permisiva actual (ajusta el nombre si es distinto)
DROP POLICY IF EXISTS "Allow anon all" ON subscriptions;
DROP POLICY IF EXISTS "Allow all" ON subscriptions;
DROP POLICY IF EXISTS "anon_all" ON subscriptions;

-- Crear política que solo permite acceso con sesión activa
CREATE POLICY "Solo sesión autenticada"
  ON subscriptions
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ── Tabla: tracker_products ─────────────────────────────────

-- Eliminar política permisiva actual
DROP POLICY IF EXISTS "Allow anon all" ON tracker_products;
DROP POLICY IF EXISTS "Allow all" ON tracker_products;
DROP POLICY IF EXISTS "anon_all" ON tracker_products;

-- Crear política que solo permite acceso con sesión activa
CREATE POLICY "Solo sesión autenticada"
  ON tracker_products
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');


-- ============================================================
-- VERIFICACIÓN (opcional) — comprueba las políticas activas
-- ============================================================
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('subscriptions', 'tracker_products');
