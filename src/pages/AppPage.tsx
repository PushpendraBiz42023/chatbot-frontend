import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useChat } from "../features/chat/hooks/useChat";
import { ChatSidebar } from "../features/chat/components/ChatSidebar";
import { ChatMessageList } from "../features/chat/components/ChatMessageList";
import { ChatComposer } from "../features/chat/components/ChatComposer";
import { ProviderSwitchCard } from "../features/chat/components/ProviderSwitchCard";
import { providerModelLabel } from "../features/chat/utils/providerLabels";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { Spinner } from "../components/Spinner";
import { UserMenu } from "../components/UserMenu";

/** The `/app` (and `/app/chat/:conversationId`) chat workspace: header, sidebar, message list, composer. */
export function AppPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Bumped whenever a brand-new conversation is adopted, so the sidebar pulls it into its list.
  const [sidebarRefreshSignal, setSidebarRefreshSignal] = useState(0);

  const handleConversationCreated = useCallback(
    (id: string) => {
      navigate(`/app/chat/${id}`, { replace: true });
      setSidebarRefreshSignal((prev) => prev + 1);
    },
    [navigate],
  );

  const handleConversationUpdated = useCallback(() => {
    setSidebarRefreshSignal((prev) => prev + 1);
  }, []);

  const {
    messages,
    isStreaming,
    isLoadingHistory,
    error,
    sendMessage,
    regenerate,
    stop,
    newChat,
    activeProvider,
    activeModel,
    providerIssue,
    isSwitchingProvider,
    switchProvider,
    dismissProviderIssue,
  } = useChat({
    conversationId,
    onConversationCreated: handleConversationCreated,
    onConversationUpdated: handleConversationUpdated,
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleNewChat = () => {
    newChat();
    navigate("/app");
    setIsSidebarOpen(false);
  };

  const handleActiveConversationDeleted = () => {
    newChat();
    navigate("/app");
  };

  const canRegenerate = !isStreaming && !error && !providerIssue && !isLoadingHistory && messages.length > 0;

  return (
    <div className="chat-workspace">
      <header className="chat-header">
        <div className="chat-header-left">
          <button
            type="button"
            className="chat-sidebar-toggle"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((prev) => !prev)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <span className="landing-brand">ChatBot</span>
        </div>
        <div className="chat-header-right">
          {/*
            UX-only convenience: hiding this for non-admins is not the security boundary.
            The backend's `requireAdmin` middleware is what actually protects /api/admin/*
            routes; even if this link were shown/forced for a non-admin, the API would
            still reject them with 403 ADMIN_REQUIRED.
          */}
          {user?.role === "admin" ? (
            <Link to="/app/admin" className="chat-admin-link">
              Admin
            </Link>
          ) : null}
          <UserMenu user={user} onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />
        </div>
      </header>

      <div className="chat-body">
        <ChatSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          activeConversationId={conversationId}
          refreshSignal={sidebarRefreshSignal}
          onActiveConversationDeleted={handleActiveConversationDeleted}
        />

        <main className="chat-main">
          <div className="chat-scroll-area">
            {isLoadingHistory ? <Spinner label="Loading conversation…" /> : <ChatMessageList messages={messages} />}
          </div>

          {providerIssue ? (
            <ProviderSwitchCard
              issue={providerIssue}
              isSwitching={isSwitchingProvider}
              onSwitch={switchProvider}
              onDismiss={dismissProviderIssue}
            />
          ) : error ? (
            <div className="chat-error-bar">
              <Alert message={error} />
              <Button variant="secondary" onClick={regenerate}>
                Retry
              </Button>
            </div>
          ) : canRegenerate ? (
            <div className="chat-regenerate-bar">
              <Button variant="ghost" onClick={regenerate}>
                Regenerate response
              </Button>
            </div>
          ) : null}

          {!isLoadingHistory ? (
            <p className="chat-provider-label">{providerModelLabel(activeProvider, activeModel)}</p>
          ) : null}

          <ChatComposer isStreaming={isStreaming} onSend={sendMessage} onStop={stop} />
        </main>
      </div>
    </div>
  );
}
