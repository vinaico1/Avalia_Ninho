import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Search from './pages/Search'

function AppRoutes() {
  useLocation() // re-renderiza a cada mudança de rota, relendo o token atualizado
  const token = localStorage.getItem('token')

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={token ? <Search /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={token ? '/search' : '/login'} />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
