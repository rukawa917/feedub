/**
 * Form components - Refined Editorial Design System
 * Integrates React Hook Form with design system colors
 */

import * as React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Form component - provides form context
 */
const Form = ({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) => {
  return <form {...props}>{children}</form>
}

/**
 * FormField - wrapper for form fields with React Hook Form integration
 */
interface FormFieldContextValue {
  name: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue)

const FormField = ({ name, children }: { name: string; children: React.ReactNode }) => {
  return (
    <FormFieldContext.Provider value={{ name }}>
      <Controller name={name} render={() => <>{children}</>} />
    </FormFieldContext.Provider>
  )
}

/**
 * FormItem - container for a single form field
 */
const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('space-y-2', className)} {...props} />
  }
)
FormItem.displayName = 'FormItem'

/**
 * FormLabel - label for a form field
 */
const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => {
  const { name } = React.useContext(FormFieldContext)
  const { formState } = useFormContext()
  const error = formState.errors[name]

  return (
    <Label
      ref={ref}
      className={cn(error && 'text-destructive', className)}
      htmlFor={name}
      {...props}
    />
  )
})
FormLabel.displayName = 'FormLabel'

/**
 * FormControl - wrapper for form control elements (inputs, etc.)
 */
const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ ...props }, ref) => {
    const { name } = React.useContext(FormFieldContext)
    const { register, formState } = useFormContext()
    const error = formState.errors[name]

    return (
      <div ref={ref} {...props}>
        {React.Children.map(props.children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              ...register(name),
              id: name,
              'aria-invalid': error ? 'true' : 'false',
              'aria-describedby': error ? `${name}-error` : undefined,
            } as Record<string, unknown>)
          }
          return child
        })}
      </div>
    )
  }
)
FormControl.displayName = 'FormControl'

/**
 * FormDescription - helper text for a form field
 * Uses foreground-muted for proper contrast in both themes
 */
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn('text-sm text-foreground-muted', className)} {...props} />
})
FormDescription.displayName = 'FormDescription'

/**
 * FormMessage - error message for a form field
 */
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { name } = React.useContext(FormFieldContext)
  const { formState } = useFormContext()
  const error = formState.errors[name]
  const body = error ? String(error.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={`${name}-error`}
      className={cn('text-sm font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = 'FormMessage'

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage }
