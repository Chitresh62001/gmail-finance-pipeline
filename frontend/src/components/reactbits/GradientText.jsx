import { useRef, useEffect, useState } from 'react'

export default function GradientText({
  children,
  className = '',
  colors = ['#60a5fa', '#a78bfa', '#34d399', '#60a5fa'],
  animationSpeed = 4,
}) {
  const gradientStyle = {
    backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
    backgroundSize: '300% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: `gradientShift ${animationSpeed}s ease-in-out infinite`,
  }

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      <span className={className} style={gradientStyle}>
        {children}
      </span>
    </>
  )
}
