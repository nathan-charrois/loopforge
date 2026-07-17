import { useEffect } from 'react'

type KeyboardShortcutHandlers = {
  onCopy?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onEscape?: () => void
  onPaste?: () => void
  onRedo?: () => void
  onUndo?: () => void
}

export function useKeyboardShortcuts({
  onCopy,
  onDelete,
  onDuplicate,
  onEscape,
  onPaste,
  onRedo,
  onUndo,
}: KeyboardShortcutHandlers): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target) && event.key !== 'Escape') {
        return
      }

      const modifierPressed = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (event.key === 'Escape' && onEscape !== undefined) {
        event.preventDefault()
        onEscape()
        return
      }

      if ((event.key === 'Backspace' || event.key === 'Delete') && onDelete !== undefined) {
        event.preventDefault()
        onDelete()
        return
      }

      if (modifierPressed && key === 'z' && event.shiftKey && onRedo !== undefined) {
        event.preventDefault()
        onRedo()
        return
      }

      if (modifierPressed && key === 'z' && onUndo !== undefined) {
        event.preventDefault()
        onUndo()
        return
      }

      if (modifierPressed && key === 'y' && onRedo !== undefined) {
        event.preventDefault()
        onRedo()
        return
      }

      if (modifierPressed && key === 'd' && onDuplicate !== undefined) {
        event.preventDefault()
        onDuplicate()
        return
      }

      if (modifierPressed && key === 'c' && onCopy !== undefined) {
        event.preventDefault()
        onCopy()
        return
      }

      if (modifierPressed && key === 'v' && onPaste !== undefined) {
        event.preventDefault()
        onPaste()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onCopy,
    onDelete,
    onDuplicate,
    onEscape,
    onPaste,
    onRedo,
    onUndo,
  ])
}

function isEditableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
}
