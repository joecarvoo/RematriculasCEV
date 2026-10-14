// Página de desenvolvimento: mostra as telas com famílias INVENTADAS (nenhum dado real).
// Abra /demo.html?tela=hoje|todas|painel|familia|login. Não entra no site publicado.
import { createRoot } from 'react-dom/client'
import { Familia, Mensagem, Registro } from './lib'
import Shell from './Shell'
import Login from './screens/Login'
import './tokens.css'
import './styles.css'

const agora = Date.now()
const h = (horas: number) => new Date(agora - horas * 3600_000).toISOString()
const base = { contatado_em: null, respondeu_em: null, reserva_confirmada_em: null, pago_em: null, proximo_contato: null, observacao: null, etiquetas: [] as string[], comunicadoEm: null, respostas: 0 }
const mk = (id: string, nome: string, alunos: [string, string][], extra: Partial<Familia> = {}): Familia =>
  ({
    id, responsavel_id: id, risco: 'verde', ...base,
    responsavel: { nome_completo: nome, telefone_principal: '(92) 99999-0000', email: null },
    alunos: alunos.map(([n, t]) => ({ nome: n, turma: t, periodo: 'Matutino' })),
    turno2027: null, ...extra,
  }) as Familia

const familias: Familia[] = [
  mk('1', 'Carolina Mendes Rocha', [['Helena Mendes Rocha', '2º Ano']], { risco: 'vermelha', etiquetas: ['remanejado'], turno2027: 'Vespertino', observacao: 'Ficou preocupada com a turma única à tarde.' }),
  mk('2', 'Rafael Nogueira Dias', [['Davi Nogueira Dias', 'Maternal 1'], ['Lara Nogueira Dias', 'Pré 2']], { risco: 'amarela', etiquetas: ['irmaos'], turno2027: 'Matutino', contatado_em: h(96), comunicadoEm: h(96), proximo_contato: new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Manaus' }).format(new Date()), respostas: 1 }),
  mk('3', 'Mariana Teixeira Lopes', [['Sofia Teixeira Lopes', 'Pré 1']], { turno2027: 'Integral', contatado_em: h(50), respondeu_em: h(48), comunicadoEm: h(50), respostas: 1 }),
  mk('4', 'Paulo Ribeiro Castro', [['Miguel Ribeiro Castro', '1º Ano']]),
  mk('5', 'Beatriz Alencar Souza', [['Alice Alencar Souza', 'Maternal 2']], { contatado_em: h(70), respondeu_em: h(60), reserva_confirmada_em: h(20), comunicadoEm: h(70) }),
  mk('6', 'Gustavo Farias Lima', [['Theo Farias Lima', '3º Ano']], { risco: 'amarela', contatado_em: h(90), respondeu_em: h(80), reserva_confirmada_em: h(40), pago_em: h(5) }),
]

const mensagens: Mensagem[] = [
  { id: 'm3', familia_id: '2', direcao: 'recebida', tipo: 'botao', texto: 'Sim, pode manter', status: 'recebida', criado_em: h(28) },
  { id: 'm2', familia_id: '2', direcao: 'enviada', tipo: 'comunicado_botoes', status: 'lida', criado_em: h(30), texto: 'Olá, Rafael! 💙\n\nEstamos organizando as turmas de 2027 e queremos garantir a vaga de Davi e Lara, no turno que faz mais sentido para a rotina de vocês.\n\nPara eu já adiantar a vaga: o turno continua sendo o da manhã? Toque numa opção:' },
]
const registros: Registro[] = [
  { id: 'r2', familia_id: '2', criado_em: h(28), canal: 'whatsapp', resultado: 'Pelo botão: pode manter o turno', nota: 'Botão tocado: Sim, pode manter', proximo_contato: null },
  { id: 'r1', familia_id: '2', criado_em: h(30), canal: 'whatsapp', resultado: 'Comunicado geral enviado', nota: 'Enviado pelo painel (Evolution API)', proximo_contato: null },
]

const registrosGerais: Registro[] = [
  ...registros,
  { id: 'a1', familia_id: '1', criado_em: h(24 * 5), canal: 'presencial', resultado: 'Anotação', nota: 'Preocupada com o turno da tarde e com o valor depois do desconto', proximo_contato: null },
  { id: 'a2', familia_id: '3', criado_em: h(24 * 2), canal: 'whatsapp', resultado: 'Anotação', nota: 'Vai conversar com o marido e está vendo outras escolas', proximo_contato: null },
  { id: 'a3', familia_id: '6', criado_em: h(24 * 8), canal: 'ligacao', resultado: 'Anotação', nota: 'Mudando de bairro, transporte é dúvida', proximo_contato: null },
]

const p = new URLSearchParams(location.search)
const tela = p.get('tela') ?? 'hoje'
const noop = async () => undefined

createRoot(document.getElementById('root')!).render(
  tela === 'login' ? (
    <Login />
  ) : (
    <Shell
      familias={familias}
      registros={registrosGerais}
      erro=""
      carregando={false}
      recarregar={noop}
      sair={() => undefined}
      abaInicial={tela === 'todas' ? 'todas' : tela === 'painel' ? 'painel' : tela === 'relatorio' ? 'relatorio' : 'hoje'}
      abertaInicial={tela === 'familia' ? '2' : null}
      demo={{ mensagens, registros }}
    />
  ),
)
