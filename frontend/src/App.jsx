import { useState, createContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ClickSpark from './components/reactbits/ClickSpark'

export const AuthContext = createContext(null)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [username, setUsername] = useState(() => localStorage.getItem('username'))

  const login = async (user, password) => {
    const formData = new URLSearchParams()
    formData.append('username', user)
    formData.append('password', password)

    const res = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'ngrok-skip-browser-warning': 'true'
      },
      body: formData,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Login failed')
    }

    const data = await res.json()
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('username', user)
    setToken(data.access_token)
    setUsername(user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
  }

  const authFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
    })
    if (res.status === 401) {
      logout()
      throw new Error('Session expired')
    }
    return res
  }

  return (
    <AuthContext.Provider value={{ token, username, login, logout, authFetch, apiUrl: API_URL }}>
      <ClickSpark sparkColor="#a78bfa" sparkCount={10} sparkSize={6} duration={500}>
        <div data-theme="dark" className="min-h-screen bg-base-300">
          <BrowserRouter>
            <Routes>
              <Route
                path="/login"
                element={token ? <Navigate to="/" replace /> : <Login />}
              />
              <Route
                path="/"
                element={token ? <Dashboard /> : <Navigate to="/login" replace />}
              />
            </Routes>
          </BrowserRouter>
        </div>
      </ClickSpark>
    </AuthContext.Provider>
  )
}

export default App
