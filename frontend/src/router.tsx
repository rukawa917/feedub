/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { LoginPage } from './pages/Login'
import { VerifyCodePage } from './pages/VerifyCode'
import { Dashboard } from './pages/Dashboard'
import { Insights } from './pages/Insights'
import { MessageDetail } from './pages/MessageDetail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import { NotFoundPage } from './pages/NotFound'
import { ErrorPage } from './pages/ErrorPage'
import { requireAuth, redirectIfAuthenticated } from './utils/route-protection'
import { useAuthStore } from './stores/auth'
import { FeedbackWidget } from './components/feedback/FeedbackWidget'

/**
 * Root layout component
 * Wraps all routes and provides global components
 */
function RootLayout() {
  return (
    <>
      <FeedbackWidget />
      <Outlet />
    </>
  )
}

/**
 * Root redirect component
 * Redirects to dashboard if authenticated, login otherwise
 */
function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

/**
 * React Router v7 configuration with authentication protection
 *
 * T041: Authentication routes (/login, /verify-code)
 * T043: Protected routes with requireAuth loader
 *
 * Route structure:
 * - / → Redirects to /dashboard (if authenticated) or /login (if not)
 * - /login → Public (redirects to dashboard if already authenticated)
 * - /verify-code → Public (redirects to login if missing state)
 * - /dashboard → Protected (requires authentication)
 * - /messages/:messageId → Protected (requires authentication)
 * - /insights → Protected (LLM Insights page)
 * - /insights/:insightId → Protected (Insight detail view)
 *
 * Reference: spec.md FR-006 (route protection)
 */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/',
        element: <RootRedirect />,
      },
      {
        path: '/login',
        element: <LoginPage />,
        loader: redirectIfAuthenticated,
      },
      {
        path: '/verify-code',
        element: <VerifyCodePage />,
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
        loader: requireAuth,
      },
      {
        path: '/messages/:messageId',
        element: <MessageDetail />,
        loader: requireAuth,
      },
      {
        path: '/insights',
        element: <Insights />,
        loader: requireAuth,
      },
      {
        path: '/insights/:insightId',
        element: <Insights />,
        loader: requireAuth,
      },
      {
        path: '/privacy',
        element: <Privacy />,
      },
      {
        path: '/terms',
        element: <Terms />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])
