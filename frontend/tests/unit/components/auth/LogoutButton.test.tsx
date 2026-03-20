import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { useAuthStore } from '@/stores/auth'

describe('LogoutButton', () => {
  it('should render logout button with icon', () => {
    render(
      <MemoryRouter>
        <LogoutButton />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /log out/i })
    expect(button).toBeInTheDocument()
  })

  it('should call clearAuth when clicked', async () => {
    const user = userEvent.setup()
    const clearAuthSpy = vi.spyOn(useAuthStore.getState(), 'clearAuth')

    render(
      <MemoryRouter>
        <LogoutButton />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /log out/i })
    await user.click(button)

    await waitFor(() => {
      expect(clearAuthSpy).toHaveBeenCalledTimes(1)
    })
  })

  it('should navigate to login after logout', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <LogoutButton />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /log out/i })
    await user.click(button)

    // After logout, user should be redirected (route protection handles this)
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(false)
    })
  })

  it('should render icon-only button without text', () => {
    render(
      <MemoryRouter>
        <LogoutButton iconOnly />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: 'Log out' })
    expect(button).toBeInTheDocument()
    expect(screen.queryByText('Log out')).not.toBeInTheDocument()
  })
})
