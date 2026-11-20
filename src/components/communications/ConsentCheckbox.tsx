/**
 * Consent Checkbox Component
 * 
 * Single checkbox for one channel/topic consent
 * NEVER bundled, NEVER pre-checked
 */

'use client'

import { useState } from 'react'
import type { CommunicationChannel, CommunicationTopic } from '@prisma/client'

interface ConsentCheckboxProps {
  channel: CommunicationChannel
  topic: CommunicationTopic
  label: string
  description?: string
  required?: boolean
  onChange?: (checked: boolean) => void
  name?: string
}

export function ConsentCheckbox({
  channel,
  topic,
  label,
  description,
  required = false,
  onChange,
  name,
}: ConsentCheckboxProps) {
  const [checked, setChecked] = useState(false)
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked
    setChecked(newChecked)
    onChange?.(newChecked)
  }
  
  const inputName = name || `consent_${channel}_${topic}`.toLowerCase()
  
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={inputName}
        name={inputName}
        checked={checked}
        onChange={handleChange}
        required={required}
        className="mt-1 w-4 h-4 rounded border-gray-300 text-coral focus:ring-coral focus:ring-offset-2"
      />
      <div className="flex-1">
        <label htmlFor={inputName} className="text-sm font-medium text-ink dark:text-sand-paper cursor-pointer">
          {label}
          {required && <span className="text-coral ml-1">*</span>}
        </label>
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        )}
        {/* Hidden inputs for form submission */}
        <input type="hidden" name={`${inputName}_channel`} value={channel} />
        <input type="hidden" name={`${inputName}_topic`} value={topic} />
      </div>
    </div>
  )
}
