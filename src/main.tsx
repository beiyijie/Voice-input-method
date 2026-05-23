import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import Subtitle from './pages/Subtitle'

const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/subtitle', element: <Subtitle /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
