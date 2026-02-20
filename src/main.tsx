import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { repository } from './repositories';

// Initialize repository (seeds DB if empty and config is valid)
// LocalRepository doesn't need initialization, so we check if the method exists
if ('initialize' in repository && typeof repository.initialize === 'function') {
    repository.initialize();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
