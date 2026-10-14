# Rematrícula 2027 · CEV

Painel para o Joel acompanhar, todo dia, a campanha de rematrícula 2027 do Centro Educacional Vencedores: registrar cada contato com as 54 famílias e ver quanto falta para a meta. Feito para o celular.

## O que a versão 1 faz
- **Hoje:** famílias a abordar (sem contato, ou com retorno vencido/de hoje), vermelhas primeiro. Botão do WhatsApp, quatro toques (Contatado, Respondeu, Reserva, Pagou), anotação e data do próximo contato.
- **Todas:** busca e classificação de risco (verde, amarela, vermelha) numa lista só.
- **Painel:** contadores, barras de reserva (até 31/10) e de pagamento (até 30/11) e as metas por data.
- **Família:** histórico completo (nunca se apaga), risco e etiquetas.

**Versão 2 (pronta):**
- **Painel:** anel Estatística, barras por etapa, **gráfico por dia** (toque num dia para ver os números; ciano e amarelo têm pouco contraste com o fundo, então os valores sempre aparecem escritos e há "Ver em tabela"), **famílias paradas há mais de 3 dias** e as metas.
- **Relatório** (19 a 23/10 ou tudo até hoje): por dia, por turma, motivos de hesitação (palavras-chave nas anotações: preço, turno, turma, outras escolas, decisão em família, transporte e mudança), quem ficou sem resposta e "Copiar resumo".
- Cores do gráfico validadas com o validador de paleta: separação entre as 4 cores boa (ΔE 18,6 para daltônicos); contraste de ciano e amarelo com o fundo abaixo de 3:1, compensado com valores escritos e tabela.
Versão 3: integração com a Danielle (n8n) e o Asaas.

## Envio do comunicado pelo WhatsApp (Evolution API)
O comunicado leva botões de resposta rápida (micro compromisso sobre o turno 2027) e cada toque vira uma ação no painel (ver CLAUDE.md). O botão verde do cartão chama a função `supabase/functions/enviar-whatsapp`, que monta o comunicado geral com o nome do responsável e do(s) aluno(s), manda pela Evolution, registra no histórico e marca a família como Contatada. A chave da Evolution fica só nos segredos do Supabase (Edge Functions → Secrets): `EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e, se a Evolution for a v1, `EVOLUTION_VERSION=1`. Nunca no site nem no repositório. Se a família já recebeu, o app pergunta antes de reenviar. Para testar sem enviar, a função aceita `simular: true`.

### Mensagens na tela da família
A função `enviar-whatsapp` guarda o texto enviado e o código da Evolution em `rematricula_mensagens`. A função `evolution-webhook` (sem login, protegida por um token na URL guardado em `rematricula_config`) recebe os avisos `MESSAGES_UPDATE` (entregue, lida) e `MESSAGES_UPSERT` (respostas) da instância `Cev`. Só grava resposta de quem é família da campanha, pelo final do telefone. A tela da família atualiza sozinha a cada 15 s. Para religar o aviso: `POST /webhook/set/Cev` na Evolution com a URL `.../functions/v1/evolution-webhook?t=<token>` e os eventos MESSAGES_UPSERT e MESSAGES_UPDATE.

## Design (sistema oficial Vencedores)
Fonte única: o design system **Vencedores** da conta do Joe (artefato "Vencedores" com 27 componentes). Os tokens oficiais estão copiados sem alteração em `src/tokens.css` (cores, fontes Sora e DM Sans, raios, sombra). Peças oficiais usadas: **Anel** (45% ciano, 25% azul, 20% índigo, 10% amarelo, com número sobre disco branco), **Estatística** (anel de progresso com ponto amarelo, no Painel), **Passos** (anel numerado e linha pontilhada azul, nas metas), **PilulaLogo**, forma circular do canto e a logo oficial intacta.
Cores de etapa, sempre nesta ordem (a do anel da logo): contatada ciano, respondeu azul, reserva índigo, paga amarelo. O verde do WhatsApp só aparece no botão de enviar.
Adaptações para celular (os componentes oficiais têm escala de slide de 1080 px): tamanhos menores, nada abaixo de 14 px, cantos 28 px em vez de 56 px. Fora do sistema, por necessidade: verde e vermelho funcionais para o risco, sempre com a palavra ao lado, e ícones de busca, voltar, sair e mais, que o sistema não tem.
Para ver as telas com famílias inventadas: `npm run dev` e abrir `/demo.html?tela=hoje|todas|painel|familia|login`. Essa página não entra no site publicado.

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
