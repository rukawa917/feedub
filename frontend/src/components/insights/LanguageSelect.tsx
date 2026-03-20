import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../../types/insights'
import { Globe } from 'lucide-react'

interface LanguageSelectProps {
  value: SupportedLanguage
  onChange: (value: SupportedLanguage) => void
  disabled?: boolean
}

export function LanguageSelect({ value, onChange, disabled }: LanguageSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Select language" />
        </div>
      </SelectTrigger>
      <SelectContent className="!bg-[hsl(220,12%,11%)] border-border">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
          <SelectItem key={code} value={code}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
