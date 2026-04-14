import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1200)
    const hideTimer = setTimeout(() => setVisible(false), 1600)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black"
      style={{ transition: 'opacity 0.4s ease', opacity: fading ? 0 : 1 }}
    >
      <img
        src="/icon-512.png"
        alt="senaskate"
        className="w-28 h-28 rounded-[28px] shadow-2xl"
        style={{ boxShadow: '0 0 60px rgba(16,185,129,0.4)' }}
      />
      <p
        className="text-white text-xl font-bold mt-5 tracking-[0.15em]"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        senaskate
      </p>
    </div>
  )
}
