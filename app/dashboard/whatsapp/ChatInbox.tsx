'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  MessageSquare, User, Bot, RefreshCw, Send, 
  Search, Phone, Clock, Sparkles, CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatThread {
  _id: string; // phone number
  lastMessage: string;
  lastSender: 'user' | 'ai' | 'system';
  senderName?: string;
  lastTimestamp: string;
  totalMessages: number;
}

interface ChatMessage {
  _id: string;
  tenantId: string;
  phone: string;
  senderName?: string;
  sender: 'user' | 'ai' | 'system';
  message: string;
  messageId?: string;
  status?: 'pending' | 'sent' | 'delivered' | 'read';
  rawPayload?: string;
  createdAt: string;
}

export default function ChatInbox() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = async (quiet = false) => {
    if (!quiet) setLoadingThreads(true);
    try {
      const res = await api.get<ChatThread[]>('/whatsapp/chats/threads');
      setThreads(res.data || []);
      if (!selectedPhone && res.data && res.data.length > 0) {
        setSelectedPhone(res.data[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to load chat threads', err);
    } finally {
      if (!quiet) setLoadingThreads(false);
    }
  };

  const fetchMessages = async (phone: string, quiet = false) => {
    if (!quiet) setLoadingMessages(true);
    try {
      const res = await api.get<ChatMessage[]>(`/whatsapp/chats/history?phone=${encodeURIComponent(phone)}`);
      setMessages(res.data || []);
    } catch (err: any) {
      console.error('Failed to load chat history', err);
    } finally {
      if (!quiet) setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchThreads();
  }, []);

  // Poll threads and active chat every 5 seconds for real-time update feel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads(true);
      if (selectedPhone) {
        fetchMessages(selectedPhone, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedPhone]);

  // Load messages when selected phone changes
  useEffect(() => {
    if (selectedPhone) {
      fetchMessages(selectedPhone);
    }
  }, [selectedPhone]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPhone || sendingReply) return;

    setSendingReply(true);
    try {
      // 1. Send via WhatsApp Meta API
      await api.post('/whatsapp/send-message', {
        recipientPhone: selectedPhone,
        messageText: replyText,
      });

      // 2. Also log locally so it appears immediately
      await api.post('/whatsapp/log-chat', {
        tenantId: user?.tenantId,
        phone: selectedPhone,
        senderName: 'Agent (You)',
        sender: 'ai',
        message: replyText,
      });

      toast.success('Message sent & logged!');
      setReplyText('');
      fetchMessages(selectedPhone, true);
      fetchThreads(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      t._id.includes(searchQuery) ||
      (t.senderName && t.senderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.lastMessage && t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedThread = threads.find((t) => t._id === selectedPhone);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-[750px] flex flex-col md:flex-row">
      {/* ── Left Panel: Thread List ── */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
        {/* Header & Search */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h2 className="font-semibold text-slate-800">WhatsApp Inbox</h2>
            </div>
            <button
              onClick={() => fetchThreads()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Refresh conversations"
            >
              <RefreshCw className={`w-4 h-4 ${loadingThreads ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chats or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100/80 rounded-xl border-0 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loadingThreads ? (
            <div className="flex items-center justify-center h-48 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading chats...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No conversations found</p>
              <p className="text-xs text-slate-400 mt-1">
                Messages processed by your n8n automation will appear here automatically.
              </p>
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = thread._id === selectedPhone;
              return (
                <button
                  key={thread._id}
                  onClick={() => setSelectedPhone(thread._id)}
                  className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 relative ${
                    isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                    {thread.senderName ? thread.senderName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-800 truncate">
                        {thread.senderName || thread._id}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        {new Date(thread.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                        {thread.lastSender === 'ai' && (
                          <Sparkles className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        )}
                        <span>{thread.lastMessage}</span>
                      </p>
                      <span className="text-[10px] bg-slate-200/80 text-slate-600 font-medium px-1.5 py-0.5 rounded-full ml-2">
                        +{thread._id.slice(-4)}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Chat Thread Window ── */}
      {selectedPhone ? (
        <div className="flex-1 flex flex-col bg-slate-50/30">
          {/* Active Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                {selectedThread?.senderName ? selectedThread.senderName[0].toUpperCase() : 'C'}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 leading-tight">
                  {selectedThread?.senderName || 'Customer'}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-600" /> +{selectedPhone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                n8n Connected
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#e5ddd5]/20 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Fetching messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                No chat history found for +{selectedPhone}
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isUser ? 'items-start' : 'items-end'} mb-1`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm text-sm relative ${
                        isUser
                          ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          : 'bg-emerald-600 text-white rounded-tr-none'
                      }`}
                    >
                      {/* Sender Tag */}
                      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-1 font-medium">
                        {isUser ? (
                          <>
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{(msg.senderName || 'Customer').replace(/^=/, '')}</span>
                          </>
                        ) : (
                          <>
                            <Bot className="w-3 h-3 text-emerald-200" />
                            <span>AI Automation</span>
                          </>
                        )}
                      </div>

                      {/* Message Content */}
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.message ? msg.message.replace(/^=/, '') : ''}
                      </p>

                      {/* Timestamp */}
                      <div
                        className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                          isUser ? 'text-slate-400' : 'text-emerald-100'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!isUser && (
                          msg.status === 'read' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                          ) : msg.status === 'delivered' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                          ) : (
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-200/60" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Bar */}
          <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={`Send direct WhatsApp reply to +${selectedPhone}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-100 rounded-xl border-0 focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
            />
            <button
              onClick={handleSendReply}
              disabled={sendingReply || !replyText.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              {sendingReply ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/20">
          <MessageSquare className="w-12 h-12 mb-3 text-slate-300" />
          <h3 className="text-base font-semibold text-slate-600">Select a conversation</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Choose a contact from the left sidebar to view their full WhatsApp AI automated conversation history.
          </p>
        </div>
      )}
    </div>
  );
}
