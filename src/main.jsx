import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import { WorkspaceProvider } from './contexts/WorkspaceContext'
import { PresenceProvider } from './contexts/PresenceContext'
import { NotificationProvider } from './contexts/NotificationContext'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WorkspaceProvider>
          <PresenceProvider>
            <NotificationProvider>
              <App />
              <Toaster position="top-right" richColors closeButton />
            </NotificationProvider>
          </PresenceProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
