export type ToastVariant = 'default' | 'success' | 'error'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  duration?: number
}

export interface ToastItem extends ToastOptions {
  id: string
  variant: ToastVariant
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners = new Set<Listener>()
let nextId = 0

function emit() {
  const snapshot = [...toasts]
  listeners.forEach((listener) => listener(snapshot))
}

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener)
  listener([...toasts])

  return () => {
    listeners.delete(listener)
  }
}

export function dismissToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id)
  emit()
}

export function toast(options: ToastOptions) {
  const id = `toast-${++nextId}`
  const item: ToastItem = {
    id,
    variant: 'default',
    duration: 5000,
    ...options,
  }

  toasts = [...toasts.slice(-3), item]
  emit()

  if (item.duration && item.duration > 0) {
    setTimeout(() => dismissToast(id), item.duration)
  }

  return id
}

export function toastSuccess(title: string, description?: string) {
  return toast({ title, description, variant: 'success' })
}

export function toastError(title: string, description?: string) {
  return toast({ title, description, variant: 'error' })
}

export function notifyError(message: string) {
  return toastError('Action failed', message)
}
