-- Já aplicadas em 14/10/2026 (rematricula_2027_mensagens e rematricula_2027_mensagens_unico).
create table public.rematricula_mensagens (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.rematricula_familias(id),
  direcao text not null check (direcao in ('enviada','recebida')),
  tipo text,
  texto text not null,
  evolution_id text,
  status text not null default 'enviada' check (status in ('enviada','entregue','lida','falhou','recebida')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index rematricula_mensagens_evolution_idx on public.rematricula_mensagens (evolution_id) where evolution_id is not null;
alter table public.rematricula_mensagens add constraint rematricula_mensagens_evolution_id_key unique (evolution_id);
create index rematricula_mensagens_familia_idx on public.rematricula_mensagens (familia_id, criado_em desc);

alter table public.rematricula_mensagens enable row level security;
create policy rematricula_mensagens_admin_select on public.rematricula_mensagens
  for select to authenticated using (public.current_pessoa_is_admin());
create policy rematricula_mensagens_admin_insert on public.rematricula_mensagens
  for insert to authenticated with check (public.current_pessoa_is_admin() and direcao = 'enviada');

-- Só o servidor lê (sem policy). Guarda o token do webhook (valor inserido à parte, nunca no repositório).
create table public.rematricula_config (chave text primary key, valor text not null);
alter table public.rematricula_config enable row level security;
