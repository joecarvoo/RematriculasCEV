import { useState } from 'react'
import { Familia, Mensagem, Registro } from './lib'
import Hoje from './screens/Hoje'
import Todas from './screens/Todas'
import Painel from './screens/Painel'
import Relatorio from './screens/Relatorio'
import Busca from './screens/Busca'
import FamiliaTela from './screens/FamiliaTela'
import { Forma, Icone, PilulaLogo } from './ui'

export type Aba = 'hoje' | 'todas' | 'painel' | 'relatorio'

export default function Shell({
  familias,
  registros,
  erro,
  carregando,
  recarregar,
  sair,
  abaInicial = 'hoje',
  abertaInicial = null,
  demo,
}: {
  familias: Familia[]
  registros: Registro[]
  erro: string
  carregando: boolean
  recarregar: () => Promise<void>
  sair: () => void
  abaInicial?: Aba
  abertaInicial?: string | null
  demo?: { mensagens: Mensagem[]; registros: Registro[] }
}) {
  const [aba, setAba] = useState<Aba>(abaInicial)
  const [aberta, setAberta] = useState<string | null>(abertaInicial)

  const familia = familias.find((f) => f.id === aberta)
  if (familia) return <FamiliaTela familia={familia} voltar={() => setAberta(null)} atualizar={recarregar} demo={demo} />

  return (
    <div className="app">
      <div className="topo">
        <Forma className="forma-topo" />
        <div className="topo-linha">
          <PilulaLogo texto="Rematrícula 2027" />
          <button className="sair" onClick={sair}>
            <Icone nome="sair" tamanho={16} /> Sair
          </button>
        </div>
        <Busca familias={familias} abrir={setAberta} />
      </div>

      {erro && <p className="aviso" role="alert">{erro}</p>}
      {!erro && !carregando && familias.length === 0 && (
        <p className="aviso">Nenhuma família apareceu. Esta conta precisa ser a de administrador do sistema do CEV.</p>
      )}

      <main>
        {aba === 'hoje' && <Hoje familias={familias} abrir={setAberta} atualizar={recarregar} />}
        {aba === 'todas' && <Todas familias={familias} abrir={setAberta} atualizar={recarregar} />}
        {aba === 'painel' && <Painel familias={familias} registros={registros} abrir={setAberta} />}
        {aba === 'relatorio' && <Relatorio familias={familias} registros={registros} abrir={setAberta} />}
      </main>

      <nav className="abas" aria-label="Seções">
        {([
          ['hoje', 'Hoje', 'relogio'],
          ['todas', 'Todas', 'livro'],
          ['painel', 'Painel', 'grafico'],
          ['relatorio', 'Relatório', 'papel'],
        ] as [Aba, string, string][]).map(([a, nome, icone]) => (
          <button key={a} className={aba === a ? 'ativa' : ''} aria-current={aba === a ? 'page' : undefined} onClick={() => setAba(a)}>
            <Icone nome={icone} tamanho={20} />
            {nome}
          </button>
        ))}
      </nav>
    </div>
  )
}
