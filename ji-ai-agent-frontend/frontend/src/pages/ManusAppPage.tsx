import { TopBar } from '@/components/TopBar'
import { ChatRoom } from '@/components/ChatRoom'

export default function ManusAppPage() {
  return (
    <div className="flex flex-col h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <TopBar
        title="AI Super Agent"
        showBack
        showMenuToggle
      />
      <ChatRoom
        appType="manus"
        placeholder="Tell me a task and I'll use tools to complete it... (Enter to send)"
        emptyTitle="AI Super Agent"
        emptySubtitle="I can search the web, execute code, and analyze data — just tell me what you need"
      />
    </div>
  )
}
