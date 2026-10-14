import { Familia, MARCOS, hoje } from '../lib'
import { AnelProgresso, ArcoDado, Icone } from '../ui'

export default function Painel({ familias }: { familias: Familia[] }) {
  const total = familias.length
  const n = {
    contatadas: familias.filter((f) => f.contatado_em).length,
    respondeu: familias.filter((f) => f.respondeu_em).length,
    reserva: familias.filter((f) => f.reserva_confirmada_em).length,
    paga: familias.filter((f) => f.pago_em).length,
  }
  const arcos: ArcoDado[] = [
    { cor: 'ciano', valor: n.contatadas, total, nome: 'Contatadas' },
    { cor: 'azul', valor: n.respondeu, total, nome: 'Responderam' },
    { cor: 'indigo', valor: n.reserva, total, nome: 'Reservaram a vaga' },
    { cor: 'amarelo', valor: n.paga, total, nome: 'Pagaram' },
  ]
  const dia = hoje()
  const proximo = MARCOS.find((m) => m.data >= dia)
  const pct = total ? Math.round((n.reserva / total) * 100) : 0

  return (
    <section>
      <header className="cab">
        <div>
          <h2>Painel</h2>
          <p>Meta: as {total} famílias com a vaga reservada até 31/10 e pagas até 30/11</p>
        </div>
      </header>

      <div className="heroi">
        <AnelProgresso tamanho={232} arcos={arcos}>
          <b className="heroi-num">{n.reserva}</b>
          <span className="heroi-leg">de {total} vagas reservadas</span>
          <span className="heroi-pct">{pct}%</span>
        </AnelProgresso>
      </div>

      <ul className="legenda">
        {arcos.map((a) => (
          <li key={a.nome}>
            <i className={`ponto ${a.cor}`} aria-hidden="true" />
            <span>{a.nome}</span>
            <b>
              {a.valor} <small>de {a.total}</small>
            </b>
          </li>
        ))}
      </ul>

      <h3>Metas da campanha</h3>
      <ol className="marcos">
        {MARCOS.map((m) => {
          const atual = m.campo === 'respondeu' ? n.respondeu : m.campo === 'reserva' ? n.reserva : n.paga
          const bateu = atual >= m.meta
          const passou = m.data < dia
          const estado = bateu ? 'ok' : passou ? 'atrasado' : m === proximo ? 'proximo' : ''
          return (
            <li key={m.data} className={estado}>
              <span className="bolinha" aria-hidden="true">{bateu && <Icone nome="check" tamanho={14} traco={3.4} />}</span>
              <div>
                <b>{m.rotulo}</b>
                <span>{m.texto}</span>
              </div>
              <em>{bateu ? 'feita' : passou ? `atrasada · ${atual}/${m.meta}` : `${atual}/${m.meta}`}</em>
            </li>
          )
        })}
      </ol>
      <p className="meta">Gráfico por dia, famílias paradas e relatório da semana entram na versão 2.</p>
    </section>
  )
}
