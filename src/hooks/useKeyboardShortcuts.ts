'use client'
import { useEffect, useCallback } from 'react'

export interface Shortcut {
  key: string          // e.g. 'k', '/', 'Escape'
  meta?: boolean       // Cmd (Mac) / Ctrl (Windows)
  shift?: boolean
  description: string
  handler: () => void
}

/**
 * Register keyboard shortcuts. Returns a cleanup function.
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: 'k', meta: true, description: 'Open search', handler: openSearch },
 *   { key: 'Escape', description: 'Close modal', handler: closeModal },
 * ])
 */
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        // Still allow Escape from inputs
        if (e.key !== 'Escape') return
      }

      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.meta ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey
        if (e.key === shortcut.key && metaMatch && shiftMatch) {
          e.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

/** Standard app-wide shortcut definitions */
export const SHORTCUTS = {
  SEARCH: { key: 'k', meta: true, description: 'Open search (⌘K)' },
  CLOSE: { key: 'Escape', description: 'Close / dismiss' },
  NEW_ALERT: { key: 'a', meta: true, description: 'New alert (⌘A)' },
  TOGGLE_SIDEBAR: { key: 'b', meta: true, description: 'Toggle sidebar (⌘B)' },
  FOCUS_SEARCH: { key: '/', description: 'Focus search (/)' },
} as const
