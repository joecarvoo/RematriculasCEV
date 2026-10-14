-- Já aplicada em 14/10/2026. Só leitura, só para o administrador logado.
create policy preferencias_turno_2027_admin_select on public.preferencias_turno_2027
  for select to authenticated using (public.current_pessoa_is_admin());
