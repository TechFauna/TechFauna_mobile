-- TechFauna Supabase schema
-- Execute inside your Supabase SQL editor or psql shell.

create extension if not exists "uuid-ossp";

-- Generic trigger to keep updated_at columns fresh.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------------------------------
-- Areas & Recintos
-- -----------------------------------------------------------------------------

create table if not exists public.areas (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_areas_updated_at
before update on public.areas
for each row execute procedure public.set_updated_at();

create table if not exists public.enclosures (
  id uuid primary key default uuid_generate_v4(),
  area_id uuid references public.areas(id) on delete set null,
  name text not null,
  code text unique,
  environment_type text,
  capacity integer check (capacity is null or capacity >= 0),
  status text not null default 'ativo',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_enclosures_area on public.enclosures(area_id);

create trigger trg_enclosures_updated_at
before update on public.enclosures
for each row execute procedure public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Species & Animals
-- -----------------------------------------------------------------------------

create table if not exists public.species (
  id uuid primary key default uuid_generate_v4(),
  common_name text not null unique,
  scientific_name text,
  conservation_status text,
  diet text,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_species_updated_at
before update on public.species
for each row execute procedure public.set_updated_at();

create table if not exists public.animals (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  identifier text unique,
  species_id uuid references public.species(id) on delete set null,
  current_enclosure_id uuid references public.enclosures(id) on delete set null,
  sex text,
  birthdate date,
  arrival_date date,
  status text not null default 'ativo',
  notes text,
  photo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_animals_species on public.animals(species_id);
create index if not exists idx_animals_enclosure on public.animals(current_enclosure_id);

create trigger trg_animals_updated_at
before update on public.animals
for each row execute procedure public.set_updated_at();

create table if not exists public.animal_enclosure_history (
  id uuid primary key default uuid_generate_v4(),
  animal_id uuid not null references public.animals(id) on delete cascade,
  from_enclosure_id uuid references public.enclosures(id) on delete set null,
  to_enclosure_id uuid references public.enclosures(id) on delete set null,
  moved_at timestamptz not null default timezone('utc', now()),
  notes text
);

create index if not exists idx_animal_history_animal on public.animal_enclosure_history(animal_id);
create index if not exists idx_animal_history_moved_at on public.animal_enclosure_history(moved_at desc);

-- -----------------------------------------------------------------------------
-- Checklist Templates
-- -----------------------------------------------------------------------------

create table if not exists public.checklist_templates (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  frequency text not null default 'daily' check (frequency in ('daily','weekly','monthly','custom')),
  target_type text check (target_type in ('enclosure','species')),
  target_id uuid,
  instructions text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_templates_updated_at
before update on public.checklist_templates
for each row execute procedure public.set_updated_at();

create table if not exists public.checklist_template_items (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  description text not null,
  requires_photo boolean not null default false,
  instructions text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_template_items_template on public.checklist_template_items(template_id, sort_order);

-- -----------------------------------------------------------------------------
-- Tasks & Dependencies
-- -----------------------------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  checklist_template_id uuid references public.checklist_templates(id) on delete set null,
  enclosure_id uuid references public.enclosures(id) on delete set null,
  species_id uuid references public.species(id) on delete set null,
  due_at timestamptz,
  status text not null default 'pending' check (status in ('pending','blocked','completed')),
  priority text not null default 'media' check (priority in ('baixa','media','alta')),
  photo_required boolean not null default false,
  completion_photo_url text,
  completion_notes text,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_status on public.tasks(status);

create trigger trg_tasks_updated_at
before update on public.tasks
for each row execute procedure public.set_updated_at();

create table if not exists public.task_prerequisites (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  depends_on_task_id uuid not null references public.tasks(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint chk_prerequisite_self check (task_id <> depends_on_task_id),
  constraint uq_task_prerequisite unique (task_id, depends_on_task_id)
);

create index if not exists idx_prereq_depends on public.task_prerequisites(depends_on_task_id);

-- -----------------------------------------------------------------------------
-- Checklist Executions
-- -----------------------------------------------------------------------------

create table if not exists public.checklists (
  id uuid primary key default uuid_generate_v4(),
  template_id uuid references public.checklist_templates(id) on delete set null,
  performed_by uuid references auth.users(id) on delete set null,
  performed_at timestamptz not null default timezone('utc', now()),
  enclosure_id uuid references public.enclosures(id) on delete set null,
  species_id uuid references public.species(id) on delete set null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.checklist_items (
  id uuid primary key default uuid_generate_v4(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  template_item_id uuid references public.checklist_template_items(id) on delete set null,
  status text not null default 'completed' check (status in ('completed','attention','skipped')),
  remarks text,
  photo_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_checklist_items_checklist on public.checklist_items(checklist_id);

-- Optional helpers ------------------------------------------------------------

comment on table public.checklist_templates is
  'Templates de checklist. target_type + target_id permitem diferenciar recintos e especies.';

comment on table public.tasks is
  'Tarefas operacionais com relacionamentos para recintos, especies e templates.';

comment on table public.task_prerequisites is
  'Lista de dependencias entre tarefas para controle de ordem de execucao.';
