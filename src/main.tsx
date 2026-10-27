import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { applyStoredTheme } from './lib/theme'

// Belt-and-suspenders: index.html's inline script already applies this before first paint
// (to avoid a flash); this re-applies it once the React bundle is live, which is a no-op in
// the common case but keeps the DOM attribute source-of-truth in one place (lib/theme.ts).
applyStoredTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
