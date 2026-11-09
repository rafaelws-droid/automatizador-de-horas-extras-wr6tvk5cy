/* Select Component — mesma API do shadcn/ui (Select, SelectGroup, SelectValue,
 * SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator), mas
 * implementada sobre o <select> NATIVO do navegador.
 *
 * Motivo: bug conhecido do @radix-ui/react-select 2.3.1 com React 19 (refs
 * compostas de identidade instável — radix-ui/primitives #3799/#3963) que
 * provoca um loop síncrono de re-render no commit e CONGELA a aba do
 * navegador no desktop ao abrir/selecionar uma opção. O select nativo é
 * imune ao bug e se comporta igual em PC e celular.
 */
import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

interface SelectItemData {
  value: string
  label: string
}

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  items: SelectItemData[]
  registerItem: (item: SelectItemData) => void
  unregisterItem: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)
const TriggerContext = React.createContext<{
  setPlaceholder: (placeholder: string) => void
} | null>(null)

function extractItemLabel(children: React.ReactNode, value: string): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  const texts = React.Children.toArray(children).filter(
    (child): child is string | number => typeof child === 'string' || typeof child === 'number',
  )
  return texts.length > 0 ? texts.join('') : value
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const Select = ({ value, defaultValue = '', onValueChange, children }: SelectProps) => {
  const [items, setItems] = React.useState<SelectItemData[]>([])
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const registerItem = React.useCallback((item: SelectItemData) => {
    setItems((prev) =>
      prev.some((existing) => existing.value === item.value) ? prev : [...prev, item],
    )
  }, [])

  const unregisterItem = React.useCallback((itemValue: string) => {
    setItems((prev) => prev.filter((existing) => existing.value !== itemValue))
  }, [])

  const handleChange = React.useCallback(
    (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    },
    [isControlled, onValueChange],
  )

  const contextValue = React.useMemo<SelectContextValue>(
    () => ({
      value: currentValue ?? '',
      onValueChange: handleChange,
      items,
      registerItem,
      unregisterItem,
    }),
    [currentValue, handleChange, items, registerItem, unregisterItem],
  )

  return <SelectContext.Provider value={contextValue}>{children}</SelectContext.Provider>
}
Select.displayName = 'Select'

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
SelectGroup.displayName = 'SelectGroup'

const SelectValue = ({
  placeholder,
  children: _children,
}: {
  placeholder?: string
  children?: React.ReactNode
}) => {
  const triggerContext = React.useContext(TriggerContext)
  React.useEffect(() => {
    triggerContext?.setPlaceholder(placeholder ?? '')
  }, [triggerContext, placeholder])
  return null
}
SelectValue.displayName = 'SelectValue'

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { children?: React.ReactNode }
>(({ className, children, ...props }, ref) => {
  const selectContext = React.useContext(SelectContext)
  const [placeholder, setPlaceholder] = React.useState('')

  if (!selectContext) {
    throw new Error('SelectTrigger deve ser usado dentro de <Select>')
  }

  const { value, onValueChange, items } = selectContext

  return (
    <TriggerContext.Provider value={{ setPlaceholder }}>
      <span className="relative block">
        <select
          ref={ref}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(
            'h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm shadow-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
        {/* Register the placeholder from <SelectValue> without rendering it */}
        <span className="hidden">{children}</span>
      </span>
    </TriggerContext.Provider>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = ({ children }: { children: React.ReactNode }) => {
  // No select nativo as opções são registradas pelo próprio <SelectItem>;
  // este wrapper existe apenas para manter a API do shadcn.
  return <>{children}</>
}
SelectContent.displayName = 'SelectContent'

const SelectLabel = ({ children }: { children: React.ReactNode }) => (
  // Rótulos de grupo não existem em <select> nativo; renderizado como oculto
  // apenas para compatibilidade de API.
  <span className="hidden">{children}</span>
)
SelectLabel.displayName = 'SelectLabel'

interface SelectItemProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

const SelectItem = ({ value, disabled, className: _className, children }: SelectItemProps) => {
  const selectContext = React.useContext(SelectContext)
  const label = extractItemLabel(children, value)

  React.useEffect(() => {
    if (!selectContext) return
    selectContext.registerItem({ value, label })
    return () => selectContext.unregisterItem(value)
  }, [selectContext, value, label])

  if (!selectContext) {
    throw new Error('SelectItem deve ser usado dentro de <Select>')
  }

  return null
}
SelectItem.displayName = 'SelectItem'

const SelectSeparator = () => null
SelectSeparator.displayName = 'SelectSeparator'

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
