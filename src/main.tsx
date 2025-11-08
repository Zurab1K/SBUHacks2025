import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { CallsProvider } from './context/CallsContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <CallsProvider>
        <App />
      </CallsProvider>
    </BrowserRouter>
  </StrictMode>,
)
