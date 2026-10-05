-- Esquema GymTrack para pegar en el editor SQL de Supabase (Database → SQL).
-- Tablas por usuario con RLS: cada cuenta solo ve lo suyo.
-- La fecha es tipo `date` (devuelve "YYYY-MM-DD" tal cual, sin problemas UTC).
-- El `id` es el mismo texto que genera la app, para que el ida y vuelta
-- conserve la identidad de cada sesión y plantilla.

create table if not exists sesiones (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  creada_en bigint not null,
  ejercicios jsonb not null default '[]',
  unique (user_id, fecha)
);

create table if not exists plantillas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  creada_en bigint not null,
  ejercicios jsonb not null default '[]'
);

-- Comidas de la dieta: varias por día (sin unique de fecha), nutrientes ya
-- calculados para los gramos registrados.
create table if not exists comidas (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  nombre text not null,
  gramos double precision not null,
  kcal double precision not null,
  carbos double precision not null,
  proteinas double precision not null,
  grasas double precision not null,
  creada_en bigint not null
);

-- Perfil del usuario: una fila por cuenta (user_id como clave).
create table if not exists perfiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  edad_anos double precision,
  estatura_cm double precision,
  peso_kg double precision,
  sexo text,
  actividad text,
  objetivo text,
  actualizada_en bigint not null
);

-- Alimentos personalizados ("mis alimentos"): los que el usuario mete a mano
-- o trae de online para reutilizar. El nombre manda: la app reemplaza el
-- que tenga el mismo nombre normalizado.
create table if not exists alimentos_custom (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  nombre text not null,
  kcal double precision not null,
  carbos double precision not null,
  proteinas double precision not null,
  grasas double precision not null,
  alias jsonb not null default '[]'
);

-- Columnas añadidas después: por si la tabla ya existía sin ellas.
alter table perfiles add column if not exists sexo text;
alter table perfiles add column if not exists actividad text;
alter table perfiles add column if not exists objetivo text;

alter table sesiones enable row level security;
alter table plantillas enable row level security;
alter table comidas enable row level security;
alter table perfiles enable row level security;
alter table alimentos_custom enable row level security;

-- Una sola política por tabla: todo permitido solo sobre lo propio.
drop policy if exists "todo lo propio" on sesiones;
create policy "todo lo propio" on sesiones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todo lo propio" on plantillas;
create policy "todo lo propio" on plantillas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todo lo propio" on comidas;
create policy "todo lo propio" on comidas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todo lo propio" on perfiles;
create policy "todo lo propio" on perfiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "todo lo propio" on alimentos_custom;
create policy "todo lo propio" on alimentos_custom
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
