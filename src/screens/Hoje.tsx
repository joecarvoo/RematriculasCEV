import { Familia, deveAbordarHoje, hoje, ordenar } from '../lib'
import { Anel } from '../ui'
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
      <header className="cab">
        <Anel tamanho={72} numero={lista.length} />
        <div>
          <h2>Hoje</h2>
          <p>{lista.length === 1 ? 'família para abordar' : 'famílias para abordar'}</p>
        </div>
      </header>
      {lista.length === 0 && familias.length > 0 && (
        <p className="vazio">
          <b>Nada pendente hoje.</b>
          Quem foi contatada e não tem retorno marcado fica de fora. Procure em Todas.
        </p>
      )}
      {lista.map((f) => (
        <Cartao key={f.id} f={f} abrir={abrir} atualizar={atualizar} />
      ))}
    </section>
  )
}
