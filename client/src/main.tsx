import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ForgeProvider } from './context/ForgeContext.tsx'

createRoot(document.getElementById('root')!).render(
  <ForgeProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </ForgeProvider>,
)
