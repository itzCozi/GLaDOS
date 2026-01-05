import { ChatContainer } from "@/components/chat"
import { ThemeProvider } from "@/components/theme-provider"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="glados-theme">
      <ChatContainer />
    </ThemeProvider>
  )
}

export default App
