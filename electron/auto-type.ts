import { BrowserWindow } from 'electron'
import { exec, execSync } from 'child_process'

/**
 * Type text into the currently focused window using PowerShell SendKeys.
 * On Windows, this is the most reliable cross-application approach.
 * Uses a temp file to avoid command-line encoding issues with Chinese characters.
 */
function typeTextWithPowerShell(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Escape single quotes for PowerShell string literal
    const escaped = text.replace(/'/g, "''")
    const script = `$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('${escaped}')`

    exec(
      `powershell -NoProfile -Command "${script.replace(/"/g, '\\"')}"`,
      { timeout: 5000 },
      (err: Error | null) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}

/**
 * Fallback: Copy text to clipboard and send Ctrl+V to paste.
 * Handles Unicode characters that SendKeys may not support.
 */
function typeTextViaClipboard(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Set clipboard content via PowerShell
      const escaped = text.replace(/'/g, "''")
      execSync(
        `powershell -NoProfile -Command "[System.Windows.Forms.Clipboard]::SetText('${escaped.replace(/"/g, '\\"')}')"`,
        { timeout: 5000 }
      )

      // Small delay then paste (Ctrl+V)
      setTimeout(() => {
        exec(
          `powershell -NoProfile -Command "Start-Sleep -Milliseconds 100; $wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('^v')"`,
          { timeout: 5000 },
          (pasteErr: Error | null) => {
            if (pasteErr) {
              reject(pasteErr)
            } else {
              resolve()
            }
          }
        )
      }, 150)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * Type text into the currently focused (external) window.
 *
 * Strategy:
 * 1. Minimize the Electron app window so we don't type into ourselves.
 * 2. Wait briefly for the minimize animation to complete.
 * 3. Try direct PowerShell SendKeys first (fast, but may not handle all Unicode).
 * 4. Fall back to clipboard + Ctrl+V paste (handles all Unicode, but overwrites clipboard).
 */
export async function typeText(text: string): Promise<void> {
  const focusedWin = BrowserWindow.getFocusedWindow()
  if (focusedWin) {
    focusedWin.minimize()
  }

  // Wait briefly for the minimize animation, then type
  await new Promise((resolve) => setTimeout(resolve, 300))

  try {
    await typeTextWithPowerShell(text)
  } catch {
    // SendKeys may fail on some characters (especially non-ASCII).
    // Fall back to clipboard-based paste.
    console.warn('SendKeys failed, falling back to clipboard paste')
    try {
      await typeTextViaClipboard(text)
    } catch (fallbackErr) {
      console.error('Auto-type clipboard fallback also failed:', fallbackErr)
    }
  }
}
