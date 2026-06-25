import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConnectionProvider } from './contexts/ConnectionProvider'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConnectionProvider>
      <App />
    </ConnectionProvider>
  </StrictMode>,
)
