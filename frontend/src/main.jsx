import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'remixicon/fonts/remixicon.css'
import './dark-theme.css'  // Import dark theme styles
import App from './App.jsx'

createRoot(document.getElementById('root')).render(

  <App />

)
