import { ActionIcon, Button, Text, Textarea, Title } from '@mantine/core';
import { formatThreadTime } from '../../utils/formatThreadTime';

export default function HilosChatOverlay({
  chatOpen,
  onClose,
  messages,
  loadingMessages,
  newMessage,
  onNewMessageChange,
  sending,
  onSend,
  user,
  userNames,
  messagesEndRef,
}) {
  if (!chatOpen) return null;

  return (
    <div className="hilos-chat-overlay" onClick={onClose} role="presentation">
      <div className="hilos-chat-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hilos-chat-header">
          <Title order={4} className="hilos-chat-title">
            {chatOpen.productLabel}
          </Title>
          {chatOpen.closedAt && <span className="hilos-chat-closed-badge">Cerrado</span>}
          <ActionIcon variant="subtle" color="gray" className="hilos-chat-close" onClick={onClose} aria-label="Cerrar" size="lg">
            ✕
          </ActionIcon>
        </div>
        <div className="hilos-chat-messages">
          {loadingMessages ? (
            <Text size="sm" className="hilos-chat-loading">
              Cargando mensajes...
            </Text>
          ) : messages.length === 0 ? (
            <Text size="sm" c="dimmed" className="hilos-chat-empty">
              No hay mensajes aún.
            </Text>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`hilos-chat-msg${m.userId === user?.id ? ' hilos-chat-msg-own' : ''}`}
              >
                <span className="hilos-chat-msg-meta">
                  {m.userId === user?.id
                    ? user?.name
                    : userNames[m.userId] || 'Usuario'}{' '}
                  · {formatThreadTime(m.createdAt)}
                </span>
                <p className="hilos-chat-msg-content">{m.content}</p>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        {!chatOpen.closedAt ? (
          <div className="hilos-chat-input-wrap">
            <Textarea
              className="hilos-chat-input"
              placeholder="Escribe un mensaje... (Enter para enviar)"
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={2}
              disabled={sending}
              size="sm"
            />
            <Button
              type="button"
              className="hilos-chat-send"
              variant="filled"
              color="brand"
              onClick={onSend}
              disabled={sending || !newMessage?.trim()}
              loading={sending}
              size="sm"
            >
              Enviar
            </Button>
          </div>
        ) : (
          <Text size="sm" c="dimmed" className="hilos-chat-closed">
            Hilo cerrado — solo lectura.
          </Text>
        )}
      </div>
    </div>
  );
}
