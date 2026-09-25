import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage.jsx'
import Dashboard from './components/Dashboard.jsx'
import Toast from './components/Toast.jsx'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token')
    if (token) {
      setIsAuthenticated(true)
    }
  }, [])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleLogin = (username, password) => {
    if (username === 'serhat.akyildiz' && password === 'serhatAkyildiz123') {
      sessionStorage.setItem('auth_token', 'authenticated')
      setIsAuthenticated(true)
      showToast('Giriş başarılı')
      return true
    }
    showToast('Kullanıcı adı veya şifre hatalı', 'error')
    return false
  }

  const handleLogout = () => {
    sessionStorage.removeItem('auth_token')
    setIsAuthenticated(false)
    showToast('Çıkış yapıldı')
  }

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />
      ) : (
        <Dashboard
          onLogout={handleLogout}
          showToast={showToast}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

export default App
