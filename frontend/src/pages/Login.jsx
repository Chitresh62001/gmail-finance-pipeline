import { useState, useContext } from 'react'
import { AuthContext } from '../App'

export default function Login() {
  const { login } = useContext(AuthContext)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-base-300">
      {/* Animated background matching the old one */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] login-bg-anim"
        style={{
          background: `
            radial-gradient(circle at 25% 60%, rgba(139, 92, 246, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 75% 35%, rgba(96, 165, 250, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 50% 90%, rgba(52, 211, 153, 0.10) 0%, transparent 40%)
          `
        }}
      />
      
      <form 
        onSubmit={handleSubmit}
        className="relative w-full max-w-[400px] bg-[rgba(255,255,255,0.06)] backdrop-blur-[24px] border border-white/10 rounded-[22px] px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]"
      >
        <div className="text-center text-[48px] mb-4">💰</div>
        <h1 className="text-[28px] font-bold text-white text-center mb-1.5">Money Watcher</h1>
        <p className="text-center text-white/45 text-[13px] mb-8">Sign in to your finance dashboard</p>

        <div className="mb-5">
          <label 
            htmlFor="username" 
            className="block text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em] mb-1.5"
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full px-3.5 py-3 border border-white/10 rounded-md bg-white/5 text-white text-[14px] font-sans outline-none transition-all duration-200 focus:border-blue-400 focus:bg-blue-400/5 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.15)] placeholder:text-white/25"
          />
        </div>

        <div className="mb-5">
          <label 
            htmlFor="password" 
            className="block text-[11px] font-semibold text-white/40 uppercase tracking-[0.08em] mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-3 border border-white/10 rounded-md bg-white/5 text-white text-[14px] font-sans outline-none transition-all duration-200 focus:border-blue-400 focus:bg-blue-400/5 focus:shadow-[0_0_0_3px_rgba(96,165,250,0.15)] placeholder:text-white/25"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-2 p-[13px] border-none rounded-md bg-gradient-to-br from-[#60a5fa] to-[#8b5cf6] text-white text-[14px] font-semibold cursor-pointer transition-all duration-200 hover:opacity-90 hover:shadow-[0_6px_28px_rgba(96,165,250,0.35)] active:scale-98 shadow-[0_4px_20px_rgba(96,165,250,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {error && (
          <div className="text-[#f87171] text-[13px] text-center mt-4 p-2.5 bg-[#f87171]/10 border border-[#f87171]/15 rounded-md">
            {error}
          </div>
        )}
      </form>
    </div>
  )
}
