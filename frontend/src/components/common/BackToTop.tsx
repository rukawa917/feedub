import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BackToTopProps {
  /** Distance scrolled before button appears (default 500px) */
  threshold?: number
  /** Custom className */
  className?: string
}

/**
 * BackToTop component
 *
 * Floating button that appears when user scrolls down past threshold.
 * Smooth scroll to top on click.
 * Position: fixed, bottom-right, z-40
 * Animation: fade in/out
 */
export function BackToTop({ threshold = 500, className }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold
      setIsVisible(scrolled)
    }

    // Initial check
    handleScroll()

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        // Fixed positioning
        'fixed bottom-6 right-6 z-40',
        // Size and shape
        'h-11 w-11 rounded-full',
        // Shadow for elevation
        'shadow-lg hover:shadow-xl',
        // Fade animation
        'transition-all duration-300 ease-in-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        className
      )}
      aria-label="Back to top"
      data-testid="back-to-top"
    >
      <ChevronUp className="h-5 w-5" />
    </Button>
  )
}
