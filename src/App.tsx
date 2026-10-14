import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { configurado, supabase } from './supabase'
import { carregarFamilias } from './data'
import type { Familia } from './lib'
import Login from './screens/Login'
import Shell from './Shell'

export default function App() {
  const [sessao, setSessao] = useState<Session | null | undefined>(undefined)
  const [familias, setFamilias] = useState<Familia[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

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

  return <Shell familias={familias} erro={erro} carregando={carregando} recarregar={recarregar} sair={() => supabase.auth.signOut()} />
}
