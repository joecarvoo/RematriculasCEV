import { useEffect, useState } from 'react'
import { Icone } from './ui'

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }

const CHAVE = 'instalar-adiado-ate'
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

function adiado(): boolean {
  try {
    return Number(localStorage.getItem(CHAVE) ?? 0) > Date.now()
  } catch {
    return false
  }
}

/** Convite para instalar o painel na tela inicial. Some sozinho depois de instalado ou se o Joel disser "agora não" (volta em 7 dias). */
export default function Instalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null)
  const [escondido, setEscondido] = useState(() => adiado())
  const [instalado, setInstalado] = useState(() => standalone())

  useEffect(() => {
    const antes = (e: Event) => {
      e.preventDefault()
      setEvento(e as EventoInstalar)
    }
    const depois = () => setInstalado(true)
    window.addEventListener('beforeinstallprompt', antes)
    window.addEventListener('appinstalled', depois)
    return () => {
      window.removeEventListener('beforeinstallprompt', antes)
      window.removeEventListener('appinstalled', depois)
    }
  }, [])

  const ios = ehIOS()
  if (instalado || escondido || (!evento && !ios)) return null

  function agoraNao() {
    try {
      localStorage.setItem(CHAVE, String(Date.now() + 7 * 86400000))
    } catch {
      /* sem armazenamento: só esconde nesta visita */
    }
    setEscondido(true)
  }

  async function instalar() {
    if (!evento) return
    await evento.prompt()
    const r = await evento.userChoice
    setEvento(null)
    if (r.outcome === 'dismissed') agoraNao()
  }

  return (
    <aside className="instalar" aria-label="Instalar o app">
      <img src="/icons/icon-192.png" alt="" width={48} height={48} />
      <div>
        <b>Instale o painel no celular</b>
        {evento ? (
          <span>Abre em tela cheia, direto da tela inicial.</span>
        ) : (
          <span>
            Toque em Compartilhar <Icone nome="seta" tamanho={14} /> e depois em Adicionar à Tela de Início.
          </span>
        )}
      </div>
      <div className="instalar-acoes">
        {evento && (
          <button className="primario" onClick={instalar}>
            Instalar
          </button>
        )}
        <button className="mais" onClick={agoraNao}>
          Agora não
        </button>
      </div>
    </aside>
  )
}
