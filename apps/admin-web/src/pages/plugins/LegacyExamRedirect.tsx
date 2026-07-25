import { Navigate, useLocation } from 'react-router'

export default function LegacyExamRedirect() {
  const location = useLocation()

  return (
    <Navigate
      replace
      to={`/plugins/exam/app/admin${location.pathname}${location.search}`}
    />
  )
}
