/**
 * ===================================================================
 * CONFIGURACIÓN DE SUPABASE
 * -------------------------------------------------------------------
 * PASOS:
 *  1. Crea un proyecto gratis en https://supabase.com
 *  2. En SQL Editor > New query, pega y ejecuta supabase-schema.sql
 *  3. En Project Settings > API copia:
 *       - Project URL  -> url
 *       - anon / public key -> anonKey
 *  4. Pega ambos valores abajo y cambia habilitado a true.
 *
 * Mientras 'habilitado' sea false, la app sigue funcionando en modo
 * demostración (formulario simulado y catálogo desde script.js).
 * NUNCA pongas aquí la service_role key: es secreta y solo va en el servidor.
 * ===================================================================
 */
window.SUPABASE_CONFIG = {
  url: 'https://TU_PROYECTO.supabase.co',
  anonKey: 'TU_ANON_KEY_AQUI',
  habilitado: false
};
