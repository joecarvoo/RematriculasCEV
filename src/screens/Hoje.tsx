import { Familia, deveAbordarHoje, hoje, ordenar } from '../lib'
import Cartao from './Cartao'

export default function Hoje({
  familias,
  abrir,
  atualizar,
}: {
  familias: Familia[]
  abrir: (id: string) => void
  atualizar: () => Promise<void>
}) {
  const dia = hoje()
  const lista = familias.filter((f) => deveAbordarHoje(f, dia)).sort(ordenar)
  return (
    <section>
      <h2>
        Hoje <small>{lista.length} {lista.length === 1 ? 'família' : 'famílias'} para abordar</small>
      </h2>
      {lista.length === 0 && familias.length > 0 && <p className="vazio">Nada pendente hoje. Respira. 🎉</p>}
      {lista.map((f) => (
        <Cartao key={f.id} f={f} abrir={abrir} atualizar={atualizar} />
      ))}
    </section>
  )
}
