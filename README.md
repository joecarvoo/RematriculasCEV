# Rematrícula 2027 · CEV

Painel para o Joel acompanhar, todo dia, a campanha de rematrícula 2027 do Centro Educacional Vencedores: registrar cada contato com as 54 famílias e ver quanto falta para a meta. Feito para o celular.

## O que a versão 1 faz
- **Hoje:** famílias a abordar (sem contato, ou com retorno vencido/de hoje), vermelhas primeiro. Botão do WhatsApp, quatro toques (Contatado, Respondeu, Reserva, Pagou), anotação e data do próximo contato.
- **Todas:** busca e classificação de risco (verde, amarela, vermelha) numa lista só.
- **Painel:** contadores, barras de reserva (até 31/10) e de pagamento (até 30/11) e as metas por data.
- **Família:** histórico completo (nunca se apaga), risco e etiquetas.

Fica para a versão 2: gráfico por dia, famílias paradas há mais de 3 dias e relatório de 19 a 23/10. Versão 3: integração com a Danielle (n8n) e o Asaas.

## Como funciona
- Lê direto do Supabase (`rwimyzactkmouqzgabui`): alunos ativos em 2026, responsável financeiro e turno 2027 do WhatsApp. Não copia dados.
- Tabelas novas: `rematricula_familias` (54 linhas já importadas) e `rematricula_registros`. SQL em `supabase/migrations/`.
- Marcar uma etapa sobe as anteriores juntas (reserva implica contatada e respondeu). Desfazer uma etapa desfaz as seguintes e fica registrado no histórico.
- Datas sempre no horário de Manaus.

## Segurança (LGPD)
- Login obrigatório (Supabase Auth). As tabelas novas têm RLS: só quem é administrador no sistema (`current_pessoa_is_admin()`) lê ou grava. Hoje isso é só a conta da Coordenação.
- O histórico só aceita leitura e inserção, nunca edição nem exclusão.
- A chave usada no navegador é a *publishable*, que é pública por desenho. **Nunca** coloque a `service_role` aqui. Mensagens de erro não mostram nome nem telefone.

## Rodar
```bash
cp .env.example .env     # preencher VITE_SUPABASE_PUBLISHABLE_KEY (Supabase → Project Settings → API Keys)
npm install
npm run dev              # desenvolvimento
npm run build            # gera dist/ para publicar
```

## Publicar
Qualquer hospedagem de site estático (Vercel, Netlify, Cloudflare Pages): comando `npm run build`, pasta `dist`, e as duas variáveis do `.env.example` nas configurações do serviço. Depois, no Supabase (Authentication → URL Configuration), coloque o endereço publicado em *Site URL*.
