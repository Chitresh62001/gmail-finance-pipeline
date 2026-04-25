import { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function BlurText({
  text = '',
  delay = 50,
  className = '',
}) {
  const words = text.split(' ')
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: delay / 1000 },
    },
  }

  const wordVariants = {
    hidden: { filter: 'blur(12px)', opacity: 0, y: 8 },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <motion.span
      ref={ref}
      className={`inline-flex flex-wrap gap-x-2 ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
    >
      {words.map((word, i) => (
        <motion.span key={i} variants={wordVariants} className="inline-block">
          {word}
        </motion.span>
      ))}
    </motion.span>
  )
}
