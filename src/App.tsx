import { useEffect } from 'react'
import { Game } from './game/Game'

declare global {
  interface Window {
    Telegram: any
  }
}

function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
  }, [])

  return <Game />
}

export default App
