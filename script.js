/**
 * ===================================================================
 * PORTAFOLIO PERSONAL - JONA FRANCO
 * Interacciones dinámicas del DOM + PWA
 * Secciones: 1 Tema | 2 Menú | 3 Videojuegos | 4 Música | 5 Formulario | 6 PWA
 * ===================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ===============================================================
       2.5 DATOS + COMPONENTE .friend-row (Doc 3)
       Datos separados de la presentación; el componente = crearFriendRow()
       y el CSS de .friend-row en styles.css
       =============================================================== */
    const AMIGOS_DATA = [
        {
            href: "https://www.instagram.com/jona_franco0_0",
            clsAvatar: "fa-ig", icon: "fa-instagram",
            name: "Instagram", rank: "@jona_franco0_0",
            statusClass: "online", statusIcon: "fa-circle-check", statusText: "En línea",
            badgeClass: "add", badgeIcon: "fa-plus"
        },
        {
            href: "https://github.com/qjonathanfranco-bit",
            clsAvatar: "fa-gh", icon: "fa-github",
            name: "GitHub", rank: "qjonathanfranco-bit",
            statusClass: "", statusIcon: "fa-code-branch", statusText: "Repositorios",
            badgeClass: "", badgeIcon: "fa-arrow-up-right-from-square"
        },
        {
            href: "https://docs.google.com/spreadsheets/d/1EwQnKAoCikzZJOwPzCM-MsV7R7QnSb228aC5VHREQ5w/edit?usp=sharing",
            clsAvatar: "fa-gs", icon: "fa-file-excel",
            name: "Google Sheets", rank: "Horario semanal",
            statusClass: "", statusIcon: "fa-hourglass-half", statusText: "Planilla",
            badgeClass: "", badgeIcon: "fa-arrow-up-right-from-square"
        }
    ];

    function crearFriendRow(amigo) {
        const statusHtml = `<span class="friend-status${amigo.statusClass ? " " + amigo.statusClass : ""}"><i class="fa-solid ${amigo.statusIcon}"></i> ${amigo.statusText}</span>`;
        const badgeHtml = `<span class="friend-badge${amigo.badgeClass ? " " + amigo.badgeClass : ""}"><i class="fa-solid ${amigo.badgeIcon}"></i></span>`;
        const html = `<a class="friend-row" href="${amigo.href}" target="_blank" rel="noopener">
            <span class="friend-avatar ${amigo.clsAvatar}"><i class="fa-brands ${amigo.icon}"></i></span>
            <span class="friend-info">
                <strong>${amigo.name}</strong>
                <span class="friend-rank"><i class="fa-solid fa-gem"></i> ${amigo.rank}</span>
                ${statusHtml}
            </span>
            ${badgeHtml}
        </a>`;
        return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
    }

    const amigosLista = document.querySelector('.friends-list');
    if (amigosLista) {
        AMIGOS_DATA.forEach(amigo => amigosLista.insertAdjacentHTML('beforeend', crearFriendRow(amigo)));
    }

    /* ===============================================================
       4. DOC 4: SIMULADOR DE ALTO CONTRASTE
       =============================================================== */
    const btnContraste = document.getElementById('btnSimularContraste');
    if (btnContraste) {
        btnContraste.addEventListener('click', () => {
            const alto = document.body.classList.toggle('alto-contraste');
            btnContraste.setAttribute('aria-pressed', alto ? 'true' : 'false');
            if (window.SupabaseDB && SupabaseDB.listo) {
                const tema = document.body.classList.contains('light-mode') ? 'light' : 'dark';
                SupabaseDB.guardarPreferencias(tema, alto);
                SupabaseDB.registrarAuditoria('contraste', { activo: alto });
            }
        });
    }

    /* ===============================================================
       5. DOC 5: AUDITORÍA SEMÁNTICA (HMR también)
       =============================================================== */
    function auditarSemantica() {
        const sel = s => document.querySelectorAll(s).length;
        const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
            .map(h => h.tagName.toLowerCase() + '[' + h.textContent.trim().slice(0, 28) + ']');
        const imgsSinAlt = [...document.querySelectorAll('img')].filter(i => !i.alt || !i.alt.trim()).length;
        return {
            main: sel('main'), header: sel('header'), nav: sel('nav'), section: sel('section'),
            buttons: sel('button'), links: sel('a[href]'), headings, imgsSinAlt
        };
    }
    const btnAuditar = document.getElementById('btnAuditarSemantica');
    const reporteSem = document.getElementById('reporteSemantica');
    if (btnAuditar && reporteSem) {
        btnAuditar.addEventListener('click', () => {
            const r = auditarSemantica();
            reporteSem.textContent =
                `Semántica: main=${r.main} header=${r.header} nav=${r.nav} secciones=${r.section} | ` +
                `Headings: ${r.headings.length ? r.headings.join(' ') : 'ninguno'} | imgs sin alt=${r.imgsSinAlt} | botones=${r.buttons}`;
            if (window.SupabaseDB && SupabaseDB.listo) SupabaseDB.registrarAuditoria('semantica', r);
        });
    }

    /* ===============================================================
       6. DOC 6: SMOKE TEST (DOM en vivo)
       =============================================================== */
    function smokeTestDom() {
        const imgsSinAlt = document.querySelectorAll('img:not([alt]), img[alt=""]').length;
        const linksVacios = document.querySelectorAll('a[href=""], a:not([href])').length;
        const botones = document.querySelectorAll('button').length;
        const friends = document.querySelectorAll('.friend-row').length;
        const salida = document.getElementById('salidaSmoke');
        if (salida) salida.textContent =
            `Smoke Test: amigos=${friends} | img sin alt=${imgsSinAlt} | links vacíos=${linksVacios} | botones=${botones}`;
        if (window.SupabaseDB && SupabaseDB.listo) {
            SupabaseDB.registrarAuditoria('smoke', {
                amigos: friends, imgsSinAlt: imgsSinAlt, linksVacios: linksVacios, botones: botones
            });
        }
    }
    const btnSmoke = document.getElementById('btnSmokeTest');
    if (btnSmoke) btnSmoke.addEventListener('click', smokeTestDom);

    /* ===============================================================
       1. MODO OSCURO / MODO CLARO
       =============================================================== */
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    function aplicarTema(claro) {
        document.body.classList.toggle('light-mode', claro);
        document.body.classList.toggle('dark-mode', !claro);
        if (themeIcon) themeIcon.className = claro ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        if (themeMeta) themeMeta.setAttribute('content', claro ? '#f1f5f9' : '#0b0f19');
    }

    try { aplicarTema(localStorage.getItem('theme-preference') === 'light'); } catch (e) { aplicarTema(false); }

    // Si hay sesión en Supabase, el tema guardado en la nube manda
    if (window.SupabaseDB && SupabaseDB.listo) {
        SupabaseDB.cargarPreferencias().then(pref => {
            if (!pref) return;
            if (pref.tema) {
                aplicarTema(pref.tema === 'light');
                try { localStorage.setItem('theme-preference', pref.tema); } catch (e) {}
            }
            if (pref.contraste_alto) {
                document.body.classList.add('alto-contraste');
                const btnC = document.getElementById('btnSimularContraste');
                if (btnC) btnC.setAttribute('aria-pressed', 'true');
            }
        }).catch(() => {});
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const claro = !document.body.classList.contains('light-mode');
            aplicarTema(claro);
            try { localStorage.setItem('theme-preference', claro ? 'light' : 'dark'); } catch (e) {}
            if (window.SupabaseDB && SupabaseDB.listo) {
                SupabaseDB.guardarPreferencias(
                    claro ? 'light' : 'dark',
                    document.body.classList.contains('alto-contraste')
                );
            }
        });
    }


    /* ===============================================================
       2. LOBBY: PANEL DE REDES Y PESTAÑAS ACTIVAS
       El menú lateral (Offcanvas) y los modales los maneja Bootstrap.
       =============================================================== */
    const friendsPanel = document.getElementById('friends-panel');
    const panelToggle = document.getElementById('panel-toggle');
    const btnRedes = document.getElementById('btn-redes');
    const pantallaAmplia = window.matchMedia('(min-width: 821px) and (orientation: landscape)');

    function setPanel(abierto) {
        if (!friendsPanel) return;
        friendsPanel.classList.toggle('collapsed', !abierto);
        if (panelToggle) panelToggle.setAttribute('aria-expanded', String(abierto));
        if (btnRedes) btnRedes.classList.toggle('active', abierto && !pantallaAmplia.matches);
    }
    const alternarPanel = () => setPanel(friendsPanel.classList.contains('collapsed'));

    if (friendsPanel) {
        // En pantallas grandes empieza abierto; en teléfonos, cerrado
        setPanel(pantallaAmplia.matches);
        if (panelToggle) panelToggle.addEventListener('click', alternarPanel);
        if (btnRedes) btnRedes.addEventListener('click', (e) => { e.stopPropagation(); alternarPanel(); });

        // En pantallas pequeñas, tocar fuera del panel lo cierra
        document.addEventListener('click', (e) => {
            if (pantallaAmplia.matches) return;
            if (!friendsPanel.classList.contains('collapsed') && !friendsPanel.contains(e.target)) setPanel(false);
        });
    }

    // Resalta el botón (lateral o inferior) cuyo modal está abierto
    const botonesDeModal = (id) => document.querySelectorAll(`.lobby-icon-btn[data-bs-target="#${id}"], .nav-tab[data-bs-target="#${id}"]`);
    document.addEventListener('show.bs.modal', (e) => botonesDeModal(e.target.id).forEach(b => b.classList.add('active')));
    document.addEventListener('hidden.bs.modal', (e) => botonesDeModal(e.target.id).forEach(b => b.classList.remove('active')));


    /* ===============================================================
       3. FILTRADO DE VIDEOJUEGOS POR CATEGORÍA
       =============================================================== */
    const gameFilterButtons = document.querySelectorAll('.game-filter-btn');
    const gameCards = document.querySelectorAll('.game-card');
    const noGamesMsg = document.getElementById('no-games-found');

    gameFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            gameFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedFilter = button.getAttribute('data-filter');
            let visibleCount = 0;

            gameCards.forEach(card => {
                const visible = selectedFilter === 'todos' || card.dataset.categoria === selectedFilter;
                card.style.display = visible ? 'block' : 'none';
                if (visible) visibleCount++;
            });

            if (noGamesMsg) noGamesMsg.style.display = (visibleCount === 0) ? 'block' : 'none';
        });
    });


    /* ===============================================================
       4. SECCIÓN MÚSICA: FILTRADO POR GÉNERO Y TOP 10 DE CANCIONES
       =============================================================== */
    // Base de datos de artistas y su Top 10 de canciones
    const catalogoMusica = {
        "jose-jose": {
            nombre: "José José",
            genero: "Balada Romántica & Bolero Clásico",
            foto: "img/joase.png",
            descripcion: "Conocido mundialmente como 'El Príncipe de la Canción', referente indiscutible de la balada en español durante los años 70s y 80s.",
            top10: [
                { rank: 1, titulo: "El Triste", album: "El Triste (1970)", tipo: "Clásico Inmortal" },
                { rank: 2, titulo: "Almohada", album: "Reencuentro (1978)", tipo: "Balada Oro" },
                { rank: 3, titulo: "Amar y Querer", album: "Reencuentro (1977)", tipo: "Romántica" },
                { rank: 4, titulo: "Gavilán o Paloma", album: "Reencuentro (1977)", tipo: "Éxito Radial" },
                { rank: 5, titulo: "Lo Pasado, Pasado", album: "Lo Pasado, Pasado (1978)", tipo: "Himno" },
                { rank: 6, titulo: "40 y 20", album: "40 y 20 (1992)", tipo: "Balada Pop" },
                { rank: 7, titulo: "La Nave del Olvido", album: "La Nave del Olvido (1970)", tipo: "Clásico" },
                { rank: 8, titulo: "Si Me Dejas Ahora", album: "Si Me Dejas Ahora (1979)", tipo: "Melancólico" },
                { rank: 9, titulo: "Buenos Días Amor", album: "Reencuentro (1977)", tipo: "Romance" },
                { rank: 10, titulo: "Desesperado", album: "Mi Vida (1982)", tipo: "Éxito 80s" }
            ]
        },
        "luis-miguel": {
            nombre: "Luis Miguel",
            genero: "Balada Romántica & Pop Latino",
            foto: "img/luis.jpg",
            descripcion: "'El Sol de México'. Virtuoso vocalista con una carrera repleta de discos de platino, boleros magistrales y pop bailable.",
            top10: [
                { rank: 1, titulo: "La Incondicional", album: "Busca una Mujer (1988)", tipo: "Himno Pop 80s" },
                { rank: 2, titulo: "Culpable o No", album: "Busca una Mujer (1988)", tipo: "Balada Emotiva" },
                { rank: 3, titulo: "Hasta Que Me Olvides", album: "Aries (1993)", tipo: "Balada Clásica" },
                { rank: 4, titulo: "Ahora Te Puedes Marchar", album: "Soy Como Quiero Ser (1987)", tipo: "Dance Pop 80s" },
                { rank: 5, titulo: "Tengo Todo Excepto a Ti", album: "20 Años (1990)", tipo: "Balada" },
                { rank: 6, titulo: "Sabor a Mí", album: "Romances (1997)", tipo: "Bolero Magistral" },
                { rank: 7, titulo: "Entrégate", album: "20 Años (1990)", tipo: "Pop Balada" },
                { rank: 8, titulo: "Suave", album: "Aries (1993)", tipo: "Funk Latino" },
                { rank: 9, titulo: "Por Debajo de la Mesa", album: "Romances (1997)", tipo: "Bolero" },
                { rank: 10, titulo: "Cuando Calienta el Sol", album: "Soy Como Quiero Ser (1987)", tipo: "Clásico Verano" }
            ]
        },
        "frank-sinatra": {
            nombre: "Frank Sinatra",
            genero: "Classic Jazz & Big Band",
            foto: "img/sinatra.jpg",
            descripcion: "'La Voz'. Leyenda universal de la música del siglo XX que definió la elegancia vocal, el swing y la era dorada de las orquestas.",
            top10: [
                { rank: 1, titulo: "My Way", album: "My Way (1969)", tipo: "Himno Legendario" },
                { rank: 2, titulo: "Fly Me to the Moon", album: "It Might as Well Be Swing (1964)", tipo: "Swing Clásico" },
                { rank: 3, titulo: "Theme from New York, New York", album: "Trilogy (1980)", tipo: "Big Band" },
                { rank: 4, titulo: "Strangers in the Night", album: "Strangers in the Night (1966)", tipo: "Balada Jazz" },
                { rank: 5, titulo: "That's Life", album: "That's Life (1966)", tipo: "Blues / Swing" },
                { rank: 6, titulo: "I've Got You Under My Skin", album: "Songs for Swingin' Lovers! (1956)", tipo: "Swing Masterpiece" },
                { rank: 7, titulo: "The Way You Look Tonight", album: "Sinatra Sings Days of Wine and Roses (1964)", tipo: "Romántico" },
                { rank: 8, titulo: "Come Fly with Me", album: "Come Fly with Me (1958)", tipo: "Jazz Estándar" },
                { rank: 9, titulo: "Summer Wind", album: "Strangers in the Night (1966)", tipo: "Vocal Jazz" },
                { rank: 10, titulo: "Night and Day", album: "A Swingin' Affair! (1957)", tipo: "Swing Orquestal" }
            ]
        },
        "bruno-mars": {
            nombre: "Bruno Mars",
            genero: "Pop / Funk / R&B",
            foto: "img/bruno.jpg",
            descripcion: "Productor y compositor contemporáneo reconocido por revitalizar el sonido funk retro de los 80s con una energía escénica descomunal.",
            top10: [
                { rank: 1, titulo: "24K Magic", album: "24K Magic (2016)", tipo: "Funk Neón" },
                { rank: 2, titulo: "Uptown Funk (ft. Mark Ronson)", album: "Uptown Special (2014)", tipo: "Mega Hit Mundial" },
                { rank: 3, titulo: "When I Was Your Man", album: "Unorthodox Jukebox (2012)", tipo: "Balada Piano" },
                { rank: 4, titulo: "Locked Out of Heaven", album: "Unorthodox Jukebox (2012)", tipo: "Pop Rock / New Wave" },
                { rank: 5, titulo: "Just the Way You Are", album: "Doo-Wops & Hooligans (2010)", tipo: "Romántico Pop" },
                { rank: 6, titulo: "That's What I Like", album: "24K Magic (2016)", tipo: "R&B / Groove" },
                { rank: 7, titulo: "Leave The Door Open (Silk Sonic)", album: "An Evening with Silk Sonic (2021)", tipo: "Soul 70s / R&B" },
                { rank: 8, titulo: "Treasure", album: "Unorthodox Jukebox (2012)", tipo: "Disco Funk" },
                { rank: 9, titulo: "Versace on the Floor", album: "24K Magic (2016)", tipo: "Balada Slow Jam 80s" },
                { rank: 10, titulo: "Grenade", album: "Doo-Wops & Hooligans (2010)", tipo: "Pop Dramático" }
            ]
        },
        "michael-jackson": {
            nombre: "Michael Jackson",
            genero: "Pop & Synthpop Ochentero",
            foto: "img/michael.jpg",
            descripcion: "'El Rey del Pop'. El artista más influyente de la historia musical, ícono indiscutible de la década de los 80s con álbumes revolucionarios.",
            top10: [
                { rank: 1, titulo: "Billie Jean", album: "Thriller (1982)", tipo: "Obra Maestra 80s" },
                { rank: 2, titulo: "Thriller", album: "Thriller (1982)", tipo: "Videoclip Épico" },
                { rank: 3, titulo: "Beat It", album: "Thriller (1982)", tipo: "Hard Rock / Pop" },
                { rank: 4, titulo: "Smooth Criminal", album: "Bad (1987)", tipo: "Groove Rápido" },
                { rank: 5, titulo: "Man in the Mirror", album: "Bad (1987)", tipo: "Gospel Pop" },
                { rank: 6, titulo: "Bad", album: "Bad (1987)", tipo: "Funk Rock 80s" },
                { rank: 7, titulo: "Don't Stop 'Til You Get Enough", album: "Off the Wall (1979)", tipo: "Disco Funk" },
                { rank: 8, titulo: "Black or White", album: "Dangerous (1991)", tipo: "Rock Pop" },
                { rank: 9, titulo: "Rock with You", album: "Off the Wall (1979)", tipo: "R&B Clásico" },
                { rank: 10, titulo: "The Way You Make Me Feel", album: "Bad (1987)", tipo: "Rhythm Pop" }
            ]
        },
        "the-weeknd": {
            nombre: "The Weeknd",
            genero: "Synthwave & R&B Alternativo",
            foto: "img/weekend.jpg",
            descripcion: "Vocalista canadiense que ha fusionado la estética synthwave ochentera con el R&B moderno, batiendo récords globales.",
            top10: [
                { rank: 1, titulo: "Blinding Lights", album: "After Hours (2020)", tipo: "Synthwave Puro" },
                { rank: 2, titulo: "Starboy (ft. Daft Punk)", album: "Starboy (2016)", tipo: "Electro R&B" },
                { rank: 3, titulo: "Save Your Tears", album: "After Hours (2020)", tipo: "Pop Ochentero" },
                { rank: 4, titulo: "The Hills", album: "Beauty Behind the Madness (2015)", tipo: "Dark R&B" },
                { rank: 5, titulo: "Can't Feel My Face", album: "Beauty Behind the Madness (2015)", tipo: "Funk Pop" },
                { rank: 6, titulo: "I Feel It Coming", album: "Starboy (2016)", tipo: "Disco Soul" },
                { rank: 7, titulo: "Out of Time", album: "Dawn FM (2022)", tipo: "City Pop / R&B" },
                { rank: 8, titulo: "In Your Eyes", album: "After Hours (2020)", tipo: "Saxofón Synth" },
                { rank: 9, titulo: "Die for You", album: "Starboy (2016)", tipo: "Balada Emotiva" },
                { rank: 10, titulo: "Call Out My Name", album: "My Dear Melancholy (2018)", tipo: "Slow R&B" }
            ]
        },
        "mora": {
            nombre: "Mora",
            genero: "Urbano / Melodic Trap",
            foto: "img/mora.jpg",
            descripcion: "Productor y compositor puertorriqueño caracterizado por melodías profundas, baterías espaciadas y sintetizadores envolventes.",
            top10: [
                { rank: 1, titulo: "Memorias (con Jhayco)", album: "MicroDosis (2022)", tipo: "Éxito Urbano" },
                { rank: 2, titulo: "Volando (Remix con Bad Bunny & Sech)", album: "Primer Día de Clases (2021)", tipo: "Mega Hit" },
                { rank: 3, titulo: "LA INOCENTE (con Feid)", album: "MicroDosis (2022)", tipo: "Reggaetón Melódico" },
                { rank: 4, titulo: "Tuyo", album: "Primer Día de Clases (2021)", tipo: "Sentimental" },
                { rank: 5, titulo: "512 (con Jhayco)", album: "Primer Día de Clases (2021)", tipo: "Perreo Fino" },
                { rank: 6, titulo: "APARECISTE", album: "PARAÍSO (2022)", tipo: "Synth Urbano" },
                { rank: 7, titulo: "MODELITO (con YOVNGCHIMI)", album: "PARAÍSO (2022)", tipo: "Trap Rápido" },
                { rank: 8, titulo: "CASUALIDAD", album: "ESTRELLA (2023)", tipo: "Melódico" },
                { rank: 9, titulo: "REINA (con Saiko)", album: "ESTRELLA (2023)", tipo: "Urbano Chill" },
                { rank: 10, titulo: "QUE HABILIDAD", album: "Primer Día de Clases (2021)", tipo: "Flow Nocturno" }
            ]
        },
        "yan-block": {
            nombre: "Yan Block",
            genero: "Trap Latino / Underground",
            foto: "img/yan.jpg",
            descripcion: "Exponente boricua del trap melódico con rimas introspectivas, relatos crudos de superación y ritmos contundentes.",
            top10: [
                { rank: 1, titulo: "Estrellas y Satélites", album: "Sencillo (2022)", tipo: "Trap Lírico" },
                { rank: 2, titulo: "El Mismo de Antes", album: "Sencillo (2021)", tipo: "Introspectivo" },
                { rank: 3, titulo: "Freestyle Real", album: "Underground (2022)", tipo: "Barras Puras" },
                { rank: 4, titulo: "Noche Fría", album: "Sencillo (2020)", tipo: "Trap Melancólico" },
                { rank: 5, titulo: "Desvelo", album: "Sencillo (2021)", tipo: "Nocturno" },
                { rank: 6, titulo: "Código 10", album: "Sencillo (2022)", tipo: "Colaboración" },
                { rank: 7, titulo: "Luna Llena", album: "Sencillo (2023)", tipo: "Melódico" },
                { rank: 8, titulo: "Sentimientos", album: "Sencillo (2021)", tipo: "Sensible" },
                { rank: 9, titulo: "En la Mía", album: "Sencillo (2022)", tipo: "Flow Callejero" },
                { rank: 10, titulo: "Racks", album: "Sencillo (2023)", tipo: "Trap Pesado" }
            ]
        },
        "bad-bunny": {
            nombre: "Bad Bunny",
            genero: "Reggaetón & Urbano Global",
            foto: "img/badBunny.jpg",
            descripcion: "Fenómeno global puertorriqueño, récord indiscutible de streaming en Spotify e impulsor de la cultura latina contemporánea.",
            top10: [
                { rank: 1, titulo: "Tití Me Preguntó", album: "Un Verano Sin Ti (2022)", tipo: "Dembow / Éxito Global" },
                { rank: 2, titulo: "Me Porto Bonito (con Chencho)", album: "Un Verano Sin Ti (2022)", tipo: "Reggaetón Pesado" },
                { rank: 3, titulo: "Ojitos Lindos (con Bomba Estéreo)", album: "Un Verano Sin Ti (2022)", tipo: "Indie Urbano" },
                { rank: 4, titulo: "Dákiti (con Jhayco)", album: "El Último Tour Del Mundo (2020)", tipo: "Afrobeat Pop" },
                { rank: 5, titulo: "Safaera", album: "YHLQMDLG (2020)", tipo: "Medley Clásico" },
                { rank: 6, titulo: "Yo Perreo Sola", album: "YHLQMDLG (2020)", tipo: "Himno Bailable" },
                { rank: 7, titulo: "Mónaco", album: "Nadie Sabe Lo Que Va A Pasar Mañana (2023)", tipo: "Trap Sinfónico" },
                { rank: 8, titulo: "La Canción (con J Balvin)", album: "OASIS (2019)", tipo: "Melancólico" },
                { rank: 9, titulo: "Callaíta", album: "Sencillo (2019)", tipo: "Verano Clásico" },
                { rank: 10, titulo: "Efecto", album: "Un Verano Sin Ti (2022)", tipo: "Reggaetón Cósmico" }
            ]
        },
        "josean-log": {
            nombre: "Josean Log",
            genero: "Indie Pop & Folk Acústico",
            foto: "img/josean.jpg",
            descripcion: "Cantautor mexicano que transmite serenidad, optimismo y calidez a través de armonías con ukelele y letras honestas.",
            top10: [
                { rank: 1, titulo: "Chapa de Bombón", album: "Háblame de Tú (2016)", tipo: "Ukelele Alegre" },
                { rank: 2, titulo: "Beso", album: "Háblame de Tú (2018)", tipo: "Romántico Acústico" },
                { rank: 3, titulo: "Tierra", album: "Háblame de Tú (2016)", tipo: "Folk Serena" },
                { rank: 4, titulo: "La Vida Es un Ratico", album: "El Futuro (2019)", tipo: "Filosofía Positiva" },
                { rank: 5, titulo: "Jacaranda", album: "Háblame de Tú (2016)", tipo: "Poesía Musical" },
                { rank: 6, titulo: "Combustión", album: "Háblame de Tú (2018)", tipo: "Calidez Acústica" },
                { rank: 7, titulo: "Alguien Como Tú", album: "El Futuro (2019)", tipo: "Sensible" },
                { rank: 8, titulo: "Doma", album: "Háblame de Tú (2018)", tipo: "Suave" },
                { rank: 9, titulo: "Canción sin Nombre", album: "Sencillo (2020)", tipo: "Reflexión" },
                { rank: 10, titulo: "Si Fuera Tú", album: "Sencillo (2021)", tipo: "Indie Acústico" }
            ]
        },
        "kevin-kaarl": {
            nombre: "Kevin Kaarl",
            genero: "Indie Folk & Balada Acústica",
            foto: "img/kevin.jpg",
            descripcion: "Voz profunda y melancólica desde Chihuahua, México. Sus composiciones acústicas tocan fibras profundas de nostalgia y amor.",
            top10: [
                { rank: 1, titulo: "San Lucas", album: "San Lucas (2019)", tipo: "Himno Indie Folk" },
                { rank: 2, titulo: "Vámonos a Marte", album: "Hasta el Fin del Mundo (2019)", tipo: "Balada Espacial" },
                { rank: 3, titulo: "Colapso", album: "San Lucas (2020)", tipo: "Nostalgia Pura" },
                { rank: 4, titulo: "Toda Esta Ciudad", album: "Sencillo (2021)", tipo: "Guitarra Solitaria" },
                { rank: 5, titulo: "Si Supieras", album: "Hasta el Fin del Mundo (2019)", tipo: "Romance Acústico" },
                { rank: 6, titulo: "Como Me Encanta", album: "París Texas (2022)", tipo: "Folk Alternativo" },
                { rank: 7, titulo: "Te Quiero Tanto", album: "París Texas (2022)", tipo: "Poesía Vocal" },
                { rank: 8, titulo: "Abrazado a Ti", album: "San Lucas (2020)", tipo: "Intimista" },
                { rank: 9, titulo: "Siente Más", album: "París Texas (2022)", tipo: "Indie Profundo" },
                { rank: 10, titulo: "Amor Viejo", album: "Hasta el Fin del Mundo (2018)", tipo: "Acústico" }
            ]
        },
        "ed-maverick": {
            nombre: "Ed Maverick",
            genero: "Folk Rock & Sad Boy Latino",
            foto: "img/ed.jpg",
            descripcion: "Uno de los fenómenos más auténticos de la música indie hispana, conocido por sus letras directas y rasgueos viscerales.",
            top10: [
                { rank: 1, titulo: "Fuentes de Ortiz", album: "Mix Pa Llorar en Tu Cuarto (2018)", tipo: "Éxito Viral" },
                { rank: 2, titulo: "Acurrucar", album: "Mix Pa Llorar en Tu Cuarto (2018)", tipo: "Melancólico" },
                { rank: 3, titulo: "Ropa de Bazar", album: "Mix Pa Llorar en Tu Cuarto (2018)", tipo: "Acústico Sentido" },
                { rank: 4, titulo: "Quiero", album: "Mix Pa Llorar en Tu Cuarto (2018)", tipo: "Sinceridad Lírica" },
                { rank: 5, titulo: "Siempre Estoy Pa Ti", album: "Transiciones (2019)", tipo: "Folk Moderno" },
                { rank: 6, titulo: "Karpe Diem", album: "Mix Pa Llorar en Tu Cuarto (2018)", tipo: "Juventud" },
                { rank: 7, titulo: "tierrita mojada", album: "eduardo (2021)", tipo: "Folk Experimental" },
                { rank: 8, titulo: "niño", album: "eduardo (2021)", tipo: "Introspectivo" },
                { rank: 9, titulo: "nos queda mucho dolor por recorrer", album: "eduardo (2021)", tipo: "Guitarra Cruda" },
                { rank: 10, titulo: "gente", album: "eduardo (2021)", tipo: "Folk Rock" }
            ]
        },
        "queen": {
            nombre: "Queen",
            genero: "Rock Legendario & 80s Rock",
            foto: "img/queen.jpg",
            descripcion: "Banda británica inmortal liderada por Freddie Mercury. Pioneros de los sintetizadores y estadios llenos en los 80s.",
            top10: [
                { rank: 1, titulo: "Bohemian Rhapsody", album: "A Night at the Opera (1975)", tipo: "Ópera Rock Suprema" },
                { rank: 2, titulo: "Don't Stop Me Now", album: "Jazz (1978)", tipo: "Energía Pura" },
                { rank: 3, titulo: "Another One Bites the Dust", album: "The Game (1980)", tipo: "Funk Rock 80s" },
                { rank: 4, titulo: "Radio Ga Ga", album: "The Works (1984)", tipo: "Synthpop / Live Aid" },
                { rank: 5, titulo: "Under Pressure (con David Bowie)", album: "Hot Space (1981)", tipo: "Colaboración Histórica" },
                { rank: 6, titulo: "I Want to Break Free", album: "The Works (1984)", tipo: "Sintetizadores 80s" },
                { rank: 7, titulo: "We Will Rock You", album: "News of the World (1977)", tipo: "Himno de Estadios" },
                { rank: 8, titulo: "We Are the Champions", album: "News of the World (1977)", tipo: "Himno de Victoria" },
                { rank: 9, titulo: "Somebody to Love", album: "A Day at the Races (1976)", tipo: "Gospel Rock" },
                { rank: 10, titulo: "The Show Must Go On", album: "Innuendo (1991)", tipo: "Fuerza y Emoción" }
            ]
        },
        "soda-stereo": {
            nombre: "Soda Stereo",
            genero: "Rock en Español / New Wave 80s",
            foto: "img/soda.jpg",
            descripcion: "El trío argentino de Gustavo Cerati que revolucionó América Latina en los años 80 con sonido New Wave y post-punk elegante.",
            top10: [
                { rank: 1, titulo: "De Música Ligera", album: "Canción Animal (1990)", tipo: "Himno del Rock Latino" },
                { rank: 2, titulo: "Cuando Pase el Temblor", album: "Nada Personal (1985)", tipo: "Carnavalito New Wave" },
                { rank: 3, titulo: "Persiana Americana", album: "Signos (1986)", tipo: "Clásico Ochentero" },
                { rank: 4, titulo: "En la Ciudad de la Furia", album: "Doble Vida (1988)", tipo: "Atmósfera Oscura" },
                { rank: 5, titulo: "Nada Personal", album: "Nada Personal (1985)", tipo: "Pop Rock 80s" },
                { rank: 6, titulo: "Prófugos", album: "Signos (1986)", tipo: "Bajo Electrizante" },
                { rank: 7, titulo: "Trátame Suavemente", album: "Soda Stereo (1984)", tipo: "Balada Icónica" },
                { rank: 8, titulo: "Signos", album: "Signos (1986)", tipo: "Guitarras Limpias" },
                { rank: 9, titulo: "Sobredosis de TV", album: "Soda Stereo (1984)", tipo: "Ska New Wave" },
                { rank: 10, titulo: "Te Hacen Falta Vitaminas", album: "Soda Stereo (1984)", tipo: "Ritmo Rápido 80s" }
            ]
        },
        "aha-synthwave": {
            nombre: "A-ha & Depeche Mode",
            genero: "Synthpop Ochentero & Retro Wave",
            foto: "img/a_ha.jpg",
            descripcion: "Pioneros absolutos del uso de sintetizadores y cajas de ritmo electrónicas que marcaron la identidad sonora de 1980 a 1990.",
            top10: [
                { rank: 1, titulo: "Take On Me (A-ha)", album: "Hunting High and Low (1985)", tipo: "Synthpop Inmortal" },
                { rank: 2, titulo: "Enjoy the Silence (Depeche Mode)", album: "Violator (1990)", tipo: "Dark Synth" },
                { rank: 3, titulo: "The Sun Always Shines on T.V. (A-ha)", album: "Hunting High and Low (1985)", tipo: "Épico Ochentero" },
                { rank: 4, titulo: "Personal Jesus (Depeche Mode)", album: "Violator (1989)", tipo: "Electro Blues" },
                { rank: 5, titulo: "Just Can't Get Enough (Depeche Mode)", album: "Speak & Spell (1981)", tipo: "Early Synth" },
                { rank: 6, titulo: "Hunting High and Low (A-ha)", album: "Hunting High and Low (1985)", tipo: "Balada Electrónica" },
                { rank: 7, titulo: "Never Let Me Down Again (Depeche Mode)", album: "Music for the Masses (1987)", tipo: "Himno Electro" },
                { rank: 8, titulo: "Strangelove (Depeche Mode)", album: "Music for the Masses (1987)", tipo: "Synth Dance" },
                { rank: 9, titulo: "Policy of Truth (Depeche Mode)", album: "Violator (1990)", tipo: "Groove Electrónico" },
                { rank: 10, titulo: "Crying in the Rain (A-ha)", album: "East of the Sun (1990)", tipo: "Melódico Synth" }
            ]
        }
    };

    // 4.1 Filtrado de música por género
    const musicFilterButtons = document.querySelectorAll('.music-filter-btn');
    const musicCards = document.querySelectorAll('.music-card-item');

    musicFilterButtons.forEach(button => {
        button.addEventListener('click', () => {
            musicFilterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedGenre = button.getAttribute('data-music-filter');
            musicCards.forEach(card => {
                const visible = selectedGenre === 'todos' || card.dataset.genero === selectedGenre;
                card.style.display = visible ? 'block' : 'none';
            });
        });
    });

    // 4.2 Modal dinámico de Top 10 (se inyecta con innerHTML)
    const modalTopMusicaEl = document.getElementById('modalTopMusica');
    const modalMusicaEl = document.getElementById('modalMusica');
    const modalTituloArtista = document.getElementById('modal-artista-titulo');
    const modalSubtituloArtista = document.getElementById('modal-artista-subtitulo');
    const modalFotoArtista = document.getElementById('modal-artista-foto');
    const modalDescripcionArtista = document.getElementById('modal-artista-desc');
    const modalListaTop10 = document.getElementById('modal-lista-top10');

    const bsModalTop = (modalTopMusicaEl && typeof bootstrap !== 'undefined')
        ? bootstrap.Modal.getOrCreateInstance(modalTopMusicaEl) : null;
    const bsModalMusica = (modalMusicaEl && typeof bootstrap !== 'undefined')
        ? bootstrap.Modal.getOrCreateInstance(modalMusicaEl) : null;

    // Bootstrap no apila bien dos modales: cerramos la lista, abrimos el Top 10
    // y al cerrar el Top 10 volvemos a la lista de artistas.
    let volverALista = false;
    if (modalTopMusicaEl) {
        modalTopMusicaEl.addEventListener('hidden.bs.modal', () => {
            if (volverALista && bsModalMusica) {
                volverALista = false;
                bsModalMusica.show();
            }
        });
    }

    function escaparHTML(texto) {
        return String(texto).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function abrirTopArtista(artistKey) {
        const dataArtista = catalogoMusica[artistKey];
        if (!dataArtista || !bsModalTop) return;

        modalTituloArtista.textContent = dataArtista.nombre;
        modalSubtituloArtista.textContent = dataArtista.genero;
        modalFotoArtista.src = dataArtista.foto;
        modalFotoArtista.alt = dataArtista.nombre;
        modalDescripcionArtista.textContent = dataArtista.descripcion;

        modalListaTop10.innerHTML = dataArtista.top10.map(c => `
            <div class="top-song-item d-flex align-items-center justify-content-between gap-2 p-2 mb-2 rounded-3">
                <div class="d-flex align-items-center gap-3">
                    <span class="badge-rank">${c.rank}</span>
                    <div>
                        <h6 class="mb-0 fw-bold">${escaparHTML(c.titulo)}</h6>
                        <small class="song-album">${escaparHTML(c.album)}</small>
                    </div>
                </div>
                <span class="badge bg-purple-neon rounded-pill px-3 py-1 small">${escaparHTML(c.tipo)}</span>
            </div>
        `).join('');

        if (modalMusicaEl && modalMusicaEl.classList.contains('show') && bsModalMusica) {
            volverALista = true;
            modalMusicaEl.addEventListener('hidden.bs.modal', () => bsModalTop.show(), { once: true });
            bsModalMusica.hide();
        } else {
            bsModalTop.show();
        }
    }

    document.querySelectorAll('.btn-ver-top10, .music-card-clickable').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            abrirTopArtista(item.getAttribute('data-artista-id'));
        });
        // Accesibilidad con teclado
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirTopArtista(item.getAttribute('data-artista-id'));
            }
        });
    });


    /* ===============================================================
       5. FORMULARIO COMPLETO: VALIDACIONES EN TIEMPO REAL Y AL ENVIAR
       ---------------------------------------------------------------
       - blur: al salir del campo se normaliza (espacios) y se valida.
       - input: una vez "tocado", se revalida mientras se escribe.
       - submit: e.preventDefault(), validación global, resumen de
         errores con innerHTML y foco en el primer campo inválido.
       - Extras: contador de caracteres, filtro de teléfono, honeypot
         anti-bots, anti doble envío y escape de HTML (anti-XSS).
       =============================================================== */
    const contactForm = document.getElementById('contact-form');
    const formAlertBox = document.getElementById('form-alert-container');
    if (contactForm && formAlertBox) {

        const L = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';
        const reNombre = new RegExp(`^[${L}]+(?:[ '\\-][${L}]+)*$`);
        const reCiudad = new RegExp(`^[${L}][${L} ,.'\\-]*$`);
        const reCorreo = /^[A-Za-z0-9](?:[A-Za-z0-9._%+\-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;
        const MAX_MENSAJE = 500;

        // Cada campo devuelve '' si es válido o el texto del error.
        // Los campos se validan primero como "obligatorios".
        const camposAuditoria = [
            { id: 'campo-nombre', nombre: 'Nombre', normalizar: 'texto', validar: v => {
                if (v.length < 2) return 'El nombre debe tener al menos 2 caracteres.';
                if (v.length > 40) return 'El nombre no puede superar los 40 caracteres.';
                if (!reNombre.test(v)) return 'El nombre solo puede tener letras (sin números ni símbolos).';
                return '';
            }},
            { id: 'campo-apellidos', nombre: 'Apellidos', normalizar: 'texto', validar: v => {
                if (v.length < 2) return 'Los apellidos deben tener al menos 2 caracteres.';
                if (v.length > 40) return 'Los apellidos no pueden superar los 40 caracteres.';
                if (!reNombre.test(v)) return 'Los apellidos solo pueden tener letras (sin números ni símbolos).';
                return '';
            }},
            { id: 'campo-correo', nombre: 'Correo Electrónico', normalizar: 'minusculas', validar: v => {
                if (v.length > 100) return 'El correo no puede superar los 100 caracteres.';
                if (/\s/.test(v)) return 'El correo no puede contener espacios.';
                if (!v.includes('@')) return 'El correo debe incluir el símbolo @.';
                if (v.includes('..')) return 'El correo no puede tener dos puntos seguidos.';
                if (!reCorreo.test(v)) return 'Introduce un correo válido (ejemplo: usuario@correo.com).';
                return '';
            }},
            { id: 'campo-telefono', nombre: 'Teléfono / WhatsApp', normalizar: 'texto', validar: v => {
                const limpio = v.replace(/[\s-]/g, '');
                if (!/^\+?\d+$/.test(limpio)) return 'El teléfono solo puede tener números (y un + al inicio).';
                const digitos = limpio.replace('+', '');
                if (digitos.length < 7 || digitos.length > 12) return 'El teléfono debe tener entre 7 y 12 dígitos.';
                if (/^(\d)\1+$/.test(digitos)) return 'Ese número de teléfono no parece válido.';
                return '';
            }},
            { id: 'campo-ciudad', nombre: 'Ciudad / País', normalizar: 'texto', validar: v => {
                if (v.length < 3) return 'Escribe al menos 3 caracteres.';
                if (v.length > 60) return 'No puede superar los 60 caracteres.';
                if (!reCiudad.test(v)) return 'Solo se permiten letras, espacios, comas, puntos y guiones.';
                return '';
            }},
            { id: 'campo-motivo', nombre: 'Motivo de Contacto', esSelect: true, validar: () => '' },
            { id: 'campo-prioridad', nombre: 'Nivel de Prioridad', esSelect: true, validar: () => '' },
            { id: 'campo-asunto', nombre: 'Asunto', normalizar: 'texto', validar: v => {
                if (v.length < 4) return 'El asunto debe tener al menos 4 caracteres.';
                if (v.length > 80) return 'El asunto no puede superar los 80 caracteres.';
                if (!new RegExp(`[${L}0-9]`).test(v)) return 'El asunto debe contener letras o números.';
                return '';
            }},
            { id: 'campo-mensaje', nombre: 'Mensaje Detallado', normalizar: 'trim', validar: v => {
                if (v.length < 10) return 'El mensaje debe contener al menos 10 caracteres explicativos.';
                if (v.length > MAX_MENSAJE) return `El mensaje no puede superar los ${MAX_MENSAJE} caracteres.`;
                if (v.split(/\s+/).length < 2) return 'Escribe al menos 2 palabras.';
                if (/^(.)\1+$/.test(v.replace(/\s/g, ''))) return 'El mensaje no puede ser un solo carácter repetido.';
                return '';
            }}
        ];

        const chkTerminos = document.getElementById('campo-terminos');
        const contador = document.getElementById('contador-mensaje');
        const btnEnviar = document.getElementById('btn-enviar');
        let enviando = false;

        // ---------- utilidades de interfaz ----------
        function mostrarAlertaCampo(inputEl, mensaje) {
            let alertaEl = inputEl.parentNode.querySelector('.campo-alerta-dinamica');
            if (!alertaEl) {
                alertaEl = document.createElement('div');
                alertaEl.className = 'campo-alerta-dinamica text-danger small mt-1 fw-bold';
                alertaEl.setAttribute('role', 'alert');
                inputEl.parentNode.appendChild(alertaEl);
            }
            alertaEl.innerHTML = `<i class="fa-solid fa-circle-exclamation me-1"></i> ${escaparHTML(mensaje)}`;
            inputEl.classList.add('is-invalid');
            inputEl.classList.remove('is-valid');
            inputEl.setAttribute('aria-invalid', 'true');
        }

        function limpiarAlertaCampo(inputEl) {
            const alertaEl = inputEl.parentNode.querySelector('.campo-alerta-dinamica');
            if (alertaEl) alertaEl.remove();
            inputEl.classList.remove('is-invalid');
            inputEl.classList.add('is-valid');
            inputEl.removeAttribute('aria-invalid');
        }

        function reiniciarEstadoCampo(inputEl) {
            const alertaEl = inputEl.parentNode.querySelector('.campo-alerta-dinamica');
            if (alertaEl) alertaEl.remove();
            inputEl.classList.remove('is-invalid', 'is-valid');
            inputEl.removeAttribute('aria-invalid');
        }

        function normalizarValor(campo, inputEl) {
            let v = inputEl.value;
            if (campo.normalizar === 'texto') v = v.trim().replace(/\s+/g, ' ');
            else if (campo.normalizar === 'minusculas') v = v.trim().toLowerCase();
            else v = v.trim();
            if (v !== inputEl.value) inputEl.value = v;
            return v;
        }

        // Evalúa un valor (sin tocar la interfaz). Devuelve '' si es válido.
        function evaluarValor(campo, valor) {
            if (valor === '') {
                return campo.esSelect
                    ? `Debes seleccionar una opción en ${campo.nombre}.`
                    : `El campo ${campo.nombre} está vacío y es obligatorio.`;
            }
            return campo.validar(valor);
        }

        // Valida al salir del campo / al enviar: normaliza el valor y actualiza la interfaz
        function validarCampo(campo, inputEl) {
            const valor = campo.esSelect ? inputEl.value.trim() : normalizarValor(campo, inputEl);
            const error = evaluarValor(campo, valor);
            if (error) mostrarAlertaCampo(inputEl, error); else limpiarAlertaCampo(inputEl);
            return error;
        }

        function validarTerminos() {
            if (!chkTerminos) return '';
            if (!chkTerminos.checked) {
                mostrarAlertaCampo(chkTerminos, 'Debes aceptar los términos de contacto para continuar.');
                return 'Debes confirmar y aceptar los <strong>términos de contacto</strong>.';
            }
            limpiarAlertaCampo(chkTerminos);
            return '';
        }

        function actualizarContador() {
            const area = document.getElementById('campo-mensaje');
            if (!area || !contador) return;
            const n = area.value.length;
            contador.textContent = `${n}/${MAX_MENSAJE}`;
            contador.classList.toggle('text-warning', n >= MAX_MENSAJE * 0.9 && n < MAX_MENSAJE);
            contador.classList.toggle('text-danger', n >= MAX_MENSAJE);
        }

        // Si ya no queda ningún error, quita el resumen rojo
        function limpiarResumenSiTodoOk() {
            if (!formAlertBox.querySelector('.alert-box-error')) return;
            if (!contactForm.querySelector('.is-invalid')) formAlertBox.innerHTML = '';
        }

        // ---------- eventos por campo ----------
        camposAuditoria.forEach(campo => {
            const inputEl = document.getElementById(campo.id);
            if (!inputEl) return;

            inputEl.addEventListener('blur', () => validarCampo(campo, inputEl));

            inputEl.addEventListener('input', () => {
                // Teléfono: filtra letras y símbolos mientras se escribe
                if (campo.id === 'campo-telefono') {
                    let v = inputEl.value.replace(/[^\d+\s-]/g, '');
                    v = v.charAt(0) === '+' ? '+' + v.slice(1).replace(/\+/g, '') : v.replace(/\+/g, '');
                    if (v !== inputEl.value) inputEl.value = v;
                }
                if (campo.id === 'campo-mensaje') actualizarContador();

                // Si el campo ya fue validado antes, revalida en vivo (sin alterar el texto)
                if (inputEl.classList.contains('is-invalid') || inputEl.classList.contains('is-valid')) {
                    let v = inputEl.value.trim();
                    if (campo.normalizar === 'texto') v = v.replace(/\s+/g, ' ');
                    if (campo.normalizar === 'minusculas') v = v.toLowerCase();
                    const error = evaluarValor(campo, v);
                    if (error) mostrarAlertaCampo(inputEl, error); else limpiarAlertaCampo(inputEl);
                    limpiarResumenSiTodoOk();
                }
            });

            if (campo.esSelect) {
                inputEl.addEventListener('change', () => {
                    validarCampo(campo, inputEl);
                    limpiarResumenSiTodoOk();
                });
            }
        });

        if (chkTerminos) {
            chkTerminos.addEventListener('change', () => {
                validarTerminos();
                limpiarResumenSiTodoOk();
            });
        }

        // Botón "Limpiar"
        contactForm.addEventListener('reset', () => {
            camposAuditoria.forEach(c => { const el = document.getElementById(c.id); if (el) reiniciarEstadoCampo(el); });
            if (chkTerminos) reiniciarEstadoCampo(chkTerminos);
            formAlertBox.innerHTML = '';
            setTimeout(actualizarContador, 0);
        });

        // ---------- envío ----------
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (enviando) return; // evita doble envío

            // Honeypot: si un bot llena el campo oculto, se descarta sin avisar
            const trampa = document.getElementById('campo-web');
            if (trampa && trampa.value.trim() !== '') return;

            const errores = [];
            let primerInvalido = null;

            camposAuditoria.forEach(campo => {
                const inputEl = document.getElementById(campo.id);
                if (!inputEl) return;
                const error = validarCampo(campo, inputEl);
                if (error) {
                    errores.push(`<strong>${escaparHTML(campo.nombre)}</strong>: ${escaparHTML(error)}`);
                    if (!primerInvalido) primerInvalido = inputEl;
                }
            });

            const errorTerminos = validarTerminos();
            if (errorTerminos) {
                errores.push(errorTerminos);
                if (!primerInvalido) primerInvalido = chkTerminos;
            }

            if (errores.length > 0) {
                formAlertBox.innerHTML = `
                    <div class="alert-box-error p-3 rounded-4 mb-3">
                        <div class="d-flex align-items-center mb-2 text-danger fw-bold">
                            <i class="fa-solid fa-triangle-exclamation fs-4 me-2"></i>
                            <span>No se pudo enviar: ${errores.length} campo(s) con observaciones</span>
                        </div>
                        <ul class="mb-0 ps-3 small">
                            ${errores.map(err => `<li class="my-1">${err}</li>`).join('')}
                        </ul>
                    </div>`;
                formAlertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                if (primerInvalido) primerInvalido.focus({ preventScroll: true });
                return;
            }

            // Todo válido: guardamos en Supabase (o simulamos si no está configurado)
            const valor = id => (document.getElementById(id) || {}).value || '';
            const nombreIngresado = valor('campo-nombre').trim();
            const motivoIngresado = valor('campo-motivo');
            const datosContacto = {
                nombre: nombreIngresado,
                apellidos: valor('campo-apellidos').trim(),
                correo: valor('campo-correo').trim(),
                telefono: valor('campo-telefono').trim(),
                ciudad: valor('campo-ciudad').trim(),
                motivo: motivoIngresado,
                prioridad: valor('campo-prioridad'),
                asunto: valor('campo-asunto').trim(),
                mensaje: valor('campo-mensaje').trim()
            };

            enviando = true;
            if (btnEnviar) {
                btnEnviar.disabled = true;
                btnEnviar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
            }

            function restaurarBoton() {
                enviando = false;
                if (btnEnviar) {
                    btnEnviar.disabled = false;
                    btnEnviar.innerHTML = '<i class="fa-solid fa-paper-plane me-2"></i>Enviar Mensaje';
                }
            }

            function exitoEnvio(nota) {
                contactForm.reset(); // limpia campos y estados
                formAlertBox.innerHTML = `
                    <div class="alert-box-success p-4 rounded-4 mb-3 text-center">
                        <div class="text-success fw-bold fs-4 mb-2">
                            <i class="fa-solid fa-circle-check fs-1 d-block mb-2"></i>
                            ¡Mensaje enviado satisfactoriamente!
                        </div>
                        <p class="mb-1">
                            Muchas gracias <strong>${escaparHTML(nombreIngresado)}</strong> por ponerte en contacto respecto a: <em>${escaparHTML(motivoIngresado)}</em>.
                        </p>
                        <p class="text-info small mb-0">He recibido tus datos correctamente y te responderé lo más pronto posible.</p>
                        ${nota ? `<p class="text-muted small mb-0 mt-1">${escaparHTML(nota)}</p>` : ''}
                    </div>`;
                restaurarBoton();
                formAlertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            function errorEnvio(mensaje) {
                formAlertBox.innerHTML = `
                    <div class="alert-box-error p-3 rounded-4 mb-3">
                        <div class="d-flex align-items-center gap-2 text-danger fw-bold">
                            <i class="fa-solid fa-triangle-exclamation fs-4"></i>
                            <span>No se pudo guardar el mensaje</span>
                        </div>
                        <p class="small mb-0 mt-2">${escaparHTML(mensaje)}</p>
                    </div>`;
                restaurarBoton();
                formAlertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            if (window.SupabaseDB && SupabaseDB.listo) {
                SupabaseDB.guardarContacto(datosContacto)
                    .then(resultado => {
                        if (resultado && resultado.error) return errorEnvio(resultado.error.message);
                        exitoEnvio('Guardado en Supabase ✓');
                    })
                    .catch(err => errorEnvio(err.message));
            } else {
                setTimeout(() => exitoEnvio('Modo demostración (Supabase sin configurar)'), 900);
            }
        });

        actualizarContador();
    }


    /* ===============================================================
       6. PWA: SERVICE WORKER E INSTALACIÓN
       =============================================================== */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('Service Worker registrado:', reg.scope))
                .catch(err => console.log('Fallo al registrar el Service Worker:', err));
        });
    }

    let deferredPrompt = null;
    const installBtn = document.getElementById('pwa-install-btn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.style.display = 'inline-flex';
    });

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        if (installBtn) installBtn.style.display = 'none';
    });


    /* ===============================================================
       9. SUPABASE: LOGIN (AUTH), CATÁLOGO REMOTO Y PREFERENCIAS
       Si no hay credenciales, todo sigue funcionando en modo local.
       =============================================================== */
    const DB = window.SupabaseDB;

    function mensajeLogin(texto, tipo) {
        const caja = document.getElementById('loginMensaje');
        if (!caja) return;
        caja.textContent = texto || '';
        caja.className = 'login-mensaje' + (texto ? (tipo === 'error' ? ' es-error' : ' es-ok') : '');
    }

    function errorAuth(error) {
        const m = (error && error.message) || 'Error desconocido';
        if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
        if (/email not confirmed/i.test(m)) return 'Confirma tu correo antes de entrar (revisa tu bandeja).';
        if (/user already registered/i.test(m)) return 'Ese correo ya está registrado. Inicia sesión.';
        if (/password should be at least/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
        return m;
    }

    function actualizarUIUsuario(session) {
        const correo = session && session.user ? session.user.email : '';
        const btnLogin = document.getElementById('btnLogin');
        const btnLogout = document.getElementById('btnLogout');
        const icono = document.getElementById('login-icon');
        const estado = document.getElementById('estadoUsuario');
        const info = document.getElementById('login-estado');

        if (btnLogin) btnLogin.style.display = correo ? 'none' : 'inline-flex';
        if (btnLogout) btnLogout.style.display = correo ? 'inline-flex' : 'none';
        if (icono) icono.className = correo ? 'fa-solid fa-user-check' : 'fa-solid fa-right-to-bracket';
        if (estado) estado.textContent = correo ? 'Sesión iniciada: ' + correo : 'Sin sesión iniciada';
        if (info) {
            info.textContent = correo
                ? 'Conectado como ' + correo
                : (DB && DB.listo
                    ? 'Inicia sesión para sincronizar tus preferencias.'
                    : 'Modo demostración: configura supabase-config.js para activar login y base de datos.');
        }

        // Rellenar el formulario de contacto con los datos del perfil
        if (correo) {
            const meta = (session.user.user_metadata) || {};
            const nombre = document.getElementById('campo-nombre');
            const apellidos = document.getElementById('campo-apellidos');
            const correoInput = document.getElementById('campo-correo');
            if (nombre && !nombre.value && meta.nombre) nombre.value = meta.nombre;
            if (apellidos && !apellidos.value && meta.apellidos) apellidos.value = meta.apellidos;
            if (correoInput && !correoInput.value) correoInput.value = correo;
        }
    }

    if (DB && DB.listo) {
        DB.sesion().then(actualizarUIUsuario).catch(() => actualizarUIUsuario(null));
        DB.onAuthChange(actualizarUIUsuario);

        const formLogin = document.getElementById('form-login');
        if (formLogin) {
            formLogin.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value;
                if (!email || !password) return mensajeLogin('Completa el correo y la contraseña.', 'error');
                const boton = document.getElementById('btn-login-submit');
                boton.disabled = true;
                mensajeLogin('Iniciando sesión…');
                const { error } = await DB.iniciarSesion(email, password);
                boton.disabled = false;
                if (error) return mensajeLogin(errorAuth(error), 'error');
                mensajeLogin('¡Bienvenido! Redirigiendo…');
                setTimeout(() => {
                    const modal = document.getElementById('modalLogin');
                    if (modal && typeof bootstrap !== 'undefined') {
                        bootstrap.Modal.getOrCreateInstance(modal).hide();
                    }
                }, 700);
            });
        }

        const formRegistro = document.getElementById('form-registro');
        if (formRegistro) {
            formRegistro.addEventListener('submit', async (e) => {
                e.preventDefault();
                const nombre = document.getElementById('registro-nombre').value.trim();
                const apellidos = document.getElementById('registro-apellidos').value.trim();
                const email = document.getElementById('registro-email').value.trim();
                const password = document.getElementById('registro-password').value;
                if (!nombre || !email || !password) {
                    return mensajeLogin('Completa nombre, correo y contraseña.', 'error');
                }
                const boton = document.getElementById('btn-registro-submit');
                boton.disabled = true;
                mensajeLogin('Creando cuenta…');
                const { data, error } = await DB.crearCuenta(email, password, nombre, apellidos);
                boton.disabled = false;
                if (error) return mensajeLogin(errorAuth(error), 'error');
                mensajeLogin(data && data.session
                    ? '¡Cuenta creada e iniciada!'
                    : 'Cuenta creada. Revisa tu correo para confirmarla.', 'ok');
            });
        }

        const botonSalir = document.getElementById('btnLogout');
        if (botonSalir) {
            botonSalir.addEventListener('click', async () => {
                await DB.cerrarSesion();
                actualizarUIUsuario(null);
                mensajeLogin('Sesión cerrada.');
            });
        }
    } else {
        actualizarUIUsuario(null);
    }

    /* Catálogo desde Supabase: se usa si hay datos; si falla, queda el local */
    async function sincronizarCatalogo() {
        if (!DB || !DB.listo) return;
        try {
            const datos = await DB.cargarCatalogo();
            if (!datos) return;

            if (datos.artistas.length && datos.canciones.length) {
                const remoto = {};
                datos.artistas.forEach(a => {
                    remoto[a.clave] = {
                        nombre: a.nombre,
                        genero: a.genero_texto,
                        foto: a.foto,
                        descripcion: a.descripcion,
                        top10: datos.canciones
                            .filter(c => c.artista_id === a.id)
                            .sort((x, y) => x.rank - y.rank)
                            .map(c => ({ rank: c.rank, titulo: c.titulo, album: c.album, tipo: c.tipo }))
                    };
                });
                Object.keys(catalogoMusica).forEach(k => delete catalogoMusica[k]);
                Object.assign(catalogoMusica, remoto);
            }

            if (datos.juegos.length) {
                datos.juegos.forEach(j => {
                    const tarjeta = Array.prototype.find.call(document.querySelectorAll('.game-card'), card => {
                        const img = card.querySelector('img');
                        if (!img) return false;
                        const archivo = (img.getAttribute('src') || '').split('/').pop();
                        return archivo.replace(/\.[^.]+$/, '').toLowerCase() === j.clave;
                    });
                    if (!tarjeta) return;
                    tarjeta.dataset.categoria = j.categoria;
                    const img = tarjeta.querySelector('img');
                    if (img) { img.src = j.imagen; img.alt = j.nombre; }
                    const titulo = tarjeta.querySelector('h6');
                    if (titulo) titulo.textContent = j.nombre;
                    const parrafo = tarjeta.querySelector('p');
                    if (parrafo) parrafo.textContent = j.descripcion;
                });
            }
            console.info('[Supabase] Catálogo sincronizado desde la base de datos.');
        } catch (error) {
            console.info('[Supabase] Se conserva el catálogo local:', error.message);
        }
    }
    sincronizarCatalogo();

})
$(document).ready(function() {

    /* ===============================================================
       7. HIDRATACIÓN (PÁGINA + PWA) Y BOTÓN REFRESCAR CON FEEDBACK
       Los botones llegan "estáticos" (data-hidratado="false") y, tras
       la carga, se activan sin redibujar el DOM.
       =============================================================== */
    let toastTimer = null;
    let refreshTimer = null;

    // Aviso flotante reutilizable (un único elemento, un único temporizador)
    function mostrarToast(texto, ms) {
        let $t = $('#toast-hidratacion');
        if (!$t.length) {
            $t = $('<div id="toast-hidratacion" class="toast-hidratacion" role="status" aria-live="polite"></div>').appendTo('body');
        }
        $t.text(texto);
        void $t[0].offsetWidth; // reinicia la transición
        $t.addClass('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { $t.removeClass('visible'); }, ms || 2200);
    }

    function leerSesion(clave) { try { return sessionStorage.getItem(clave); } catch (e) { return null; } }
    function guardarSesion(clave, valor) { try { sessionStorage.setItem(clave, valor); } catch (e) {} }

    // --- Click en refrescar: se nota el giro, el aviso y el contador ---
    function alHacerRefresh(e) {
        e.preventDefault();
        const $btn = $('#btnRefrescar');
        if ($btn.hasClass('refrescando')) return; // evita doble click

        const n = (parseInt(leerSesion('contadorRefrescos'), 10) || 0) + 1;
        guardarSesion('contadorRefrescos', String(n));
        guardarSesion('refrescoPendiente', '1');

        $btn.addClass('refrescando').attr('aria-busy', 'true');
        mostrarToast('🔄 Refrescando… (refresco #' + n + ')', 1500);
        console.log('Refresco #' + n + ': recargando la página');

        refreshTimer = setTimeout(function () { location.reload(); }, 800);
    }

    // --- Hidratación de la página ---
    function hidratarInterfaz() {
        const $box = $('#contenedorMenu');
        if ($box.attr('data-hidratado') === 'true') return; // una sola vez

        // Limpieza explícita antes de volver a asignar (evita listeners duplicados)
        $(document).off('click.hidratacion', '#btnRefrescar');
        $(document).on('click.hidratacion', '#btnRefrescar', alHacerRefresh);

        $('#btnRefrescar').attr({ 'aria-label': 'Refrescar página', title: 'Refrescar página' });

        // Aviso en cada click de cualquier botón (delegado; .off() previo)
        let totalClicks = 0;
        $(document).off('click.avisoBoton', 'button');
        $(document).on('click.avisoBoton', 'button', function () {
            if (this.id === 'btnRefrescar') return; // el refresh tiene su propio aviso
            if (this.getAttribute('data-hidratado') !== 'true') return;
            totalClicks++;
            mostrarToast('✅ Página refrescada (#' + totalClicks + ')', 1600);
        });

        // Hidratar TODOS los botones de la página
        $('button[data-hidratado="false"]').attr('data-hidratado', 'true');
        $box.attr('data-hidratado', 'true');
        $('body').attr('data-hidratado', 'true');

        if (leerSesion('refrescoPendiente') === '1') {
            guardarSesion('refrescoPendiente', '0');
            mostrarToast('✅ Página refrescada (refresco #' + (leerSesion('contadorRefrescos') || 1) + ')', 2500);
        } else {
            mostrarToast('✅ Interfaz hidratada', 1800);
        }
    }

    // --- Hidratación del PWA: service worker, versión, conexión y modo app ---
    function hidratarPWA() {
        if ($('body').attr('data-pwa') === 'true') return; // una sola vez
        $('body').attr('data-pwa', 'true');

        const modoApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        $('body').attr('data-modo', modoApp ? 'app-instalada' : 'navegador');

        // Conexión: listeners con nombre de evento + .off() previo
        $(window).off('online.pwa offline.pwa')
            .on('online.pwa', function () { mostrarToast('📶 De nuevo en línea', 2000); })
            .on('offline.pwa', function () { mostrarToast('📴 Sin conexión (modo offline)', 2500); });

        if (!('serviceWorker' in navigator)) return;

        const habiaControlador = !!navigator.serviceWorker.controller;

        // Mensajes del service worker (se quita antes de añadir)
        function alMensajeSW(ev) {
            if (ev.data && ev.data.type === 'SW_VERSION') {
                $('body').attr('data-sw', ev.data.cache);
                mostrarToast('📲 PWA hidratada · ' + ev.data.cache, 2500);
            }
        }
        navigator.serviceWorker.removeEventListener('message', alMensajeSW);
        navigator.serviceWorker.addEventListener('message', alMensajeSW);

        // Si se activa una versión nueva del SW, se avisa y se refresca
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!habiaControlador) return; // primera instalación: no recargar
            mostrarToast('⬆️ Nueva versión instalada. Refrescando…', 1500);
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(function () { location.reload(); }, 1200);
        });

        navigator.serviceWorker.ready.then(function (reg) {
            if (reg.active) reg.active.postMessage('GET_VERSION');
        });
    }

    setTimeout(hidratarInterfaz, 500);
    setTimeout(hidratarPWA, 900);

    // Limpieza de temporizadores al salir (previene fugas)
    $(window).off('pagehide.hidratacion').on('pagehide.hidratacion', function () {
        clearTimeout(toastTimer);
        clearTimeout(refreshTimer);
    });
});
