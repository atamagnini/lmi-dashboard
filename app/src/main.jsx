// Mount the React App into the DIV rendered by the shortcode.
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const el = document.getElementById('lmi-dashboard-root')
if (el) {
  const root = createRoot(el)
  root.render(<App />)
}
