import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Services from './pages/Services'
import Academy from './pages/Academy'
import AcademyModule from './pages/AcademyModule'
import Transactions from './pages/Transactions'
import Objectifs from './pages/Objectifs'
import Favoris from './pages/Favoris'
import Profile from './pages/Profile'

function Guard({ children }) {
  const logged = localStorage.getItem('m2t_agent_id')
  return logged ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Guard><Layout /></Guard>}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="academy" element={<Academy />} />
          <Route path="academy/:moduleId" element={<AcademyModule />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="objectifs" element={<Objectifs />} />
          <Route path="favoris" element={<Favoris />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
