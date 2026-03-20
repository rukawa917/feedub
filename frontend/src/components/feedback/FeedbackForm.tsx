/**
 * FeedbackForm Component
 *
 * Form for collecting user feedback with type selector,
 * description, and optional email for follow-up.
 */

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { submitFeedback, type FeedbackType } from '@/services/feedback-service'
import { Bug, Lightbulb, MessageCircle, CheckCircle } from 'lucide-react'

const feedbackFormSchema = z.object({
  type: z.enum(['bug', 'feature', 'general'] as const, {
    required_error: 'Please select a feedback type',
  }),
  description: z
    .string()
    .min(10, 'Please provide at least 10 characters')
    .max(2000, 'Description is too long (max 2000 characters)'),
  email: z
    .string()
    .transform((val) => (val === '' ? undefined : val))
    .pipe(z.string().email('Invalid email address').optional()),
})

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>

interface FeedbackFormProps {
  onSuccess?: () => void
}

const feedbackTypeLabels: Record<FeedbackType, { label: string; icon: typeof Bug }> = {
  bug: { label: 'Bug Report', icon: Bug },
  feature: { label: 'Feature Request', icon: Lightbulb },
  general: { label: 'General Feedback', icon: MessageCircle },
}

export function FeedbackForm({ onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      type: undefined,
      description: '',
      email: '',
    },
  })

  const handleSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true)
    setSubmitError(null)

    const result = await submitFeedback({
      type: data.type,
      description: data.description,
      email: data.email || undefined,
    })

    setIsSubmitting(false)

    if (result.success) {
      setIsSuccess(true)
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } else {
      setSubmitError(result.error || 'Failed to submit feedback')
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-3">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Thank you!</h3>
        <p className="mt-1 text-sm text-foreground-muted">
          Your feedback has been submitted successfully.
        </p>
      </div>
    )
  }

  return (
    <FormProvider {...form}>
      <Form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
        <FormField name="type">
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select
              onValueChange={(value) => form.setValue('type', value as FeedbackType)}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(
                  Object.entries(feedbackTypeLabels) as [
                    FeedbackType,
                    typeof feedbackTypeLabels.bug,
                  ][]
                ).map(([value, { label, icon: Icon }]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="description">
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Tell us what's on your mind..."
                className="min-h-[120px] resize-none"
                disabled={isSubmitting}
              />
            </FormControl>
            <FormDescription>
              {form.watch('type') === 'bug'
                ? 'Describe the issue and steps to reproduce'
                : form.watch('type') === 'feature'
                  ? 'Describe the feature you would like to see'
                  : 'Share your thoughts with us'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField name="email">
          <FormItem>
            <FormLabel>Email (optional)</FormLabel>
            <FormControl>
              <Input type="email" placeholder="your@email.com" disabled={isSubmitting} />
            </FormControl>
            <FormDescription>If you'd like us to follow up with you</FormDescription>
            <FormMessage />
          </FormItem>
        </FormField>

        {submitError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </Form>
    </FormProvider>
  )
}
