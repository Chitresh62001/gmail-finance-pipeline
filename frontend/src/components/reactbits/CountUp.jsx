import { useEffect, useRef, useState } from 'react'

export default function CountUp({
  from = 0,
  to = 100,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 2,
  className = '',
}) {
  const [value, setValue] = useState(from)
  const [inView, setInView] = useState(false)
  const ref = useRef(null)
  const startTime = useRef(null)
  const rafId = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp
      const progress = Math.min((timestamp - startTime.current) / (duration * 1000), 1)

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased

      setValue(current)

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate)
      }
    }

    startTime.current = null
    rafId.current = requestAnimationFrame(animate)

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [inView, from, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  )
}
