import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [loading, setLoading] = useState(true)

  const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5070/api').trim().replace(/\/+$/, '')
  const baseApiUrl = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`
  const GITHUB_AUTH_URL = `${baseApiUrl}/auth/github`

  // Fetch current user whenever token changes or on initial load
  useEffect(() => {
    // 1. Check for token in URL query parameter (from GitHub OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('token')

    let activeToken = token
    if (urlToken) {
      localStorage.setItem('token', urlToken)
      setToken(urlToken)
      activeToken = urlToken
      // Clean query parameter from address bar
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (!activeToken) {
      setUser(null)
      setLoading(false)
      return
    }

    const fetchMe = async () => {
      try {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      } catch (err) {
        console.warn('Session expired or invalid token:', err.message)
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMe()
  }, [token])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token: newToken, user: newUser } = response.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const signup = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password })
    const { token: newToken, user: newUser } = response.data
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }

  const loginWithGitHub = () => {
    const returnTo = window.location.origin
    window.location.href = `${GITHUB_AUTH_URL}?returnTo=${encodeURIComponent(returnTo)}`
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      return response.data.user
    } catch (err) {
      console.warn('Failed to refresh user profile:', err.message)
      return null
    }
  }

  const updateProfile = async (updates) => {
    const response = await api.patch('/auth/profile', updates)
    setUser((prev) => ({
      ...prev,
      ...response.data.user
    }))
    return response.data.user
  }

  const changePassword = async (currentPassword, newPassword) => {
    const response = await api.put('/auth/password', { currentPassword, newPassword })
    return response.data
  }

  const deleteAccount = async () => {
    await api.delete('/auth/account')
    logout()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithGitHub,
        logout,
        refreshUser,
        updateProfile,
        changePassword,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
