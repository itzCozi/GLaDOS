import { ChatContainer } from "@/components/chat";
import { ThemeProvider } from "@/components/theme-provider";
import { SettingsProvider } from "@/lib/settings-context";

function App() {
  return (
    <SettingsProvider>
      <ThemeProvider defaultTheme="system" storageKey="glados-theme">
        <ChatContainer />
      </ThemeProvider>
    </SettingsProvider>
  );
}

export default App;
