-- ============================================================
-- BASE DE DATOS SUPABASE - PRESENTACION 2.0 (JONA FRANCO)
-- Ejecutar este archivo completo en Supabase > SQL Editor > New query
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- 1. PERFILES (vinculados a auth.users) ----------
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  apellidos text not null default '',
  avatar_url text,
  rol text not null default 'visitante' check (rol in ('visitante', 'admin')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create or replace function public.handle_nuevo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, apellidos)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', ''),
                  coalesce(new.raw_user_meta_data->>'apellidos', ''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_nuevo_usuario();

-- ---------- 2. CONTACTOS (formulario) ----------
create table if not exists public.contactos (
  id bigint generated always as identity primary key,
  nombre text not null,
  apellidos text not null,
  correo text not null,
  telefono text not null,
  ciudad text not null,
  motivo text not null,
  prioridad text not null default 'Normal',
  asunto text not null,
  mensaje text not null,
  leido boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists contactos_creado_en_idx on public.contactos (creado_en desc);

-- ---------- 3. CATALOGO ----------
create table if not exists public.videojuegos (
  id bigint generated always as identity primary key,
  clave text not null unique,
  nombre text not null,
  categoria text not null check (categoria in ('battle-royale','shooter','moba','sandbox')),
  imagen text not null,
  descripcion text not null,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists public.artistas (
  id bigint generated always as identity primary key,
  clave text not null unique,
  nombre text not null,
  genero text not null,
  genero_texto text not null,
  foto text not null,
  descripcion text not null,
  orden int not null default 0,
  activo boolean not null default true
);

create table if not exists public.canciones (
  id bigint generated always as identity primary key,
  artista_id bigint not null references public.artistas(id) on delete cascade,
  rank int not null check (rank between 1 and 10),
  titulo text not null,
  album text not null,
  tipo text not null,
  unique (artista_id, rank)
);

-- ---------- 4. AUDITORIAS Y PREFERENCIAS ----------
create table if not exists public.auditorias (
  id bigint generated always as identity primary key,
  tipo text not null,
  detalle jsonb not null default '{}'::jsonb,
  usuario_id uuid references auth.users(id) on delete set null,
  creado_en timestamptz not null default now()
);

create table if not exists public.preferencias (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  tema text not null default 'dark' check (tema in ('dark','light')),
  contraste_alto boolean not null default false,
  actualizado_en timestamptz not null default now()
);

-- ---------- 5. ROW LEVEL SECURITY ----------
alter table public.perfiles enable row level security;
alter table public.contactos enable row level security;
alter table public.videojuegos enable row level security;
alter table public.artistas enable row level security;
alter table public.canciones enable row level security;
alter table public.auditorias enable row level security;
alter table public.preferencias enable row level security;

-- Perfiles: cada usuario ve y edita solo el suyo
create policy perfiles_select on public.perfiles for select using (auth.uid() = id);
create policy perfiles_update on public.perfiles for update using (auth.uid() = id);

-- Contactos: cualquiera puede enviar; solo autenticados pueden leer
create policy contactos_insert on public.contactos for insert to anon, authenticated with check (true);
create policy contactos_select on public.contactos for select to authenticated using (true);

-- Catalogo: lectura publica, escritura solo service_role
create policy videojuegos_select on public.videojuegos for select to anon, authenticated using (activo);
create policy artistas_select on public.artistas for select to anon, authenticated using (activo);
create policy canciones_select on public.canciones for select to anon, authenticated using (true);

-- Auditorias: cualquiera puede registrar; el usuario ve las suyas
create policy auditorias_insert on public.auditorias for insert to anon, authenticated with check (true);
create policy auditorias_select on public.auditorias for select to authenticated using (auth.uid() = usuario_id);

-- Preferencias: solo el dueno
create policy preferencias_all on public.preferencias for all to authenticated using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- ---------- 6. DATOS SEMILLA: VIDEOJUEGOS ----------
insert into public.videojuegos (clave, nombre, categoria, imagen, descripcion, orden) values
  ('fortnite', 'Fortnite', 'battle-royale', 'img/FORTNITE.jpg', 'Construcción, colaboraciones y partidas de 100 jugadores.', 0),
  ('warzone', 'Call of Duty: Warzone', 'battle-royale', 'img/warzone.jpg', 'Acción táctica en mapas enormes con escuadrones.', 1),
  ('shooter', 'Team Fortress 2', 'shooter', 'img/shooter.webp', 'Shooter por clases, gratuito en Steam, con mucho humor.', 2),
  ('mobil', 'Mobile Legends', 'moba', 'img/MOBIL.jpg', 'Batallas 5v5 en el celular con héroes y estrategia.', 3),
  ('mine', 'Minecraft', 'sandbox', 'img/mine.jpg', 'Construcción, exploración y aventuras en mundos de bloques.', 4),
  ('roblox', 'Roblox', 'sandbox', 'img/roblox.jpg', 'Millones de mundos creados por la comunidad.', 5);

-- ---------- 7. DATOS SEMILLA: ARTISTAS Y TOP 10 ----------
insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('jose-jose', 'José José', 'balada', 'Balada Romántica & Bolero Clásico', 'img/joase.png', 'Conocido mundialmente como ''El Príncipe de la Canción'', referente indiscutible de la balada en español durante los años 70s y 80s.', 0) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'El Triste', 'El Triste (1970)', 'Clásico Inmortal' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Almohada', 'Reencuentro (1978)', 'Balada Oro' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Amar y Querer', 'Reencuentro (1977)', 'Romántica' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Gavilán o Paloma', 'Reencuentro (1977)', 'Éxito Radial' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Lo Pasado, Pasado', 'Lo Pasado, Pasado (1978)', 'Himno' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', '40 y 20', '40 y 20 (1992)', 'Balada Pop' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'La Nave del Olvido', 'La Nave del Olvido (1970)', 'Clásico' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Si Me Dejas Ahora', 'Si Me Dejas Ahora (1979)', 'Melancólico' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Buenos Días Amor', 'Reencuentro (1977)', 'Romance' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Desesperado', 'Mi Vida (1982)', 'Éxito 80s' from public.artistas where clave = 'jose-jose' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('luis-miguel', 'Luis Miguel', 'balada', 'Balada Romántica & Pop Latino', 'img/luis.jpg', '''El Sol de México''. Virtuoso vocalista con una carrera repleta de discos de platino, boleros magistrales y pop bailable.', 1) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'La Incondicional', 'Busca una Mujer (1988)', 'Himno Pop 80s' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Culpable o No', 'Busca una Mujer (1988)', 'Balada Emotiva' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Hasta Que Me Olvides', 'Aries (1993)', 'Balada Clásica' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Ahora Te Puedes Marchar', 'Soy Como Quiero Ser (1987)', 'Dance Pop 80s' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Tengo Todo Excepto a Ti', '20 Años (1990)', 'Balada' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Sabor a Mí', 'Romances (1997)', 'Bolero Magistral' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Entrégate', '20 Años (1990)', 'Pop Balada' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Suave', 'Aries (1993)', 'Funk Latino' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Por Debajo de la Mesa', 'Romances (1997)', 'Bolero' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Cuando Calienta el Sol', 'Soy Como Quiero Ser (1987)', 'Clásico Verano' from public.artistas where clave = 'luis-miguel' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('frank-sinatra', 'Frank Sinatra', 'jazz', 'Classic Jazz & Big Band', 'img/sinatra.jpg', '''La Voz''. Leyenda universal de la música del siglo XX que definió la elegancia vocal, el swing y la era dorada de las orquestas.', 2) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'My Way', 'My Way (1969)', 'Himno Legendario' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Fly Me to the Moon', 'It Might as Well Be Swing (1964)', 'Swing Clásico' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Theme from New York, New York', 'Trilogy (1980)', 'Big Band' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Strangers in the Night', 'Strangers in the Night (1966)', 'Balada Jazz' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'That''s Life', 'That''s Life (1966)', 'Blues / Swing' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'I''ve Got You Under My Skin', 'Songs for Swingin'' Lovers! (1956)', 'Swing Masterpiece' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'The Way You Look Tonight', 'Sinatra Sings Days of Wine and Roses (1964)', 'Romántico' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Come Fly with Me', 'Come Fly with Me (1958)', 'Jazz Estándar' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Summer Wind', 'Strangers in the Night (1966)', 'Vocal Jazz' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Night and Day', 'A Swingin'' Affair! (1957)', 'Swing Orquestal' from public.artistas where clave = 'frank-sinatra' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('bruno-mars', 'Bruno Mars', 'pop', 'Pop / Funk / R&B', 'img/bruno.jpg', 'Productor y compositor contemporáneo reconocido por revitalizar el sonido funk retro de los 80s con una energía escénica descomunal.', 3) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', '24K Magic', '24K Magic (2016)', 'Funk Neón' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Uptown Funk (ft. Mark Ronson)', 'Uptown Special (2014)', 'Mega Hit Mundial' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'When I Was Your Man', 'Unorthodox Jukebox (2012)', 'Balada Piano' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Locked Out of Heaven', 'Unorthodox Jukebox (2012)', 'Pop Rock / New Wave' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Just the Way You Are', 'Doo-Wops & Hooligans (2010)', 'Romántico Pop' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'That''s What I Like', '24K Magic (2016)', 'R&B / Groove' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Leave The Door Open (Silk Sonic)', 'An Evening with Silk Sonic (2021)', 'Soul 70s / R&B' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Treasure', 'Unorthodox Jukebox (2012)', 'Disco Funk' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Versace on the Floor', '24K Magic (2016)', 'Balada Slow Jam 80s' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Grenade', 'Doo-Wops & Hooligans (2010)', 'Pop Dramático' from public.artistas where clave = 'bruno-mars' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('michael-jackson', 'Michael Jackson', 'pop', 'Pop & Synthpop Ochentero', 'img/michael.jpg', '''El Rey del Pop''. El artista más influyente de la historia musical, ícono indiscutible de la década de los 80s con álbumes revolucionarios.', 4) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Billie Jean', 'Thriller (1982)', 'Obra Maestra 80s' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Thriller', 'Thriller (1982)', 'Videoclip Épico' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Beat It', 'Thriller (1982)', 'Hard Rock / Pop' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Smooth Criminal', 'Bad (1987)', 'Groove Rápido' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Man in the Mirror', 'Bad (1987)', 'Gospel Pop' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Bad', 'Bad (1987)', 'Funk Rock 80s' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Don''t Stop ''Til You Get Enough', 'Off the Wall (1979)', 'Disco Funk' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Black or White', 'Dangerous (1991)', 'Rock Pop' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Rock with You', 'Off the Wall (1979)', 'R&B Clásico' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'The Way You Make Me Feel', 'Bad (1987)', 'Rhythm Pop' from public.artistas where clave = 'michael-jackson' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('the-weeknd', 'The Weeknd', 'synth', 'Synthwave & R&B Alternativo', 'img/weekend.jpg', 'Vocalista canadiense que ha fusionado la estética synthwave ochentera con el R&B moderno, batiendo récords globales.', 5) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Blinding Lights', 'After Hours (2020)', 'Synthwave Puro' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Starboy (ft. Daft Punk)', 'Starboy (2016)', 'Electro R&B' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Save Your Tears', 'After Hours (2020)', 'Pop Ochentero' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'The Hills', 'Beauty Behind the Madness (2015)', 'Dark R&B' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Can''t Feel My Face', 'Beauty Behind the Madness (2015)', 'Funk Pop' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'I Feel It Coming', 'Starboy (2016)', 'Disco Soul' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Out of Time', 'Dawn FM (2022)', 'City Pop / R&B' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'In Your Eyes', 'After Hours (2020)', 'Saxofón Synth' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Die for You', 'Starboy (2016)', 'Balada Emotiva' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Call Out My Name', 'My Dear Melancholy (2018)', 'Slow R&B' from public.artistas where clave = 'the-weeknd' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('mora', 'Mora', 'urbano', 'Urbano / Melodic Trap', 'img/mora.jpg', 'Productor y compositor puertorriqueño caracterizado por melodías profundas, baterías espaciadas y sintetizadores envolventes.', 6) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Memorias (con Jhayco)', 'MicroDosis (2022)', 'Éxito Urbano' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Volando (Remix con Bad Bunny & Sech)', 'Primer Día de Clases (2021)', 'Mega Hit' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'LA INOCENTE (con Feid)', 'MicroDosis (2022)', 'Reggaetón Melódico' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Tuyo', 'Primer Día de Clases (2021)', 'Sentimental' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', '512 (con Jhayco)', 'Primer Día de Clases (2021)', 'Perreo Fino' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'APARECISTE', 'PARAÍSO (2022)', 'Synth Urbano' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'MODELITO (con YOVNGCHIMI)', 'PARAÍSO (2022)', 'Trap Rápido' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'CASUALIDAD', 'ESTRELLA (2023)', 'Melódico' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'REINA (con Saiko)', 'ESTRELLA (2023)', 'Urbano Chill' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'QUE HABILIDAD', 'Primer Día de Clases (2021)', 'Flow Nocturno' from public.artistas where clave = 'mora' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('yan-block', 'Yan Block', 'urbano', 'Trap Latino / Underground', 'img/yan.jpg', 'Exponente boricua del trap melódico con rimas introspectivas, relatos crudos de superación y ritmos contundentes.', 7) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Estrellas y Satélites', 'Sencillo (2022)', 'Trap Lírico' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'El Mismo de Antes', 'Sencillo (2021)', 'Introspectivo' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Freestyle Real', 'Underground (2022)', 'Barras Puras' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Noche Fría', 'Sencillo (2020)', 'Trap Melancólico' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Desvelo', 'Sencillo (2021)', 'Nocturno' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Código 10', 'Sencillo (2022)', 'Colaboración' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Luna Llena', 'Sencillo (2023)', 'Melódico' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Sentimientos', 'Sencillo (2021)', 'Sensible' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'En la Mía', 'Sencillo (2022)', 'Flow Callejero' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Racks', 'Sencillo (2023)', 'Trap Pesado' from public.artistas where clave = 'yan-block' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('bad-bunny', 'Bad Bunny', 'urbano', 'Reggaetón & Urbano Global', 'img/badBunny.jpg', 'Fenómeno global puertorriqueño, récord indiscutible de streaming en Spotify e impulsor de la cultura latina contemporánea.', 8) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Tití Me Preguntó', 'Un Verano Sin Ti (2022)', 'Dembow / Éxito Global' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Me Porto Bonito (con Chencho)', 'Un Verano Sin Ti (2022)', 'Reggaetón Pesado' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Ojitos Lindos (con Bomba Estéreo)', 'Un Verano Sin Ti (2022)', 'Indie Urbano' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Dákiti (con Jhayco)', 'El Último Tour Del Mundo (2020)', 'Afrobeat Pop' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Safaera', 'YHLQMDLG (2020)', 'Medley Clásico' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Yo Perreo Sola', 'YHLQMDLG (2020)', 'Himno Bailable' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Mónaco', 'Nadie Sabe Lo Que Va A Pasar Mañana (2023)', 'Trap Sinfónico' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'La Canción (con J Balvin)', 'OASIS (2019)', 'Melancólico' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Callaíta', 'Sencillo (2019)', 'Verano Clásico' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Efecto', 'Un Verano Sin Ti (2022)', 'Reggaetón Cósmico' from public.artistas where clave = 'bad-bunny' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('josean-log', 'Josean Log', 'indie', 'Indie Pop & Folk Acústico', 'img/josean.jpg', 'Cantautor mexicano que transmite serenidad, optimismo y calidez a través de armonías con ukelele y letras honestas.', 9) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Chapa de Bombón', 'Háblame de Tú (2016)', 'Ukelele Alegre' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Beso', 'Háblame de Tú (2018)', 'Romántico Acústico' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Tierra', 'Háblame de Tú (2016)', 'Folk Serena' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'La Vida Es un Ratico', 'El Futuro (2019)', 'Filosofía Positiva' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Jacaranda', 'Háblame de Tú (2016)', 'Poesía Musical' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Combustión', 'Háblame de Tú (2018)', 'Calidez Acústica' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Alguien Como Tú', 'El Futuro (2019)', 'Sensible' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Doma', 'Háblame de Tú (2018)', 'Suave' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Canción sin Nombre', 'Sencillo (2020)', 'Reflexión' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Si Fuera Tú', 'Sencillo (2021)', 'Indie Acústico' from public.artistas where clave = 'josean-log' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('kevin-kaarl', 'Kevin Kaarl', 'indie', 'Indie Folk & Balada Acústica', 'img/kevin.jpg', 'Voz profunda y melancólica desde Chihuahua, México. Sus composiciones acústicas tocan fibras profundas de nostalgia y amor.', 10) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'San Lucas', 'San Lucas (2019)', 'Himno Indie Folk' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Vámonos a Marte', 'Hasta el Fin del Mundo (2019)', 'Balada Espacial' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Colapso', 'San Lucas (2020)', 'Nostalgia Pura' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Toda Esta Ciudad', 'Sencillo (2021)', 'Guitarra Solitaria' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Si Supieras', 'Hasta el Fin del Mundo (2019)', 'Romance Acústico' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Como Me Encanta', 'París Texas (2022)', 'Folk Alternativo' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Te Quiero Tanto', 'París Texas (2022)', 'Poesía Vocal' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Abrazado a Ti', 'San Lucas (2020)', 'Intimista' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Siente Más', 'París Texas (2022)', 'Indie Profundo' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Amor Viejo', 'Hasta el Fin del Mundo (2018)', 'Acústico' from public.artistas where clave = 'kevin-kaarl' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('ed-maverick', 'Ed Maverick', 'rock', 'Folk Rock & Sad Boy Latino', 'img/ed.jpg', 'Uno de los fenómenos más auténticos de la música indie hispana, conocido por sus letras directas y rasgueos viscerales.', 11) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Fuentes de Ortiz', 'Mix Pa Llorar en Tu Cuarto (2018)', 'Éxito Viral' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Acurrucar', 'Mix Pa Llorar en Tu Cuarto (2018)', 'Melancólico' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Ropa de Bazar', 'Mix Pa Llorar en Tu Cuarto (2018)', 'Acústico Sentido' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Quiero', 'Mix Pa Llorar en Tu Cuarto (2018)', 'Sinceridad Lírica' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Siempre Estoy Pa Ti', 'Transiciones (2019)', 'Folk Moderno' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Karpe Diem', 'Mix Pa Llorar en Tu Cuarto (2018)', 'Juventud' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'tierrita mojada', 'eduardo (2021)', 'Folk Experimental' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'niño', 'eduardo (2021)', 'Introspectivo' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'nos queda mucho dolor por recorrer', 'eduardo (2021)', 'Guitarra Cruda' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'gente', 'eduardo (2021)', 'Folk Rock' from public.artistas where clave = 'ed-maverick' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('queen', 'Queen', 'rock', 'Rock Legendario & 80s Rock', 'img/queen.jpg', 'Banda británica inmortal liderada por Freddie Mercury. Pioneros de los sintetizadores y estadios llenos en los 80s.', 12) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Bohemian Rhapsody', 'A Night at the Opera (1975)', 'Ópera Rock Suprema' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Don''t Stop Me Now', 'Jazz (1978)', 'Energía Pura' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Another One Bites the Dust', 'The Game (1980)', 'Funk Rock 80s' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Radio Ga Ga', 'The Works (1984)', 'Synthpop / Live Aid' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Under Pressure (con David Bowie)', 'Hot Space (1981)', 'Colaboración Histórica' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'I Want to Break Free', 'The Works (1984)', 'Sintetizadores 80s' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'We Will Rock You', 'News of the World (1977)', 'Himno de Estadios' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'We Are the Champions', 'News of the World (1977)', 'Himno de Victoria' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Somebody to Love', 'A Day at the Races (1976)', 'Gospel Rock' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'The Show Must Go On', 'Innuendo (1991)', 'Fuerza y Emoción' from public.artistas where clave = 'queen' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('soda-stereo', 'Soda Stereo', 'rock', 'Rock en Español / New Wave 80s', 'img/soda.jpg', 'El trío argentino de Gustavo Cerati que revolucionó América Latina en los años 80 con sonido New Wave y post-punk elegante.', 13) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'De Música Ligera', 'Canción Animal (1990)', 'Himno del Rock Latino' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Cuando Pase el Temblor', 'Nada Personal (1985)', 'Carnavalito New Wave' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'Persiana Americana', 'Signos (1986)', 'Clásico Ochentero' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'En la Ciudad de la Furia', 'Doble Vida (1988)', 'Atmósfera Oscura' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Nada Personal', 'Nada Personal (1985)', 'Pop Rock 80s' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Prófugos', 'Signos (1986)', 'Bajo Electrizante' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Trátame Suavemente', 'Soda Stereo (1984)', 'Balada Icónica' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Signos', 'Signos (1986)', 'Guitarras Limpias' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Sobredosis de TV', 'Soda Stereo (1984)', 'Ska New Wave' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Te Hacen Falta Vitaminas', 'Soda Stereo (1984)', 'Ritmo Rápido 80s' from public.artistas where clave = 'soda-stereo' on conflict (artista_id, rank) do nothing;

insert into public.artistas (clave, nombre, genero, genero_texto, foto, descripcion, orden) values ('aha-synthwave', 'A-ha & Depeche Mode', 'synth', 'Synthpop Ochentero & Retro Wave', 'img/a_ha.jpg', 'Pioneros absolutos del uso de sintetizadores y cajas de ritmo electrónicas que marcaron la identidad sonora de 1980 a 1990.', 14) on conflict (clave) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '1', 'Take On Me (A-ha)', 'Hunting High and Low (1985)', 'Synthpop Inmortal' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '2', 'Enjoy the Silence (Depeche Mode)', 'Violator (1990)', 'Dark Synth' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '3', 'The Sun Always Shines on T.V. (A-ha)', 'Hunting High and Low (1985)', 'Épico Ochentero' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '4', 'Personal Jesus (Depeche Mode)', 'Violator (1989)', 'Electro Blues' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '5', 'Just Can''t Get Enough (Depeche Mode)', 'Speak & Spell (1981)', 'Early Synth' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '6', 'Hunting High and Low (A-ha)', 'Hunting High and Low (1985)', 'Balada Electrónica' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '7', 'Never Let Me Down Again (Depeche Mode)', 'Music for the Masses (1987)', 'Himno Electro' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '8', 'Strangelove (Depeche Mode)', 'Music for the Masses (1987)', 'Synth Dance' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '9', 'Policy of Truth (Depeche Mode)', 'Violator (1990)', 'Groove Electrónico' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;
insert into public.canciones (artista_id, rank, titulo, album, tipo) select id, '10', 'Crying in the Rain (A-ha)', 'East of the Sun (1990)', 'Melódico Synth' from public.artistas where clave = 'aha-synthwave' on conflict (artista_id, rank) do nothing;

