import { useState, useContext } from 'react'
import { AuthContext } from '../App'
import GradientText from '../components/reactbits/GradientText'

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
    <div className="min-h-screen flex items-center justify-center bg-base-300 p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] login-bg-anim opacity-60"
        style={{
          background: `
            radial-gradient(circle at 25% 60%, rgba(139, 92, 246, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 75% 35%, rgba(96, 165, 250, 0.14) 0%, transparent 45%),
            radial-gradient(circle at 50% 90%, rgba(52, 211, 153, 0.10) 0%, transparent 40%)
          `
        }}
      />
      
      <form
        className="card bg-base-100/60 backdrop-blur-2xl border border-white/10 shadow-2xl w-full max-w-md animate-fade-in-up"
        onSubmit={handleSubmit}
      >
        <div className="card-body gap-6">
          {/* Logo */}
          <div className="text-center">
            <div className="text-5xl mb-3">💰</div>
            <h1 className="text-3xl font-bold">
              <GradientText
                colors={['#60a5fa', '#a78bfa', '#34d399', '#60a5fa']}
                animationSpeed={4}
                className="text-3xl font-bold"
              >
                Money Watcher
              </GradientText>
            </h1>
            <p className="text-base-content/40 text-sm mt-1">Sign in to your finance dashboard</p>
          </div>

          {/* Username */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Username
              </span>
            </label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              className="input input-bordered bg-base-100/40 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Password */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-xs font-semibold uppercase tracking-wider text-base-content/50">
                Password
              </span>
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              className="input input-bordered bg-base-100/40 border-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <button
            className="btn btn-primary w-full text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="alert alert-error bg-error/10 border-error/20 text-error text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
