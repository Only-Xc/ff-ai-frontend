import { Navigate, useLocation } from 'react-router'

export default function LegacyExamRedirect() {
  const location = useLocation()
  let pluginPath = location.pathname

  if (pluginPath === '/attempts') {
    pluginPath = '/exams'
    const search = new URLSearchParams(location.search)
    search.set('tab', 'attempts')
    return (
      <Navigate
        replace
        to={`/platform-apps/plugins/exam${pluginPath}?${search.toString()}`}
      />
    )
  }

  return (
    <Navigate
      replace
      to={`/platform-apps/plugins/exam${pluginPath}${location.search}`}
    />
  )
}
