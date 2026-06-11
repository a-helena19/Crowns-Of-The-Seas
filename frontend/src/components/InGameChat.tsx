import { useEffect, useRef, useState } from 'react';
import type { Client } from 'stompjs';
import { chatApi } from '../api/chatApi';
import type { ChatMessageDTO } from '../types/chat';

interface InGameChatProps {
    sessionId: string;
    currentUserId: string;
    stompClient: Client | null;
}

export default function InGameChat({ sessionId, currentUserId, stompClient }: InGameChatProps) {
    const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const chatReadKey = `session-chat:last-seen:${sessionId}`;
    const [lastSeenMessageCount, setLastSeenMessageCount] = useState(() => {
        const storedValue = sessionStorage.getItem(chatReadKey);
        const parsedValue = storedValue ? Number.parseInt(storedValue, 10) : 0;
        return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
    });
    const messagesRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let active = true;
        chatApi.getMessages(sessionId)
            .then((loadedMessages) => {
                if (active) {
                    setMessages(loadedMessages);
                }
            })
            .catch((error) => {
                console.error('Failed to load chat messages', error);
            });

        return () => {
            active = false;
        };
    }, [sessionId]);

    useEffect(() => {
        if (!stompClient?.connected) {
            return;
        }

        const subscription = stompClient.subscribe(`/topic/session/${sessionId}/chat`, (frame) => {
            try {
                const incomingMessage = JSON.parse(frame.body) as ChatMessageDTO;
                setMessages((current) => {
                    if (current.some((message) => message.id === incomingMessage.id)) {
                        return current;
                    }
                    return [...current, incomingMessage];
                });
            } catch (error) {
                console.error('Failed to parse chat message', error);
            }
        });

        return () => subscription.unsubscribe();
    }, [sessionId, stompClient]);

    useEffect(() => {
        const container = messagesRef.current;
        if (!container) return;
        container.scrollTop = container.scrollHeight;
    }, [messages]);

    useEffect(() => {
        if (!isOpen) return;
        requestAnimationFrame(() => {
            const container = messagesRef.current;
            if (!container) return;
            container.scrollTop = container.scrollHeight;
        });
    }, [isOpen, messages.length]);

    useEffect(() => {
        if (isOpen) {
            setLastSeenMessageCount(messages.length);
        }
    }, [isOpen, messages.length]);

    useEffect(() => {
        sessionStorage.setItem(chatReadKey, String(lastSeenMessageCount));
    }, [chatReadKey, lastSeenMessageCount]);

    const visibleMessages = isOpen ? messages : [];
    const unreadCount = Math.max(0, messages.length - lastSeenMessageCount);

    async function handleSendMessage() {
        const trimmedMessage = messageText.trim();
        if (!trimmedMessage || isSending) {
            return;
        }

        setIsSending(true);
        try {
            await chatApi.sendMessage(sessionId, trimmedMessage);
            setMessageText('');
        } catch (error) {
            console.error('Failed to send chat message', error);
        } finally {
            setIsSending(false);
        }
    }

    return (
        <aside className={`in-game-chat ${isOpen ? 'open' : 'closed'}`} aria-label="Session-Chat">
            <button
                type="button"
                className="in-game-chat-header"
                onClick={() => setIsOpen((current) => !current)}
                aria-expanded={isOpen}
                aria-controls="session-chat-messages"
            >
                <span className="in-game-chat-title">
                    <span>Session Chat</span>
                    {unreadCount > 0 && (
                        <span className="in-game-chat-badge">{unreadCount}</span>
                    )}
                </span>
                <span className="in-game-chat-chevron" aria-hidden="true">
                    {isOpen ? '▾' : '▴'}
                </span>
            </button>
            {isOpen && (
                <>
                    <div className="in-game-chat-messages" id="session-chat-messages" ref={messagesRef}>
                        {messages.length === 0 ? (
                            <div className="in-game-chat-empty">Noch keine Nachrichten in dieser Session.</div>
                        ) : (
                            visibleMessages.map((message) => {
                                const isOwnMessage = message.senderUserId === currentUserId;
                                const timestamp = new Date(message.sentAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });

                                return (
                                    <div
                                        key={message.id}
                                        className={`in-game-chat-message${isOwnMessage ? ' own' : ''}`}
                                    >
                                        <div className="in-game-chat-meta">
                                            <span>{message.senderPlayerName}</span>
                                            <span>{timestamp}</span>
                                        </div>
                                        <div className="in-game-chat-text">{message.messageText}</div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <form
                        className="in-game-chat-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSendMessage();
                        }}
                    >
                        <input
                            className="in-game-chat-input"
                            type="text"
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            placeholder="Nachricht..."
                            maxLength={1000}
                        />
                        <button
                            className="in-game-chat-send"
                            type="submit"
                            disabled={isSending || messageText.trim().length === 0}
                        >
                            Senden
                        </button>
                    </form>
                </>
            )}
        </aside>
    );
}
