import { paradas } from '../analise'
import { ETAPA_NOME, Familia, MARCOS, Registro, etapa, hoje } from '../lib'
import GraficoDias from './GraficoDias'
import { Anel, Estatistica, Icone } from '../ui'

export default function Painel({ familias, registros, abrir }: { familias: Familia[]; registros: Registro[]; abrir: (id: string) => void }) {
  const total = familias.length
  const n = {
    contatadas: familias.filter((f) => f.contatado_em).length,
    respondeu: familias.filter((f) => f.respondeu_em).length,
    reserva: familias.filter((f) => f.reserva_confirmada_em).length,
    paga: familias.filter((f) => f.pago_em).length,
  }
  const etapas = [
    { cor: 'ciano', valor: n.contatadas, nome: 'Contatadas' },
    { cor: 'azul', valor: n.respondeu, nome: 'Responderam' },
    { cor: 'indigo', valor: n.reserva, nome: 'Reservaram a vaga' },
    { cor: 'amarelo', valor: n.paga, nome: 'Pagaram' },
  ]
  const dia = hoje()
  const paradasAgora = paradas(familias, registros)
  const proximo = MARCOS.find((m) => m.data >= dia)
  const pct = total ? Math.round((n.reserva / total) * 100) : 0

  return (
    <section className="painel">
      <header className="cab">
        <div>
          <h2>Painel</h2>
          <p>Meta: as {total} famílias com a vaga reservada até 31/10 e pagas até 30/11</p>
        </div>
      </header>

      <div className="p-topo">
      <div className="heroi">
        <Estatistica numero={`${pct}%`} valor={pct} legenda={`${n.reserva} de ${total} famílias com a vaga reservada`} />
      </div>

      <ul className="legenda">
        {etapas.map((a) => (
          <li key={a.nome}>
            <span>{a.nome}</span>
            <b>
              {a.valor} <small>de {total}</small>
            </b>
            <i className="trilho" aria-hidden="true">
              <i className={`enche ${a.cor}`} style={{ width: `${total ? (a.valor / total) * 100 : 0}%` }} />
            </i>
          </li>
        ))}
      </ul>

      </div>

      <div className="p-grafico">
      <h3>Resultado por dia</h3>
      <GraficoDias familias={familias} />
      </div>

      <div className="p-paradas">
      <h3>
        Paradas há mais de 3 dias <span className="contagem">{paradasAgora.length}</span>
      </h3>
      {paradasAgora.length === 0 ? (
        <p className="vazio">
          <b>Nenhuma família parada.</b>
          Quem está em andamento teve contato nos últimos 3 dias.
        </p>
      ) : (
        <ul className="lista">
          {paradasAgora.map(({ familia: f, dias }) => (
            <li key={f.id} className="linha-todas">
              <button className="nome" onClick={() => abrir(f.id)}>
                {f.responsavel?.nome_completo}
                <small>
                  {ETAPA_NOME[etapa(f)]} · sem contato há {dias} dias
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}

      </div>

      <div className="p-metas">
      <h3>Metas da campanha</h3>
      <ol className="marcos">
        {MARCOS.map((m, i) => {
          const atual = m.campo === 'respondeu' ? n.respondeu : m.campo === 'reserva' ? n.reserva : n.paga
          const bateu = atual >= m.meta
          const passou = m.data < dia
          const estado = bateu ? 'ok' : passou ? 'atrasado' : m === proximo ? 'proximo' : ''
          return (
            <li key={m.data} className={estado}>
              <div className="passo-no">
                <Anel tamanho={44} numero={i + 1} />
              </div>
              <div className="passo-tx">
                <b>{m.rotulo}</b>
                <span>{m.texto}</span>
                <em>
                  {bateu && <Icone nome="check" tamanho={14} traco={3.2} />}
                  {bateu ? 'meta batida' : passou ? `atrasada · ${atual} de ${m.meta}` : proximo === m ? `próxima · ${atual} de ${m.meta}` : `${atual} de ${m.meta}`}
                </em>
              </div>
            </li>
          )
        })}
      </ol>
      </div>
    </section>
  )
}
