import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Academy from './pages/Academy'
import AcademyModule from './pages/AcademyModule'
import Transactions from './pages/Transactions'
import Objectifs from './pages/Objectifs'
import Favoris from './pages/Favoris'
import Profile from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
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
