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

## Design
Sistema OFICIAL Vencedores (artefato "Vencedores", o que tem 27 componentes; existe outro com o mesmo nome, vazio: não usar). Tokens oficiais copiados sem alteração em `src/tokens.css`. Peças em `src/ui.tsx`: Anel (45/25/20/10, número sobre disco branco), Estatística, Forma (círculo), PilulaLogo, Icone. Não redesenhar nem reordenar os segmentos do anel. Etapas sempre ciano, azul, índigo, amarelo. Verde do WhatsApp só no botão de enviar. Nunca recolorir a logo. `/demo.html` mostra as telas com dados inventados, só em desenvolvimento.

## Envio pela Evolution
Função `enviar-whatsapp` (Supabase Edge Function, verify_jwt ligado, roda com a identidade de quem clicou). Texto do comunicado geral dentro dela. Segredos só no Supabase. Decisão do Joe (14/10/2026): a rematrícula sai pela instância `Cev` da Evolution, o número da secretaria, (92) 99433-9299, porque fica mais cômodo para os pais responderem ali. Matrículas novas continuam no (92) 99184-3095 (instância `mat`). Nunca testar envio real com telefone de família: usar `simular: true`.

## Mensagens e aviso da Evolution
Tabela `rematricula_mensagens` (enviadas e recebidas) e função `evolution-webhook`. O webhook da instância `Cev` aponta para ela (eventos MESSAGES_UPSERT e MESSAGES_UPDATE). O token fica só no banco (`rematricula_config`), nunca no repositório. O comunicado sai com **botões de resposta rápida** (Evolution v2.4.0, `/message/sendButtons`): 20 famílias com turno já informado recebem "Sim, pode manter / Quero mudar turno / Prefiro conversar"; as 34 sem turno recebem "Manhã / Tarde / Integral". Toque no botão marca "Respondeu" sozinho e registra no histórico; "mudar" e "conversar" também põem a família em "Hoje". Reserva NUNCA é marcada sozinha: o Joel confirma depois de conversar. Resposta digitada à mão só aparece na lista de mensagens. O app avisa antes de enviar para família vermelha ou especial (plano manda conversar antes).

## Estado atual
Versão 1 pronta (14/10/2026): Hoje, Todas (risco), Painel básico e Família. Publicado no Netlify; login da Coordenação com senha provisória definida pelo Joe (trocar depois). Envio do comunicado funcionando pela instância Cev (testado só com a família do Asafe). Mensagens enviadas, entregue/lida e respostas aparecem na tela da família. Pendente: criar/definir o login, versão 2 (gráfico por dia, paradas, relatório) e versão 3 (n8n e Asaas). Pendências do Joe: remanejados do 3º ano e 4º ano, valores do Integral, preço dos livros, classificar o risco das 54 famílias.
