# Rematrícula 2027 do CEV

Mini-app do Joel (marketing/gestão do Centro Educacional Vencedores, Manaus) para acompanhar a campanha de rematrícula 2027. Fale com ele em português do Brasil, direto, com personalidade e sem jargão técnico.

## Regras da campanha
- 54 famílias (57 alunos ativos em 2026). Meta: 100% com vaga reservada até 31/10 e paga até 30/11.
- Outubro só reserva a vaga, **sem cobrar**. Pagamento de 1º a 30/11 com a condição de Black Friday.
- Abordagem 19 a 23/10, terceira rodada 26 a 30/10, lembrete único 31/10.
- Valores não aparecem em posts. Fatos sobre a escola: só o que o Joe disse.

## Código
- Vite + React + TypeScript + Supabase. `src/lib.ts` tem as regras (etapas, "Hoje", metas), `src/acoes.ts` grava, `src/data.ts` lê.
- Segurança: RLS por `current_pessoa_is_admin()`, histórico só leitura e inserção, nada de `service_role` no front, nada de nome ou telefone em log.
- Mudança de banco: nova migração em `supabase/migrations/`.

## Estado atual
Versão 1 pronta (14/10/2026): Hoje, Todas (risco), Painel básico e Família. Pendente: publicar, criar/definir o login, versão 2 (gráfico por dia, paradas, relatório) e versão 3 (n8n e Asaas). Pendências do Joe: remanejados do 3º ano e 4º ano, valores do Integral, preço dos livros, classificar o risco das 54 famílias.
