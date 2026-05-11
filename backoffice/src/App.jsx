import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import AgentDetail from './pages/AgentDetail'
import ServicesPage from './pages/ServicesPage'
import AcademyPage from './pages/AcademyPage'
import NotificationsPage from './pages/NotificationsPage'
import TransactionsPage from './pages/TransactionsPage'
import ObjectifsBO from './pages/ObjectifsBO'
import Analytics from './pages/Analytics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="academy" element={<AcademyPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="objectifs" element={<ObjectifsBO />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
