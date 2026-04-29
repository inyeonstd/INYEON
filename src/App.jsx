import { Navigate, Routes, Route } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import EventEditor from './pages/EventEditor.jsx'
import Guests from './pages/Guests.jsx'
import RequireAuth from './components/RequireAuth.jsx'

export default function App() {
  return (
    <Routes>
      {/* Landing → manda al login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Demo público con slug fijo (preserva la URL anterior) */}
      <Route path="/demo" element={<InvitationPage slug="demo-sofia-roberto" />} />

      {/* Auth */}
      <Route path="/login" element={<Login />} />

      {/* Admin */}
      <Route
        path="/app"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/app/event/:id"
        element={
          <RequireAuth>
            <EventEditor />
          </RequireAuth>
        }
      />
      <Route
        path="/app/event/:id/guests"
        element={
          <RequireAuth>
            <Guests />
          </RequireAuth>
        }
      />

      {/* Invitación pública */}
      <Route path="/i/:slug" element={<InvitationPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
