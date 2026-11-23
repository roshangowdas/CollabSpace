import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/routes'
import { CookieConsentBanner } from '@/components/common'

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <CookieConsentBanner />
    </BrowserRouter>
  )
}

export default App
