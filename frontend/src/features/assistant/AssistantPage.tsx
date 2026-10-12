import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { apiClient } from '@/lib/api-client';
import { Conversation, ChatMessage, Citation } from '@/types/assistant';
import { DocumentItem } from '@/types/document';
import { CitationModal } from './CitationModal';
import {
  Brain,
  Send,
  Plus,
  Trash2,
  Bookmark,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Filter,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

export const AssistantPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');

  const [inputMessage, setInputMessage] = useState<string>(initialQuery || '');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [inspectCitation, setInspectCitation] = useState<Citation | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations and documents on mount
  const loadInitialData = async () => {
    try {
      const [convs, docs] = await Promise.all([
        apiClient<Conversation[]>('/conversations'),
        apiClient<DocumentItem[]>('/documents'),
      ]);
      setConversations(convs);
      setDocuments(docs.filter((d) => d.status === 'indexed'));

      if (convs.length > 0) {
        setActiveConvId(convs[0].id);
      } else {
        // Create an initial conversation
        await handleNewConversation();
      }
    } catch (err) {
      console.error('Failed to load initial assistant data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. Fetch active conversation details whenever activeConvId changes
  useEffect(() => {
    if (!activeConvId) return;
    apiClient<Conversation>(`/conversations/${activeConvId}`)
      .then((data) => {
        setActiveConversation(data);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      })
      .catch((err) => console.error('Failed to load conversation details:', err));
  }, [activeConvId]);

  // 3. Auto-submit if query param ?q= was passed
  useEffect(() => {
    if (initialQuery && activeConvId && !isSending) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery, activeConvId]);

  // Actions
  const handleNewConversation = async () => {
    try {
      const newConv = await apiClient<Conversation>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(newConv.id);
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient(`/conversations/${convId}`, { method: 'DELETE' });
      const updated = conversations.filter((c) => c.id !== convId);
      setConversations(updated);
      if (activeConvId === convId) {
        setActiveConvId(updated.length > 0 ? updated[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text || !activeConvId || isSending) return;

    setInputMessage('');
    setIsSending(true);

    // Optimistically append user message
    const optimisticUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvId,
      user_id: 'current-user',
      role: 'user',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setActiveConversation((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...(prev.messages || []), optimisticUserMsg],
      };
    });

    try {
      const docFilter = selectedDocId === 'all' ? null : [selectedDocId];
      await apiClient<ChatMessage>(
        `/conversations/${activeConvId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content: text,
            document_ids: docFilter,
          }),
        }
      );

      // Replace optimistic message and append real assistant response
      const updatedConv = await apiClient<Conversation>(`/conversations/${activeConvId}`);
      setActiveConversation(updatedConv);

      // Refresh conversations list to update title
      const refreshedConvs = await apiClient<Conversation[]>('/conversations');
      setConversations(refreshedConvs);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const detail = err?.message || 'Could not retrieve response from local Ollama. Please make sure Ollama is running (`ollama serve`).';
      // Append error message
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeConvId,
        user_id: 'current-user',
        role: 'assistant',
        content: `Error: ${detail}`,
        citations: [],
        created_at: new Date().toISOString(),
      };
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), errorMsg],
        };
      });
    } finally {
      setIsSending(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-8.5rem)]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline text-2xl font-bold text-on-surface">AI Study Assistant</h1>
            <span className="px-2 py-0.5 rounded-full bg-secondary-fixed/15 text-secondary font-mono text-[10px] font-semibold border border-secondary/20">
              RAG Copilot
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Grounded strictly in your uploaded materials via local Ollama (<code className="text-primary font-mono">qwen2.5:7b</code> + <code className="text-secondary font-mono">nomic-embed-text</code>).
          </p>
        </div>

        {/* Document Scope Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
          <span className="text-xs font-mono text-on-surface-variant">Scope:</span>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface-container-high/80 text-on-surface border border-white/10 text-xs font-mono focus:outline-none focus:border-primary"
          >
            <option value="all">
              All Indexed Materials ({documents.length} docs)
            </option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} ({doc.chunk_count} chunks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Dual-Pane Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* LEFT COLUMN: Conversation History (3 cols) */}
        <GlassCard level={1} className="lg:col-span-4 xl:col-span-3 p-4 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-white/5 shrink-0">
            <span className="text-xs font-mono text-on-surface-variant font-semibold uppercase tracking-wider">
              Conversations
            </span>
            <GlassButton variant="primary" size="sm" onClick={handleNewConversation}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New</span>
            </GlassButton>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
            {conversations.length === 0 ? (
              <div className="text-center py-8 text-xs text-on-surface-variant">
                No conversations yet
              </div>
            ) : (
              conversations.map((c) => {
                const isActive = c.id === activeConvId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveConvId(c.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between group border ${
                      isActive
                        ? 'bg-surface-container-high border-primary/30 shadow-glow-primary text-on-surface'
                        : 'bg-surface-container/40 border-transparent hover:bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold truncate">{c.title}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant/70 mt-0.5">
                        {c.message_count} messages
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </GlassCard>

        {/* RIGHT COLUMN: Active Chat Thread (9 cols) */}
        <GlassCard level={1} className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-0 p-4 sm:p-5 relative">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 min-h-0">
            {!activeConversation ||
            !activeConversation.messages ||
            activeConversation.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-lg mx-auto my-auto">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 border border-secondary/30 flex items-center justify-center mb-3">
                  <Brain className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-headline text-base font-bold text-on-surface">
                  Grounded Academic Copilot
                </h3>
                <p className="text-xs text-on-surface-variant mt-1 mb-6 leading-relaxed">
                  Ask any question about your registered syllabus, midterm concepts, or uploaded files. Every claim is strictly cited from verified chunks.
                </p>

                {/* Prompt Suggestions */}
                <div className="flex flex-col gap-2 w-full text-left">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-on-surface-variant">
                    Try asking:
                  </span>
                  {[
                    'Summarize the core topics covered in my indexed materials',
                    'Explain TCP Congestion Control (Reno vs Cubic)',
                    'Quiz me with 3 practice questions on B+ Tree Indexing',
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="p-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-container-high border border-white/5 hover:border-primary/30 text-xs text-on-surface transition-all flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              activeConversation.messages.map((msg) => {
                const isUser = msg.role === 'user';
                const isCopied = copiedMsgId === msg.id;
                const isInsufficient = msg.content.includes('insufficient evidence');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 px-1 text-[11px] font-mono text-on-surface-variant">
                      <span>{isUser ? 'You' : 'PrepAI Copilot'}</span>
                      <span className="opacity-40">•</span>
                      <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-2xl text-xs leading-relaxed select-text ${
                        isUser
                          ? 'bg-primary-container text-on-primary-container rounded-tr-none'
                          : 'bg-surface-container/70 border border-white/5 text-on-surface rounded-tl-none'
                      }`}
                    >
                      {isInsufficient && (
                        <div className="mb-2 p-2 rounded-lg bg-secondary-fixed/15 border border-secondary/30 text-secondary text-[11px] flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Context Limitation: Question exceeds available study material.</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {/* Grounded Citations Container */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">
                            <Bookmark className="w-3 h-3 text-secondary" />
                            <span>Verified Citations ({msg.citations.length})</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.map((cit, idx) => (
                              <button
                                key={idx}
                                onClick={() => setInspectCitation(cit)}
                                className="px-2.5 py-1 rounded-lg bg-surface-container-high/90 hover:bg-surface-container-highest border border-white/10 hover:border-secondary/40 text-[11px] font-mono text-secondary flex items-center gap-1.5 transition-all group"
                              >
                                <FileText className="w-3 h-3 text-secondary group-hover:scale-110 transition-transform" />
                                <span className="font-semibold truncate max-w-[140px]">
                                  {cit.document_title}
                                </span>
                                {cit.page_or_slide && (
                                  <span className="text-on-surface-variant font-normal">
                                    p.{cit.page_or_slide}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!isUser && (
                      <div className="flex items-center gap-2 px-1">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="text-[11px] font-mono text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-primary" />
                              <span className="text-primary">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Answer</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-surface-container/50 border border-white/5 self-start text-xs text-on-surface-variant font-mono">
                <Brain className="w-4 h-4 text-primary animate-pulse" />
                <span>Retrieving vectors & generating grounded answer...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="pt-3 border-t border-white/10 shrink-0 mt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask anything about your study materials (e.g. 'Explain Unit 4 algorithms')..."
                disabled={isSending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-high/80 text-on-surface placeholder:text-on-surface-variant/40 border border-white/10 text-xs focus:outline-none focus:border-primary disabled:opacity-50"
              />
              <GlassButton
                variant="primary"
                size="md"
                type="submit"
                disabled={!inputMessage.trim() || isSending}
              >
                <Send className="w-4 h-4 mr-1.5" />
                <span>Send</span>
              </GlassButton>
            </form>
          </div>
        </GlassCard>
      </div>

      {/* Citation Inspector Modal */}
      <CitationModal
        citation={inspectCitation}
        onClose={() => setInspectCitation(null)}
      />
    </div>
  );
};
