import { FormEvent, useState } from 'react'
import { supabase } from '../supabase'
import { Forma } from '../ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setEnviando(false)
  }

  return (
    <main className="login-tela">
      <Forma className="forma-login" />
      <form className="login" onSubmit={entrar}>
        <img className="login-logo" src="/cev-logo.png" alt="Centro Educacional Vencedores" width={72} height={72} />
        <h1>Rematrícula 2027</h1>
        <p>Entre para acompanhar as famílias do CEV.</p>
        <label>
          E-mail
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Senha
          <input type="password" autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <p className="aviso" role="alert">{erro}</p>}
        <button className="primario" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
