import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'remixicon/fonts/remixicon.css'
import './dark-theme.css'  // Import dark theme styles
import App from './App.jsx'

// Apply dark theme to body
document.body.classList.add('dark-theme')

createRoot(document.getElementById('root')).render(

  <App />

)
