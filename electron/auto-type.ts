import { exec } from 'child_process'

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

function sendKeys(keys: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keys}')`
    exec(
      `powershell -NoProfile -Command "${script}"`,
      { timeout: 5000 },
      (err: Error | null) => (err ? reject(err) : resolve())
    )
  })
}

/** Select all (Ctrl+A) then paste. Replaces whatever is in the focused input. */
export async function replaceText(text: string): Promise<void> {
  if (!text) return
  try {
    await setClipboard(text)
    await new Promise((r) => setTimeout(r, 60))
    await sendKeys('^a')       // Ctrl+A = select all
    await new Promise((r) => setTimeout(r, 40))
    await sendKeys('^v')       // Ctrl+V = paste
  } catch (err) {
    console.error('replaceText failed:', err)
  }
}

/** Paste text at cursor position (append). */
export async function typeText(text: string): Promise<void> {
  if (!text) return
  try {
    await setClipboard(text)
    await new Promise((r) => setTimeout(r, 80))
    await sendKeys('^v')
  } catch (err) {
    console.error('typeText failed:', err)
  }
}
