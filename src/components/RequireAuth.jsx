import { Navigate, useLocation } from 'react-router-dom'
import { getSession } from '../lib/store'

export default function RequireAuth({ children }) {
  const session = getSession()
  const loc = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return children
}
