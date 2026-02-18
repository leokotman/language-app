export const DEBOUNCE_MS = 400
export const STORE_FILTER_DEBOUNCE_MS = 100

export const DIRECTION_OPTIONS: {
  value: string
  label: string
  from: string
  to: string
}[] = [
  { value: 'en-ru', label: 'English → Russian', from: 'en', to: 'ru' },
  { value: 'ru-en', label: 'Russian → English', from: 'ru', to: 'en' },
  { value: 'en-sr', label: 'English → Serbian', from: 'en', to: 'sr' },
  { value: 'sr-en', label: 'Serbian → English', from: 'sr', to: 'en' },
  { value: 'ru-sr', label: 'Russian → Serbian (via English)', from: 'ru', to: 'sr' },
  { value: 'sr-ru', label: 'Serbian → Russian (via English)', from: 'sr', to: 'ru' },
]
