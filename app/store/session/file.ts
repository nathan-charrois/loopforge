export function downloadTextFile(
  contents: string,
  filename: string,
): void {
  const blob = new Blob([contents], {
    type: 'application/json',
  })

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(url)
}

export async function openTextFile(): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')

    input.type = 'file'
    input.accept = 'application/json,.json'

    input.addEventListener('change', async () => {
      const file = input.files?.[0]

      if (!file) {
        resolve(undefined)
        return
      }

      try {
        resolve(await file.text())
      }
      catch (error) {
        reject(error)
      }
    })

    input.click()
  })
}
