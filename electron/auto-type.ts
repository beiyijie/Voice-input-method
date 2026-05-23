import { exec } from 'child_process'

/**
 * Set clipboard content via .NET clipboard API.
 * Handles Unicode correctly.
 */
function setClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const escaped = text.replace(/'/g, "''")
    const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText('${escaped}')`
    exec(
      `powershell -NoProfile -Command "${script}"`,
      { timeout: 5000 },
      (err: Error | null) => (err ? reject(err) : resolve())
    )
  })
}

/**
 * Send Ctrl+V to paste clipboard content into the focused window.
 * Uses .NET SendKeys.SendWait for broader app compatibility.
 */
function pasteClipboard(): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')`
    exec(
      `powershell -NoProfile -Command "${script}"`,
      { timeout: 5000 },
      (err: Error | null) => (err ? reject(err) : resolve())
    )
  })
}

/**
 * Type text into the currently focused window via clipboard paste.
 * Does NOT manipulate any Electron window — focus stays where the user left it.
 */
export async function typeText(text: string): Promise<void> {
  if (!text) return

  try {
    await setClipboard(text)
    await new Promise((r) => setTimeout(r, 80))
    await pasteClipboard()
  } catch (err) {
    console.error('Clipboard paste failed:', err)
  }
}
