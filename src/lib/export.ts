import type { ChatSession } from "@/types/chat"

export function exportAsMarkdown(session: ChatSession): string {
  let markdown = `# ${session.title}\n\n`
  markdown += `*Created: ${session.createdAt.toLocaleString()}*\n\n`
  markdown += `---\n\n`

  session.messages.forEach((message) => {
    const role = message.role === "user" ? "You" : "GLaDOS"
    markdown += `### ${role}\n\n`
    markdown += `${message.content}\n\n`
    
    if (message.images && message.images.length > 0) {
      markdown += `*[${message.images.length} image(s) attached]*\n\n`
    }
    
    markdown += `---\n\n`
  })

  return markdown
}

export function exportAsText(session: ChatSession): string {
  let text = `${session.title}\n`
  text += `Created: ${session.createdAt.toLocaleString()}\n`
  text += `${"=".repeat(50)}\n\n`

  session.messages.forEach((message) => {
    const role = message.role === "user" ? "You" : "GLaDOS"
    text += `${role}:\n${message.content}\n\n`
    
    if (message.images && message.images.length > 0) {
      text += `[${message.images.length} image(s) attached]\n\n`
    }
    
    text += `${"-".repeat(50)}\n\n`
  })

  return text
}

export function exportAsJSON(session: ChatSession): string {
  return JSON.stringify(session, null, 2)
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportChat(session: ChatSession, format: "markdown" | "text" | "json") {
  const timestamp = new Date().toISOString().split("T")[0]
  const safeName = session.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()

  let content: string
  let filename: string
  let mimeType: string

  switch (format) {
    case "markdown":
      content = exportAsMarkdown(session)
      filename = `${safeName}_${timestamp}.md`
      mimeType = "text/markdown"
      break
    case "text":
      content = exportAsText(session)
      filename = `${safeName}_${timestamp}.txt`
      mimeType = "text/plain"
      break
    case "json":
      content = exportAsJSON(session)
      filename = `${safeName}_${timestamp}.json`
      mimeType = "application/json"
      break
  }

  downloadFile(content, filename, mimeType)
}
