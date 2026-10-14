import { Familia, MARCOS, hoje } from '../lib'

function Barra({ valor, total, rotulo }: { valor: number; total: number; rotulo: string }) {
  const pct = total ? Math.round((valor / total) * 100) : 0
  return (
    <div className="barra">
      <div className="barra-topo">
        <span>{rotulo}</span>
        <b>
          {valor}/{total} · {pct}%
        </b>
      </div>
      <div className="trilho">
        <div className="enche" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function Painel({ familias }: { familias: Familia[] }) {
  const total = familias.length
  const n = {
    contatadas: familias.filter((f) => f.contatado_em).length,
    respondeu: familias.filter((f) => f.respondeu_em).length,
    reserva: familias.filter((f) => f.reserva_confirmada_em).length,
    paga: familias.filter((f) => f.pago_em).length,
  }
  const dia = hoje()
  const proximo = MARCOS.find((m) => m.data >= dia)

  return (
    <section>
      <h2>Painel <small>meta: {total} famílias</small></h2>

      <div className="grade">
        <div className="numero"><b>{n.contatadas}</b>contatadas</div>
        <div className="numero"><b>{n.respondeu}</b>responderam</div>
        <div className="numero"><b>{n.reserva}</b>reservas</div>
        <div className="numero"><b>{n.paga}</b>pagas</div>
      </div>

      <Barra valor={n.reserva} total={total} rotulo="Vaga reservada (até 31/10)" />
      <Barra valor={n.paga} total={total} rotulo="Rematrícula paga (até 30/11)" />

      <h3>Metas</h3>
      <ul className="marcos">
        {MARCOS.map((m) => {
          const atual = m.campo === 'respondeu' ? n.respondeu : m.campo === 'reserva' ? n.reserva : n.paga
          const bateu = atual >= m.meta
          const passou = m.data < dia
          return (
            <li key={m.data} className={bateu ? 'ok' : passou ? 'atrasado' : m === proximo ? 'proximo' : ''}>
              <span>{m.rotulo}</span>
              <span>{m.texto}</span>
              <b>{bateu ? '✓' : `${atual}/${m.meta}`}</b>
            </li>
          )
        })}
      </ul>
      <p className="meta">Gráfico por dia, famílias paradas e relatório da semana entram na versão 2.</p>
    </section>
  )
}
