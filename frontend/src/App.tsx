import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { ToastProvider } from './contexts/ToastContext'

/**
 * Root application component
 * Provides routing with global context providers
 */
function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}

export default App
