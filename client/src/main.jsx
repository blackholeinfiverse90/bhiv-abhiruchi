import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter future={routerFuture}>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
