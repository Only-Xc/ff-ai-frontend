import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'
import App from './App'
import { i18nReady } from './i18n'

const root = createRoot(document.getElementById('root')!)

void i18nReady.then(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
