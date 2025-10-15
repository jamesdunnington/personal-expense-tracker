import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import Transactions from './pages/Transactions'
import Reports from './pages/Reports'
import Categories from './pages/Categories'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (token) {
      // TODO: Verify token with backend
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App