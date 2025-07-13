import { useEffect, useRef, useState } from 'react'
import './Game.css'

const GAME_WIDTH = 360
const GAME_HEIGHT = 640
const PLAYER_WIDTH = 80
const PLAYER_HEIGHT = 80
const OBSTACLE_SIZE = 60
const PORTAL_SIZE = 100
const GRAVITY = 2
const OBSTACLE_INTERVAL = 1500
const PORTAL_COOLDOWN = 30000

const BACKGROUNDS = [
  {
    id: 0,
    sky: '/bg_sky1.png',
    obstacles: ['/obstacle1_1.png', '/obstacle1_2.png', '/obstacle1_3.png']
  },
  {
    id: 1,
    sky: '/bg_sky2.png',
    obstacles: ['/obstacle2_1.png', '/obstacle2_2.png', '/obstacle2_3.png']
  },
  {
    id: 2,
    sky: '/bg_sky3.png',
    obstacles: ['/obstacle3_1.png', '/obstacle3_2.png', '/obstacle3_3.png']
  }
]

export function Game() {
  const sceneRef = useRef<HTMLDivElement>(null)
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - PLAYER_WIDTH / 2)
  const [distance, setDistance] = useState(0)
  const [obstacles, setObstacles] = useState<any[]>([])
  const [currentBg, setCurrentBg] = useState(0)
  const [bgInstances, setBgInstances] = useState<{ id: number, y: number }[]>([])
  const [portalVisible, setPortalVisible] = useState(true)
  const [portalTime, setPortalTime] = useState(Date.now())
  const [portalPos, setPortalPos] = useState({ x: 150, y: 1200 })
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load all images before starting
  useEffect(() => {
    const allImages = [
      '/astronaut.png',
      '/portal.png',
      ...BACKGROUNDS.flatMap(bg => [bg.sky, ...bg.obstacles])
    ]

    let loadedCount = 0
    allImages.forEach(src => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        loadedCount++
        if (loadedCount === allImages.length) {
          setLoaded(true)
        }
      }
    })
  }, [])

  useEffect(() => {
    const bgs = []
    for (let i = -1; i < 10; i++) bgs.push({ id: currentBg, y: i * GAME_HEIGHT })
    setBgInstances(bgs)
  }, [currentBg])

  useEffect(() => {
    if (gameOver || !loaded) return
    const interval = setInterval(() => {
      setDistance(prev => prev + GRAVITY)
    }, 16)
    return () => clearInterval(interval)
  }, [gameOver, loaded])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setDirection('left')
      if (e.key === 'ArrowRight') setDirection('right')
    }
    const up = () => setDirection(null)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    if (!direction || gameOver || !loaded) return
    const interval = setInterval(() => {
      setPlayerX(prev => {
        if (direction === 'left') return Math.max(0, prev - 5)
        if (direction === 'right') return Math.min(GAME_WIDTH - PLAYER_WIDTH, prev + 5)
        return prev
      })
    }, 16)
    return () => clearInterval(interval)
  }, [direction, gameOver, loaded])

  useEffect(() => {
    if (gameOver || !loaded) return
    const interval = setInterval(() => {
      setObstacles(prev =>
        prev.map(o => ({
          ...o,
          y: o.y + o.speed
        }))
      )
    }, 16)
    return () => clearInterval(interval)
  }, [gameOver, loaded])

  useEffect(() => {
    if (gameOver || !loaded) return
    const spawn = setInterval(() => {
      const world = BACKGROUNDS[currentBg]
      const image = world.obstacles[Math.floor(Math.random() * 3)]
      const speed = 3 + Math.random() * 2
      setObstacles(prev => [
        ...prev,
        {
          id: Date.now(),
          x: Math.random() * (GAME_WIDTH - OBSTACLE_SIZE),
          y: distance - 100 + Math.random() * 200,
          image,
          speed
        }
      ])
    }, OBSTACLE_INTERVAL + Math.random() * 400)
    return () => clearInterval(spawn)
  }, [currentBg, gameOver, loaded])

  useEffect(() => {
    const COLLISION_OFFSET = 20

    if (!portalVisible && Date.now() - portalTime > PORTAL_COOLDOWN) {
      setPortalVisible(true)
      setPortalPos({ x: Math.random() * (GAME_WIDTH - PORTAL_SIZE), y: distance + 1200 })
    }

    const playerBox = {
      x: playerX + COLLISION_OFFSET,
      y: distance + 0.4 * GAME_HEIGHT + COLLISION_OFFSET,
      w: PLAYER_WIDTH - COLLISION_OFFSET * 2,
      h: PLAYER_HEIGHT - COLLISION_OFFSET * 2
    }

    const portalBox = {
      x: portalPos.x + COLLISION_OFFSET,
      y: portalPos.y + COLLISION_OFFSET,
      w: PORTAL_SIZE - COLLISION_OFFSET * 2,
      h: PORTAL_SIZE - COLLISION_OFFSET * 2
    }

    const collidePortal =
      playerBox.x < portalBox.x + portalBox.w &&
      playerBox.x + playerBox.w > portalBox.x &&
      playerBox.y < portalBox.y + portalBox.h &&
      playerBox.y + playerBox.h > portalBox.y

    if (portalVisible && collidePortal) {
      let next = Math.floor(Math.random() * BACKGROUNDS.length)
      while (next === currentBg) next = Math.floor(Math.random() * BACKGROUNDS.length)
      setCurrentBg(next)
      setPortalVisible(false)
      setPortalTime(Date.now())
      setBgInstances(() => {
        const updated = []
        for (let i = -1; i < 10; i++) updated.push({ id: next, y: (distance + i * GAME_HEIGHT) })
        return updated
      })
      setObstacles([])
    }

    for (const o of obstacles) {
      const oBox = {
        x: o.x + COLLISION_OFFSET,
        y: o.y + COLLISION_OFFSET,
        w: OBSTACLE_SIZE - COLLISION_OFFSET * 2,
        h: OBSTACLE_SIZE - COLLISION_OFFSET * 2
      }

      const hit =
        playerBox.x < oBox.x + oBox.w &&
        playerBox.x + playerBox.w > oBox.x &&
        playerBox.y < oBox.y + oBox.h &&
        playerBox.y + playerBox.h > oBox.y

      if (hit) {
        setGameOver(true)
        break
      }
    }
  }, [playerX, distance, portalVisible, obstacles, gameOver])

  const restart = () => {
    setDistance(0)
    setObstacles([])
    setPlayerX(GAME_WIDTH / 2 - PLAYER_WIDTH / 2)
    setPortalPos({ x: 150, y: 1200 })
    setPortalVisible(true)
    setPortalTime(Date.now())
    setGameOver(false)
  }

  if (!loaded) {
    return (
      <div className="game-scene">
        <div className="loading">Загрузка...</div>
      </div>
    )
  }

  return (
    <div ref={sceneRef} className="game-scene">
      <div className="game-world" style={{ transform: `translateY(${-distance}px)` }}>
        {bgInstances.map((bg, i) => (
          <div key={i} className="background-layer" style={{ top: bg.y, backgroundImage: `url(${BACKGROUNDS[bg.id].sky})` }} />
        ))}

        {obstacles.map(o => (
          <img key={o.id} src={o.image} className="obstacle" style={{ left: o.x, top: o.y, width: OBSTACLE_SIZE, height: OBSTACLE_SIZE }} />
        ))}

        {portalVisible && (
          <img src="/portal.png" className="portal" style={{ top: portalPos.y, left: portalPos.x, width: PORTAL_SIZE, height: PORTAL_SIZE }} />
        )}
      </div>

      <img src="/astronaut.png" className="player" style={{ left: playerX, top: '40%', width: PLAYER_WIDTH, height: PLAYER_HEIGHT }} />

      <div className="mobile-controls">
        <button onTouchStart={() => setDirection('left')} onTouchEnd={() => setDirection(null)}>←</button>
        <button onTouchStart={() => setDirection('right')} onTouchEnd={() => setDirection(null)}>→</button>
      </div>

      {gameOver && (
        <div className="game-over">
          <div>Игра Окончена</div>
          <button onClick={restart}>Перезапуск</button>
        </div>
      )}
    </div>
  )
}
