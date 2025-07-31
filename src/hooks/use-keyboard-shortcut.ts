import { useEffect, useCallback } from 'react'

interface UseKeyboardShortcutOptions {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  preventDefault?: boolean
}

export function useKeyboardShortcut(
  options: UseKeyboardShortcutOptions,
  callback: () => void,
  deps: unknown[] = []
) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const {
      key,
      ctrlKey = false,
      altKey = false,
      shiftKey = false,
      metaKey = false,
      preventDefault = true
    } = options

    // Eğer input, textarea veya contenteditable element'te isek ignore et
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true'
    ) {
      return
    }

    // Key kombinasyonunu kontrol et
    const keyMatches = event.key.toLowerCase() === key.toLowerCase()
    const ctrlMatches = event.ctrlKey === ctrlKey
    const altMatches = event.altKey === altKey
    const shiftMatches = event.shiftKey === shiftKey
    const metaMatches = event.metaKey === metaKey

    if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
      if (preventDefault) {
        event.preventDefault()
        event.stopPropagation()
      }
      callback()
    }
  }, [options, callback, ...deps])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Özel Ctrl+K hook'u
export function useCtrlK(callback: () => void, deps: unknown[] = []) {
  useKeyboardShortcut(
    {
      key: 'k',
      ctrlKey: true,
      preventDefault: true
    },
    callback,
    deps
  )
}