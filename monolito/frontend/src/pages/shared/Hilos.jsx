import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Center, Loader, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useUser } from '../../context/UserContext';
import { invalidateNavSidebarBadges } from '../../utils/invalidateNavBadges';
import { useCatalogService } from '../../hooks/useCatalogService';
import { useIdentityService } from '../../hooks/useIdentityService';
import { useThreadsService } from '../../hooks/useThreadsService';
import { useProducts } from '../../context/ProductsContext';
import { getMediaUrls } from '../../api/documentService';
import { getVariantDisplayCodes, formatCodes } from '../../utils/variantComponentCodes';
// Catálogo entrega variantes autocontenidas para render en hilos.
import {
  THREAD_TYPE_DESIGN,
  THREAD_TYPE_DEVELOPMENT,
  THREAD_TYPE_QUOTE,
} from '../../constants/threadTypes';
import ThreadHistorySelect from '../../components/ThreadHistorySelect';
import HilosSidebar from '../../components/hilos/HilosSidebar';
import HilosChatOverlay from '../../components/hilos/HilosChatOverlay';
import './Hilos.css';

const EMPTY_VARIANTS = [];

function notifyError(message) {
  notifications.show({ title: 'Error', message: message || 'Error', color: 'red' });
}

export default function Hilos() {
  const { user, role } = useUser();
  const queryClient = useQueryClient();
  const { products } = useProducts();
  const catalog = useCatalogService();
  const identity = useIdentityService();
  const threadsApi = useThreadsService();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [threads, setThreads] = useState({});
  const [loadingThreads, setLoadingThreads] = useState({});
  const [opening, setOpening] = useState(null);
  const [closing, setClosing] = useState(null);
  const [chatOpen, setChatOpen] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [imageUrls, setImageUrls] = useState({});
  const messagesEndRef = useRef(null);
  const threadsApiRef = useRef(threadsApi);
  threadsApiRef.current = threadsApi;

  const isComercial = role === 'comercial';
  const isCotizador = role === 'cotizador';
  const isDisenador = role === 'disenador';
  const isDesarrollo = role === 'desarrollo';
  const hilosWorkflowRole = isComercial
    ? null
    : isCotizador
      ? 'cotizador'
      : isDisenador
        ? 'disenador'
        : isDesarrollo
          ? 'desarrollo'
          : null;

  const variantAssignedToMe = (v) => {
    if (!user?.id) return false;
    if (isComercial) return true;
    const uid = String(user.id);
    if (isCotizador) return String(v.assignedQuoterId || '') === uid;
    if (isDisenador) return String(v.assignedDesignerId || '') === uid;
    if (isDesarrollo) return String(v.assignedDevelopmentUserId || '') === uid;
    return false;
  };

  useEffect(() => {
    loadProjects();
  }, [user?.id, role]);

  const loadProjects = () => {
    if (!user?.id) return;
    setLoading(true);
    let loader;
    if (isComercial) loader = catalog.getProjectsBySales(user.id);
    else if (isCotizador) loader = catalog.getProjectsByAssignedQuoter(user.id);
    else if (isDisenador) loader = catalog.getProjectsByAssignedDesigner(user.id);
    else if (isDesarrollo) loader = catalog.getProjectsByAssignedDevelopment(user.id);
    else loader = Promise.resolve([]);
    loader
      .then((data) => setProjects(data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  };

  const loadThreads = (projectId) => {
    setLoadingThreads((p) => ({ ...p, [projectId]: true }));
    threadsApi
      .getThreadsByProject(projectId)
      .then((data) => setThreads((t) => ({ ...t, [projectId]: data || [] })))
      .catch(() => setThreads((t) => ({ ...t, [projectId]: [] })))
      .finally(() => setLoadingThreads((p) => ({ ...p, [projectId]: false })));
  };

  const handleSelect = (projectId) => {
    setSelectedId(projectId);
    if (!threads[projectId]) loadThreads(projectId);
  };

  const getThreadTypeForRole = () => {
    if (isCotizador) return THREAD_TYPE_QUOTE;
    if (isDisenador) return THREAD_TYPE_DESIGN;
    if (isDesarrollo) return THREAD_TYPE_DEVELOPMENT;
    return null;
  };

  const canOpenThreadForVariant = (v) => {
    if (isCotizador) return !v.quotedAt;
    if (isDisenador) return !v.designedAt;
    if (isDesarrollo) return !v.developedAt;
    return false;
  };

  const handleOpenThread = async (projectId, variantId) => {
    if (!user?.id) return;
    const type = getThreadTypeForRole();
    if (!type && !isComercial) return;
    const key = `${projectId}-${variantId}`;
    setOpening(key);
    try {
      await threadsApi.openThread(projectId, variantId, type || THREAD_TYPE_DESIGN, user.id);
      loadThreads(projectId);
      invalidateNavSidebarBadges(queryClient);
    } catch (err) {
      notifyError(err?.message || 'Error al abrir hilo');
    } finally {
      setOpening(null);
    }
  };

  const handleCloseThread = async (projectId, threadId) => {
    if (!user?.id) return;
    setClosing(threadId);
    try {
      await threadsApi.closeThread(threadId, user.id);
      loadThreads(projectId);
      if (chatOpen?.threadId === threadId) setChatOpen(null);
      invalidateNavSidebarBadges(queryClient);
    } catch (err) {
      notifyError(err?.message || 'Error al cerrar hilo');
    } finally {
      setClosing(null);
    }
  };

  const openChat = (thread, projectId, productLabel) => {
    setChatOpen({ threadId: thread.id, projectId, productLabel, closedAt: thread.closedAt });
    setMessages([]);
    setNewMessage('');
  };

  useEffect(() => {
    if (!chatOpen?.threadId) return;
    const threadId = chatOpen.threadId;
    const fetchMessages = (isInitial = false) => {
      if (isInitial) setLoadingMessages(true);
      threadsApiRef.current
        .getThreadMessages(threadId)
        .then((data) => setMessages(data || []))
        .catch(() => {})
        .finally(() => {
          if (isInitial) setLoadingMessages(false);
        });
    };
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 4000);
    return () => clearInterval(interval);
  }, [chatOpen?.threadId]);

  useEffect(() => {
    const ids = [...new Set(messages.map((m) => m.userId).filter(Boolean))];
    const missing = ids.filter((id) => !userNames[id] && id !== user?.id);
    if (missing.length === 0) return;
    identity.getUsersByIds(missing).then((users) => {
      setUserNames((prev) => {
        const next = { ...prev };
        users.forEach((u) => {
          next[u.id] = u.name;
        });
        return next;
      });
    });
  }, [messages, identity, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    const content = newMessage?.trim();
    if (!content || !user?.id || !chatOpen?.threadId) return;
    if (chatOpen.closedAt) {
      notifyError('No se pueden enviar mensajes a un hilo cerrado');
      return;
    }
    setSending(true);
    try {
      await threadsApi.addThreadMessage(chatOpen.threadId, user.id, content);
      setNewMessage('');
      const updated = await threadsApi.getThreadMessages(chatOpen.threadId);
      setMessages(updated || []);
    } catch (err) {
      notifyError(err?.message || 'Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const filtered = projects.filter((p) =>
    (p.consecutive || p.name || '').toLowerCase().includes(searchText.trim().toLowerCase())
  );

  const displayProjects = useMemo(
    () =>
      filtered.map((p) => ({
        ...p,
        variants: p.variants || EMPTY_VARIANTS,
      })),
    [filtered, products]
  );

  const selectedProject = displayProjects.find((p) => p.id === selectedId) || null;
  const projectThreads = selectedId ? threads[selectedId] || [] : [];
  const loadingT = selectedId ? loadingThreads[selectedId] : false;

  const allImageKeys = useMemo(() => {
    const keys = new Set();
    (selectedProject?.variants || []).forEach((v) => v.baseImage && keys.add(v.baseImage));
    return [...keys];
  }, [selectedProject]);

  useEffect(() => {
    if (allImageKeys.length === 0) {
      setImageUrls({});
      return;
    }
    getMediaUrls(allImageKeys, 'image')
      .then((res) => setImageUrls(res.data || {}))
      .catch(() => setImageUrls({}));
  }, [allImageKeys.join(',')]);

  const getVariantCodes = (v) =>
    getVariantDisplayCodes({ sapRef: v.sapRef, sapCode: v.sapCode, type: v.type });

  const getProductLabel = (v) => {
    const codes = getVariantCodes(v);
    const codeStr = codes ? formatCodes(codes.primary, codes.secondary) : '—';
    return `${codeStr} — ${v.baseName || 'Producto'}`;
  };

  if (loading) {
    return (
      <Center mih={320}>
        <Loader color="brand" type="dots" />
      </Center>
    );
  }

  return (
    <div className={`hilos-page${selectedId ? ' master-detail--detail-open' : ''}`}>
      <HilosSidebar
        searchText={searchText}
        onSearchChange={setSearchText}
        displayProjects={displayProjects}
        threads={threads}
        selectedId={selectedId}
        onSelectProject={handleSelect}
        workflowRole={hilosWorkflowRole}
        workflowUserId={user?.id}
      />

      <main className="hilos-detail-panel">
        {!selectedProject ? (
          <div className="hilos-detail-empty">
            <span className="hilos-detail-empty-icon">💬</span>
            <Text size="sm">Selecciona un proyecto para ver sus hilos</Text>
          </div>
        ) : (
          <div className="hilos-detail-content">
            <div className="hilos-detail-header">
              <Button type="button" variant="light" color="brand" size="xs" className="hilos-back-btn" onClick={() => setSelectedId(null)}>
                ← Volver
              </Button>
              <Title order={2} className="hilos-detail-title">
                {selectedProject.consecutive} — {selectedProject.name || selectedProject.client}
              </Title>
              <Text size="sm" c="dimmed" className="hilos-detail-meta">
                {selectedProject.client}
              </Text>
            </div>

            {loadingT ? (
              <Center py="xl">
                <Loader color="brand" type="dots" size="sm" />
              </Center>
            ) : (
              <div className="hilos-products">
                {(selectedProject.variants || []).map((v) => {
                  const key = `${selectedId}-${v.id}`;
                  const codes = getVariantCodes(v);
                  const imgUrl = v.baseImage ? imageUrls[v.baseImage] : null;
                  const productLabel = getProductLabel(v);

                  const canActHilo = variantAssignedToMe(v);

                  return (
                    <div
                      key={v.id}
                      className={`hilos-product-row${canActHilo ? '' : ' hilos-product-row--locked'}`}
                    >
                      <div className="hilos-product-info">
                        <div className="hilos-product-thumb">
                          {imgUrl ? (
                            <img src={imgUrl} alt="" className="hilos-thumb-img" />
                          ) : (
                            <div className="hilos-thumb-placeholder">—</div>
                          )}
                        </div>
                        <div className="hilos-product-meta">
                          {codes ? (
                            <div className="hilos-codigo-stack">
                              {codes.secondary && (
                                <span className="hilos-codigo-sap">{codes.secondary}</span>
                              )}
                              <span
                                className={
                                  codes.secondary
                                    ? 'hilos-codigo-ref'
                                    : 'hilos-codigo-ref hilos-codigo-ref-only'
                                }
                              >
                                {codes.primary}
                              </span>
                            </div>
                          ) : (
                            <span className="hilos-codigo-empty">—</span>
                          )}
                          <span className="hilos-product-name">{v.baseName || 'Producto'}</span>
                        </div>
                      </div>

                      <div className="hilos-product-actions">
                        {!canActHilo ? (
                          <Text size="xs" c="dimmed">
                            Solo lectura
                          </Text>
                        ) : (
                        (() => {
                          const roleType = getThreadTypeForRole();
                          const activeThreads = projectThreads.filter(
                            (t) => String(t.variantId) === String(v.id) && !t.closedAt
                          );
                          const closedThreads = projectThreads.filter(
                            (t) => String(t.variantId) === String(v.id) && t.closedAt
                          );

                          const myActive = isComercial
                            ? activeThreads
                            : activeThreads.filter((t) => t.type === roleType);
                          const myClosed = isComercial
                            ? closedThreads
                            : closedThreads.filter((t) => t.type === roleType);

                          return (
                            <>
                              {myActive.map((t) => (
                                <span key={t.id} className="hilos-thread-badge">
                                  {isComercial && (
                                    <span className="hilos-thread-type">
                                      {t.type === THREAD_TYPE_QUOTE
                                        ? 'Cotización'
                                        : t.type === THREAD_TYPE_DESIGN
                                          ? 'Diseño'
                                          : 'Desarrollo'}
                                    </span>
                                  )}
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="filled"
                                    color="brand"
                                    className="hilos-chat-btn"
                                    onClick={() => openChat(t, selectedId, productLabel)}
                                  >
                                    Ver chat
                                  </Button>
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="light"
                                    color="gray"
                                    className="hilos-close-btn"
                                    onClick={() => handleCloseThread(selectedId, t.id)}
                                    disabled={closing === t.id}
                                  >
                                    {closing === t.id ? '...' : 'Cerrar'}
                                  </Button>
                                </span>
                              ))}

                              {!isComercial && myActive.length === 0 && canOpenThreadForVariant(v) && (
                                <Button
                                  type="button"
                                  size="xs"
                                  variant="outline"
                                  color="brand"
                                  className="hilos-open-btn"
                                  onClick={() => handleOpenThread(selectedId, v.id)}
                                  disabled={opening === key}
                                >
                                  {opening === key ? '...' : '+ Abrir hilo'}
                                </Button>
                              )}

                              {myClosed.length > 0 &&
                                (myClosed.length === 1 ? (
                                  <Button
                                    type="button"
                                    size="xs"
                                    variant="light"
                                    color="brand"
                                    className="hilos-history-btn"
                                    onClick={() => openChat(myClosed[0], selectedId, productLabel)}
                                  >
                                    Ver chat anterior
                                  </Button>
                                ) : (
                                  <ThreadHistorySelect
                                    threads={myClosed}
                                    onSelect={(t) => openChat(t, selectedId, productLabel)}
                                    className="hilos-history-select"
                                  />
                                ))}

                              {!isComercial &&
                                myActive.length === 0 &&
                                myClosed.length === 0 &&
                                !canOpenThreadForVariant(v) && (
                                  <span className="hilos-completed-badge">
                                    {isCotizador ? 'Cotizado' : isDisenador ? 'Diseñado' : 'Desarrollado'}
                                  </span>
                                )}
                            </>
                          );
                        })()
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <HilosChatOverlay
        chatOpen={chatOpen}
        onClose={() => setChatOpen(null)}
        messages={messages}
        loadingMessages={loadingMessages}
        newMessage={newMessage}
        onNewMessageChange={setNewMessage}
        sending={sending}
        onSend={handleSendMessage}
        user={user}
        userNames={userNames}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
}
