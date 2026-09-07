"use client"

import * as React from "react"
import { toast } from "sonner"

export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = React.useState(initial)
  const [loaded, setLoaded] = React.useState(false)
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(`meridian-v2:${key}`)
      if (saved) setValue(JSON.parse(saved))
    } catch {
      toast.error("Saved data could not be restored", { description: "The sample data is available. Check that browser storage is enabled." })
    }
    setLoaded(true)
  }, [key])
  React.useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(`meridian-v2:${key}`, JSON.stringify(value)) }
    catch { toast.error("Changes could not be saved to this browser", { description: "Free some browser storage before leaving this page.", id: "storage-error" }) }
  }, [key, value, loaded])
  return [value, setValue, loaded] as const
}
