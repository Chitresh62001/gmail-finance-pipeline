import { useRef, useEffect } from 'react'

export default function WetGlass({ children }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animId
    let drops = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create initial drops
    const createDrop = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      radius: 1 + Math.random() * 2.5,
      speed: 0.3 + Math.random() * 1.2,
      opacity: 0.08 + Math.random() * 0.15,
      trail: [],
    })

    for (let i = 0; i < 80; i++) {
      const d = createDrop()
      d.y = Math.random() * canvas.height
      drops.push(d)
    }

    // Static condensation droplets
    const condensation = []
    for (let i = 0; i < 120; i++) {
      condensation.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 0.5 + Math.random() * 2,
        opacity: 0.03 + Math.random() * 0.06,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw condensation
      condensation.forEach(c => {
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 200, 255, ${c.opacity})`
        ctx.fill()
      })

      // Draw drops
      drops.forEach(d => {
        // Move
        d.y += d.speed
        d.x += Math.sin(d.y * 0.01) * 0.15

        // Trail
        if (d.speed > 0.6) {
          d.trail.push({ x: d.x, y: d.y, opacity: d.opacity * 0.5 })
          if (d.trail.length > 12) d.trail.shift()

          d.trail.forEach((t, idx) => {
            const alpha = (idx / d.trail.length) * t.opacity * 0.4
            ctx.beginPath()
            ctx.arc(t.x, t.y, d.radius * 0.6, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(180, 210, 255, ${alpha})`
            ctx.fill()
          })
        }

        // Main drop
        const gradient = ctx.createRadialGradient(
          d.x - d.radius * 0.3, d.y - d.radius * 0.3, 0,
          d.x, d.y, d.radius
        )
        gradient.addColorStop(0, `rgba(220, 235, 255, ${d.opacity * 1.5})`)
        gradient.addColorStop(0.6, `rgba(180, 210, 255, ${d.opacity})`)
        gradient.addColorStop(1, `rgba(140, 180, 240, ${d.opacity * 0.3})`)

        ctx.beginPath()
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Highlight
        ctx.beginPath()
        ctx.arc(d.x - d.radius * 0.25, d.y - d.radius * 0.25, d.radius * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${d.opacity * 0.8})`
        ctx.fill()

        // Reset if out of screen
        if (d.y > canvas.height + 10) {
          Object.assign(d, createDrop())
        }
      })

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div className="relative min-h-screen">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1 }}
      />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  )
}
