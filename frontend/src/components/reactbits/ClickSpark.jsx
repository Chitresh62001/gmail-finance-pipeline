import { useRef, useEffect, useCallback } from 'react'

export default function ClickSpark({
  children,
  sparkColor = '#60a5fa',
  sparkCount = 8,
  sparkSize = 10,
  duration = 400,
}) {
  const canvasRef = useRef(null)
  const sparksRef = useRef([])
  const rafRef = useRef(null)

  const createSparks = useCallback((x, y) => {
    const newSparks = []
    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount
      const velocity = 2 + Math.random() * 3
      newSparks.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 1,
        size: sparkSize * (0.5 + Math.random() * 0.5),
      })
    }
    sparksRef.current = [...sparksRef.current, ...newSparks]
  }, [sparkCount, sparkSize])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    sparksRef.current = sparksRef.current
      .map(spark => ({
        ...spark,
        x: spark.x + spark.vx,
        y: spark.y + spark.vy,
        vy: spark.vy + 0.1,
        life: spark.life - (1000 / 60 / duration),
      }))
      .filter(spark => spark.life > 0)

    sparksRef.current.forEach(spark => {
      ctx.save()
      ctx.globalAlpha = spark.life
      ctx.fillStyle = sparkColor
      ctx.beginPath()
      ctx.arc(spark.x, spark.y, spark.size * spark.life, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    rafRef.current = requestAnimationFrame(animate)
  }, [duration, sparkColor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [animate])

  const handleClick = (e) => {
    createSparks(e.clientX, e.clientY)
  }

  return (
    <div onClick={handleClick} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      {children}
    </div>
  )
}
