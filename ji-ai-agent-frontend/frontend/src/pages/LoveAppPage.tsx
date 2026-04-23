import { TopBar } from '@/components/TopBar'
import { ChatRoom } from '@/components/ChatRoom'

export default function LoveAppPage() {
  return (
    <div className="flex flex-col h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <TopBar
        title="AI Love Advisor"
        showBack
        showMenuToggle
      />
      <ChatRoom
        appType="love_app"
        placeholder="Share your thoughts... I'm here to listen and help (Enter to send)"
        emptyTitle="AI Love Advisor"
        emptySubtitle="Whether it's dating tips, emotional analysis, or relationship advice — I'm here to help"
      />
    </div>
  )
}
