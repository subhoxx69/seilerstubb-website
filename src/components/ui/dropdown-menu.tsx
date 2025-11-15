import * as React from "react"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end' | 'center'
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  inset?: boolean
  disabled?: boolean
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
} | null>(null)

export function DropdownMenu({ children, open, onOpenChange }: any) {
  const [isOpen, setIsOpen] = React.useState(open ?? false)

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open)
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
      <div className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuTriggerProps
>(({ className, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)
  
  return (
    <button
      ref={ref}
      onClick={(e) => {
        e.preventDefault()
        context?.setIsOpen(!context?.isOpen)
        props.onClick?.(e)
      }}
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    />
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

export const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  DropdownMenuContentProps
>(({ className, align = 'end', ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      const dropdown = ref && 'current' in ref ? ref.current : null
      if (dropdown && !dropdown.contains(target)) {
        context?.setIsOpen(false)
      }
    }

    if (context?.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [context?.isOpen])

  if (!context?.isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-2 rounded-md border border-slate-200 bg-white shadow-md min-w-[8rem]",
        align === 'end' && 'right-0',
        align === 'start' && 'left-0',
        className
      )}
      {...props}
    />
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

export const DropdownMenuItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, inset, disabled, ...props }, ref) => {
  const context = React.useContext(DropdownMenuContext)

  return (
    <button
      ref={ref}
      disabled={disabled}
      onClick={(e) => {
        props.onClick?.(e)
        context?.setIsOpen(false)
      }}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed w-full text-left",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

export const DropdownMenuGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("overflow-hidden", className)} {...props} />
))
DropdownMenuGroup.displayName = "DropdownMenuGroup"

export const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

export const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-100", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

export const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps & { checked?: boolean }
>(({ className, checked, ...props }, ref) => (
  <DropdownMenuItem
    ref={ref}
    className={cn(className)}
    {...props}
  />
))
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

export const DropdownMenuRadioItem = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ className, ...props }, ref) => (
  <DropdownMenuItem
    ref={ref}
    className={cn(className)}
    {...props}
  />
))
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

export const DropdownMenuSubTrigger = React.forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "flex items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-slate-100 hover:bg-slate-100",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

export const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-md border border-slate-200 bg-white p-1 shadow-lg",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

export const DropdownMenuSub = ({ children }: any) => (
  <div className="relative">{children}</div>
)

export const DropdownMenuPortal = ({ children }: any) => children

export const DropdownMenuRadioGroup = ({ children }: any) => children

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn("ml-auto text-xs tracking-widest text-slate-500", className)}
    {...props}
  />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"
