import { FormEvent, useEffect, useState } from 'react';
import { createConversation, getConversation, sendMessage } from './api';
import type { Conversation, Message } from './types';

const storageKey = 'drf-gemini-conversation-id';

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function App() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function boot() {
      try {
        const storedId = localStorage.getItem(storageKey);
        let current: Conversation;

        if (storedId) {
          try {
            current = await getConversation(storedId);
          } catch {
            current = await createConversation();
          }
        } else {
          current = await createConversation();
        }

        if (!active) {
          return;
        }
        localStorage.setItem(storageKey, current.id);
        setConversation(current);
      } catch (bootError) {
        if (active) {
          setError(bootError instanceof Error ? bootError.message : 'Failed to initialize chat.');
        }
      } finally {
        if (active) {
          setIsBooting(false);
        }
      }
    }

    boot();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !conversation || isSending) {
      return;
    }

    setIsSending(true);
    setError(null);
    setDraft('');

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    setConversation({
      ...conversation,
      messages: [...conversation.messages, optimisticUserMessage],
    });

    try {
      const response = await sendMessage(conversation.id, content);
      setConversation(response.conversation);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message.');
      setConversation((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter((message) => message.id !== optimisticUserMessage.id),
            }
          : current,
      );
      setDraft(content);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <main className="chat-card">
        <header className="hero">
          <div>
            <p className="eyebrow">Django + React + Gemini</p>
            <h1>Build conversations on a clean backend boundary.</h1>
          </div>
          <div className="status-pill">{isBooting ? 'Starting' : isSending ? 'Gemini thinking' : 'Ready'}</div>
        </header>

        <section className="messages-panel" aria-live="polite">
          {conversation?.messages.length ? (
            conversation.messages.map((message) => (
              <article key={message.id} className={`message-row message-${message.role}`}>
                <div className="message-meta">
                  <span>{message.role}</span>
                  <span>{formatTimestamp(message.created_at)}</span>
                </div>
                <div className="message-bubble">{message.content}</div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <h2>Start the first exchange</h2>
              <p>Ask for a feature, a code review, or a design decision. The backend stores the chat history and calls Gemini with a server-side key.</p>
            </div>
          )}
        </section>

        <form className="composer" onSubmit={handleSubmit}>
          <label className="composer-label" htmlFor="prompt">
            Your message
          </label>
          <textarea
            id="prompt"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Describe what you want the chatbot to do..."
            rows={4}
            disabled={isBooting || isSending || !conversation}
          />
          <div className="composer-footer">
            <p>{error ?? 'Gemini API key stays on the server.'}</p>
            <button type="submit" disabled={isBooting || isSending || !draft.trim() || !conversation}>
              {isSending ? 'Sending...' : 'Send message'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default App;
