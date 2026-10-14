import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from './supabase'
import { carregarFamilias } from './data'
import { Familia } from './lib'
import Login from './screens/Login'
import Hoje from './screens/Hoje'
import Todas from './screens/Todas'
import Painel from './screens/Painel'
import Busca from './screens/Busca'
import FamiliaTela from './screens/FamiliaTela'

type Aba = 'hoje' | 'todas' | 'painel'

export default function App() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)
  const [familias, setFamilias] = useState<Familia[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [aba, setAba] = useState<Aba>('hoje')
  const [aberta, setAberta] = useState<string | null>(null)

  useEffect(() => {
    if (!configurado) return
    supabase.auth.getSession().then(({ data }) => setSessao(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSessao(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const recarregar = useCallback(async () => {
    setCarregando(true)
    setErro('')
    try {
      setFamilias(await carregarFamilias())
    } catch {
      setErro('Não consegui carregar as famílias. Confira a internet e tente de novo.')
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (sessao) recarregar()
  }, [sessao, recarregar])

  if (!configurado)
    return (
      <main className="centro">
        <p>
          Faltam as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>. Veja o
          README.
        </p>
      </main>
    )
  if (sessao === undefined) return <main className="centro">Carregando…</main>
  if (!sessao) return <Login />

  const familia = familias.find((f) => f.id === aberta)
  if (familia)
    return <FamiliaTela familia={familia} voltar={() => setAberta(null)} atualizar={recarregar} />

  return (
    <div className="app">
      <header className="topo">
        <img src="/cev-logo.png" alt="" height={28} />
        <h1>Rematrícula 2027</h1>
        <button className="link" onClick={() => supabase.auth.signOut()}>
          Sair
        </button>
      </header>
      <Busca familias={familias} abrir={setAberta} />

      {erro && <p className="aviso">{erro}</p>}
      {!erro && !carregando && familias.length === 0 && (
        <p className="aviso">
          Nenhuma família apareceu. Esta conta precisa ser a de administrador do sistema do CEV.
        </p>
      )}

      <main>
        {aba === 'hoje' && <Hoje familias={familias} abrir={setAberta} atualizar={recarregar} />}
        {aba === 'todas' && <Todas familias={familias} abrir={setAberta} atualizar={recarregar} />}
        {aba === 'painel' && <Painel familias={familias} />}
      </main>

      <nav className="abas">
        {(['hoje', 'todas', 'painel'] as Aba[]).map((a) => (
          <button key={a} className={aba === a ? 'ativa' : ''} onClick={() => setAba(a)}>
            {{ hoje: 'Hoje', todas: 'Todas', painel: 'Painel' }[a]}
          </button>
        ))}
      </nav>
    </div>
  )
}
