/**
 * ===================================================================
 * SUPABASE CLIENT - Capa de acceso a datos
 * -------------------------------------------------------------------
 * Expone window.SupabaseDB con:
 *  - Autenticación (login, registro, sesión, logout)
 *  - Contactos, catálogo, auditorías y preferencias
 * Si no hay credenciales válidas, todos los métodos son inertes y la
 * aplicación continúa con sus datos locales (modo demostración/PWA).
 * ===================================================================
 */
(function (global) {
    'use strict';

    const cfg = global.SUPABASE_CONFIG || {};
    const urlValida = typeof cfg.url === 'string' && /^https:\/\/[\w-]+\.supabase\.co\/?$/.test(cfg.url);
    const keyValida = typeof cfg.anonKey === 'string' && cfg.anonKey.length > 40;
    const sdkValido = typeof global.supabase !== 'undefined' &&
        typeof global.supabase.createClient === 'function';

    const listo = cfg.habilitado === true && urlValida && keyValida && sdkValido;
    let client = null;

    if (listo) {
        try {
            client = global.supabase.createClient(cfg.url, cfg.anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
        } catch (error) {
            console.warn('[Supabase] No se pudo crear el cliente:', error.message);
        }
    } else {
        console.info('[Supabase] Modo demostración: configura supabase-config.js para activar la base de datos.');
    }

    function sinCliente(mensaje) {
        return Promise.resolve({ error: new Error(mensaje || 'Supabase no está configurado'), simulado: true });
    }

    const SupabaseDB = {
        client: client,
        listo: !!client,

        /* ---------- AUTENTICACIÓN ---------- */
        async sesion() {
            if (!client) return null;
            const { data } = await client.auth.getSession();
            return data && data.session ? data.session : null;
        },

        onAuthChange(callback) {
            if (!client) return { unsubscribe: function () {} };
            const respuesta = client.auth.onAuthStateChange(function (_evento, session) {
                callback(session);
            });
            return respuesta.data.subscription;
        },

        iniciarSesion(email, password) {
            if (!client) return sinCliente();
            return client.auth.signInWithPassword({ email: email, password: password });
        },

        crearCuenta(email, password, nombre, apellidos) {
            if (!client) return sinCliente();
            return client.auth.signUp({
                email: email,
                password: password,
                options: { data: { nombre: nombre, apellidos: apellidos } }
            });
        },

        cerrarSesion() {
            if (!client) return sinCliente();
            return client.auth.signOut();
        },

        /* ---------- CONTACTOS ---------- */
        guardarContacto(datos) {
            if (!client) return sinCliente();
            return client.from('contactos').insert([datos]).select('id').single();
        },

        /* ---------- CATÁLOGO ---------- */
        async cargarCatalogo() {
            if (!client) return null;
            const [juegos, artistas, canciones] = await Promise.all([
                client.from('videojuegos').select('*').eq('activo', true).order('orden'),
                client.from('artistas').select('*').eq('activo', true).order('orden'),
                client.from('canciones').select('*').order('rank')
            ]);
            if (juegos.error || artistas.error || canciones.error) {
                throw new Error('No se pudo cargar el catálogo desde Supabase');
            }
            return {
                juegos: juegos.data || [],
                artistas: artistas.data || [],
                canciones: canciones.data || []
            };
        },

        /* ---------- AUDITORÍAS ---------- */
        async registrarAuditoria(tipo, detalle) {
            if (!client) return;
            const session = await this.sesion();
            try {
                await client.from('auditorias').insert([{
                    tipo: tipo,
                    detalle: detalle || {},
                    usuario_id: session ? session.user.id : null
                }]);
            } catch (error) {
                console.warn('[Supabase] No se pudo registrar la auditoría:', error.message);
            }
        },

        /* ---------- PREFERENCIAS ---------- */
        async cargarPreferencias() {
            if (!client) return null;
            const session = await this.sesion();
            if (!session) return null;
            const { data, error } = await client.from('preferencias')
                .select('tema, contraste_alto')
                .eq('usuario_id', session.user.id)
                .maybeSingle();
            return error ? null : data;
        },

        async guardarPreferencias(tema, contrasteAlto) {
            if (!client) return;
            const session = await this.sesion();
            if (!session) return;
            try {
                await client.from('preferencias').upsert({
                    usuario_id: session.user.id,
                    tema: tema,
                    contraste_alto: !!contrasteAlto,
                    actualizado_en: new Date().toISOString()
                });
            } catch (error) {
                console.warn('[Supabase] No se pudo guardar la preferencia:', error.message);
            }
        }
    };

    global.SupabaseDB = SupabaseDB;
})(window);
