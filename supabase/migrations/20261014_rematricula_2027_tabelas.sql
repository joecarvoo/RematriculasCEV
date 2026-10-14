-- Já aplicada no projeto rwimyzactkmouqzgabui em 14/10/2026. Guardada aqui como registro.
create table public.rematricula_familias (
  id uuid primary key default gen_random_uuid(),
  responsavel_id uuid not null unique references public.pessoas(id),
  risco text not null default 'verde' check (risco in ('verde','amarela','vermelha')),
  contatado_em timestamptz,
  respondeu_em timestamptz,
  reserva_confirmada_em timestamptz,
  pago_em timestamptz,
  proximo_contato date,
  observacao text,
  etiquetas text[] not null default '{}',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.rematricula_registros (
  id uuid primary key default gen_random_uuid(),
  familia_id uuid not null references public.rematricula_familias(id),
  criado_em timestamptz not null default now(),
  canal text not null check (canal in ('presencial','whatsapp','ligacao')),
  resultado text not null,
  nota text,
  proximo_contato date
);

create index rematricula_registros_familia_idx on public.rematricula_registros (familia_id, criado_em desc);

create or replace function public.rematricula_touch() returns trigger
language plpgsql set search_path = public as $$
begin new.atualizado_em := now(); return new; end $$;

create trigger rematricula_familias_touch before update on public.rematricula_familias
for each row execute function public.rematricula_touch();

alter table public.rematricula_familias enable row level security;
alter table public.rematricula_registros enable row level security;

create policy rematricula_familias_admin on public.rematricula_familias
  for all to authenticated
  using (public.current_pessoa_is_admin()) with check (public.current_pessoa_is_admin());

-- Histórico nunca se apaga nem se edita: só ler e inserir.
create policy rematricula_registros_admin_select on public.rematricula_registros
  for select to authenticated using (public.current_pessoa_is_admin());
create policy rematricula_registros_admin_insert on public.rematricula_registros
  for insert to authenticated with check (public.current_pessoa_is_admin());

-- Uma família por responsável financeiro dos alunos ativos de 2026 (esperado: 54).
insert into public.rematricula_familias (responsavel_id)
select distinct ra.responsavel_id
from public.matriculas m
join public.turmas t on t.id = m.turma_id
join public.anos_letivos al on al.id = t.ano_letivo_id
join public.responsaveis_alunos ra on ra.aluno_id = m.aluno_id and ra.responsavel_financeiro
where m.status = 'Ativo' and al.ano = 2026
on conflict (responsavel_id) do nothing;
