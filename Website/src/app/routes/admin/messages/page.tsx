'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Loader, Search, X, Send, Phone, Mail, Trash2, Eye, ChevronLeft, Edit, Check, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, onSnapshot, Unsubscribe, doc, updateDoc } from 'firebase/firestore';

// Stub types and functions - update these to use proper service
type TicketMessage = any;
const subscribeToAllMessages = (cb: (items: any[]) => void, errCb?: (error: any) => void) => () => {};
const subscribeToTicketMessages = (id: string, cb: (messages: any[]) => void) => () => {};
const addMessageToTicket = async (ticketId: string, userId: string, sender: string, senderName: string, text: string) => { throw new Error('Not implemented'); };
const deleteContactMessage = async (id: string) => { throw new Error('Not implemented'); };
const editMessage = async (ticketId: string, messageId: string, a: string, b: string, text: string) => { throw new Error('Not implemented'); };
const deleteMessage = async (ticketId: string, messageId: string, a: string, b: string) => { throw new Error('Not implemented'); };
const markMessageAsSeen = async (ticketId: string, messageId: string, by: string) => { throw new Error('Not implemented'); };
const markAllMessagesAsSeen = async (ticketId: string, by: string) => { throw new Error('Not implemented'); };

export const dynamic = 'force-dynamic';

interface ConversationThread {
  messageId: string;
  ticketId: string | null;
  userId: string | null;
  userName: string;
  userEmail: string;
  userPhone: string;
  subject: string;
  initialMessage: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: Date;
  lastMessageAt: Date;
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<ConversationThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'replied'>('all');
  
  // Chat modal state
  const [selectedConversation, setSelectedConversation] = useState<ConversationThread | null>(null);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatUnsubscribe, setChatUnsubscribe] = useState<Unsubscribe | null>(null);
  
  // Edit/Delete state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isDeletingMessageId, setIsDeletingMessageId] = useState<string | null>(null);

  // Load conversations
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToAllMessages(
      (items) => {
        // Convert contact messages to conversation threads
        const threads: ConversationThread[] = items.map((msg) => ({
          messageId: msg.id || '',
          ticketId: msg.userId ? `ticket_${msg.userId}` : null,
          userId: msg.userId || null,
          userName: msg.userName,
          userEmail: msg.userEmail,
          userPhone: msg.userPhone,
          subject: msg.subject,
          initialMessage: msg.message,
          status: msg.status,
          createdAt: msg.createdAt instanceof Date ? msg.createdAt : msg.createdAt?.toDate?.() || new Date(),
          lastMessageAt: msg.adminReplyAt instanceof Date ? msg.adminReplyAt : msg.adminReplyAt?.toDate?.() || (msg.createdAt instanceof Date ? msg.createdAt : msg.createdAt?.toDate?.() || new Date()),
        }));
        
        setConversations(threads);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load messages:', error);
        toast.error('Failed to load messages');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = 
      conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || conv.status === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate stats
  const stats = {
    total: conversations.length,
    unread: conversations.filter(c => c.status === 'unread').length,
    read: conversations.filter(c => c.status === 'read').length,
    replied: conversations.filter(c => c.status === 'replied').length,
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Open chat
  const handleOpenChat = async (conversation: ConversationThread) => {
    console.log('🔓 [Admin] Opening chat for user:', conversation.userId);

    setSelectedConversation(conversation);
    setIsChatModalOpen(true);
    setIsChatLoading(true);
    setNewMessage('');
    setEditingMessageId(null);

    // Clean up old subscription if exists
    if (chatUnsubscribe) {
      console.log('🧹 [Admin] Cleaning up old subscription');
      chatUnsubscribe();
      setChatUnsubscribe(null);
    }

    if (conversation.userId) {
      try {
        // Find the actual ticket for this user
        const ticketsRef = collection(db, 'tickets');
        const q = query(ticketsRef, where('userId', '==', conversation.userId));
        console.log('🔍 [Admin] Querying tickets for user:', conversation.userId);

        const snapshot = await getDocs(q);
        console.log('📊 [Admin] Query returned:', snapshot.docs.length, 'tickets');

        if (snapshot.docs.length > 0) {
          const currentTicketId = snapshot.docs[0].id;
          console.log('✅ [Admin] Found ticket:', currentTicketId);

          setTicketId(currentTicketId);

          // Subscribe to ticket messages with error handling
          try {
            console.log('🔔 [Admin] Setting up real-time subscription...');
            const unsubscribe = subscribeToTicketMessages(currentTicketId, (messages) => {
              console.log('📨 [Admin] Received', messages.length, 'messages from subscription');
              setChatMessages(messages);
              setIsChatLoading(false);
            });

            setChatUnsubscribe(unsubscribe);
            console.log('✅ [Admin] Subscription active');
          } catch (subError) {
            console.error('❌ [Admin] Subscription error:', subError);
            toast.error('Failed to load messages');
            setIsChatLoading(false);
          }
        } else {
          console.log('⚠️  [Admin] No ticket found, showing initial message only');
          // No ticket found, just show initial message
          setTicketId(null);
          setChatMessages([{
            id: conversation.messageId,
            sender: 'user',
            senderName: conversation.userName,
            text: conversation.initialMessage,
            sanitized: true,
            createdAt: conversation.createdAt,
          }]);
          setIsChatLoading(false);
        }
      } catch (error) {
        console.error('❌ [Admin] Error loading chat:', error);
        toast.error('Failed to load conversation');
        setTicketId(null);
        setChatMessages([{
          id: conversation.messageId,
          sender: 'user',
          senderName: conversation.userName,
          text: conversation.initialMessage,
          sanitized: true,
          createdAt: conversation.createdAt,
        }]);
        setIsChatLoading(false);
      }
    } else {
      console.log('ℹ️  [Admin] Guest message - no chat available');
      // Guest message - just show initial message
      setTicketId(null);
      setChatMessages([{
        id: conversation.messageId,
        sender: 'user',
        senderName: conversation.userName,
        text: conversation.initialMessage,
        sanitized: true,
        createdAt: conversation.createdAt,
      }]);
      setIsChatLoading(false);
    }
  };

  // Close chat
  const handleCloseChat = () => {
    if (chatUnsubscribe) {
      chatUnsubscribe();
      setChatUnsubscribe(null);
    }
    setIsChatModalOpen(false);
    setSelectedConversation(null);
    setChatMessages([]);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!selectedConversation?.userId || !newMessage.trim()) {
      if (!selectedConversation?.userId) {
        toast.error('Guest users cannot receive in-app messages. Use email/phone.');
      }
      return;
    }

    try {
      setIsSendingMessage(true);
      console.log('📨 [Admin] Sending message to user:', selectedConversation.userId);

      // Find the ticket for this user
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, where('userId', '==', selectedConversation.userId));
      const snapshot = await getDocs(q);

      console.log('🎟️  [Admin] Query result:', snapshot.docs.length, 'tickets found');

      if (snapshot.docs.length === 0) {
        console.error('❌ [Admin] No active chat found for user:', selectedConversation.userId);
        toast.error('No active chat found for this user');
        return;
      }

      const ticketId = snapshot.docs[0].id;
      console.log('✅ [Admin] Found ticket:', ticketId);

      // Add message
      console.log('📝 [Admin] Adding message to ticket...');
      await addMessageToTicket(
        ticketId,
        'admin', // userId - 'admin' for admin sender
        'admin', // sender
        'Support Team', // senderName
        newMessage.trim() // text
      );

      console.log('✅ [Admin] Message sent successfully');
      setNewMessage('');
      toast.success('Message sent!');
    } catch (error: any) {
      console.error('❌ [Admin] Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteContactMessage(id);
      handleCloseChat();
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  // Edit message
  const handleEditMessage = async (messageId: string) => {
    if (!ticketId || !editingText.trim()) {
      toast.error('Please enter new text');
      return;
    }

    try {
      setIsDeletingMessageId(messageId);
      await editMessage(ticketId, messageId, 'admin', 'admin', editingText.trim());
      setEditingMessageId(null);
      setEditingText('');
      toast.success('Message edited!');
    } catch (error: any) {
      console.error('Error editing message:', error);
      toast.error(error.message || 'Failed to edit message');
    } finally {
      setIsDeletingMessageId(null);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string) => {
    if (!ticketId) return;

    try {
      setIsDeletingMessageId(messageId);
      await deleteMessage(ticketId, messageId, 'admin', 'admin');
      toast.success('Message deleted!');
    } catch (error: any) {
      console.error('Error deleting message:', error);
      toast.error(error.message || 'Failed to delete message');
    } finally {
      setIsDeletingMessageId(null);
    }
  };

  // Mark message as seen
  const handleMarkAsSeen = async (messageId: string) => {
    if (!ticketId) return;

    try {
      await markMessageAsSeen(ticketId, messageId, 'admin');
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };

  // Mark all as seen when opening chat
  useEffect(() => {
    if (isChatModalOpen && ticketId) {
      markAllMessagesAsSeen(ticketId, 'admin').catch(err => 
        console.error('Error marking all as seen:', err)
      );
    }
  }, [isChatModalOpen, ticketId]);

  // Format date
  const formatDate = (date: Date | any) => {
    const dateObj = date instanceof Date ? date : (date?.toDate?.() || new Date());
    return dateObj.toLocaleDateString('de-DE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (date: Date | any) => {
    const dateObj = date instanceof Date ? date : (date?.toDate?.() || new Date());
    return dateObj.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Messages & Chat
        </h1>
        <p className="text-slate-600">Real-time conversations with customers</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
      >
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-0 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-300" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-0 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase">Unread</p>
              <p className="text-2xl font-bold text-red-900">{stats.unread}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-red-300 animate-pulse" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-0 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-yellow-600 uppercase">Read</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.read}</p>
            </div>
            <Eye className="w-8 h-8 text-yellow-300" />
          </div>
        </Card>
        
        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-0 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase">Replied</p>
              <p className="text-2xl font-bold text-green-900">{stats.replied}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-green-300" />
          </div>
        </Card>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <Card className="flex-1 p-4 rounded-xl border-0 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 focus:outline-none text-slate-900 placeholder-slate-400"
            />
          </div>
        </Card>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'unread', 'read', 'replied'] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant={filter === f ? 'default' : 'outline'}
              className={`rounded-lg ${filter === f ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'read' ? 'Read' : 'Replied'}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Conversations List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="space-y-2"
      >
        {filteredConversations.length === 0 ? (
          <Card className="p-12 rounded-2xl border-0 bg-slate-50 text-center">
            <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No conversations found</p>
          </Card>
        ) : (
          filteredConversations.map((conv, idx) => (
            <motion.div
              key={conv.messageId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleOpenChat(conv)}
              className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all hover:shadow-lg ${
                conv.status === 'unread'
                  ? 'bg-red-50 border-l-red-600 hover:bg-red-100'
                  : conv.status === 'replied'
                  ? 'bg-green-50 border-l-green-600 hover:bg-green-100'
                  : 'bg-slate-50 border-l-yellow-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold ${
                    conv.status === 'unread' ? 'bg-red-500' : conv.status === 'replied' ? 'bg-green-500' : 'bg-yellow-500'
                  }`}>
                    {conv.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{conv.userName}</h3>
                    <p className="text-sm text-slate-600 truncate">{conv.userEmail}</p>
                    <h4 className="font-medium text-slate-900 mt-1 truncate">{conv.subject}</h4>
                    <p className="text-sm text-slate-600 line-clamp-1">{conv.initialMessage}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(conv.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {conv.status === 'unread' && (
                    <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatModalOpen && selectedConversation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex items-center justify-between flex-shrink-0">
                <div className="flex-1">
                  <p className="text-sm font-semibold opacity-75">Chat with</p>
                  <h2 className="text-2xl font-bold">{selectedConversation.userName}</h2>
                  <p className="text-blue-100 text-sm mt-1">{selectedConversation.userEmail}</p>
                </div>
                <button
                  onClick={handleCloseChat}
                  className="p-2 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User Info Section */}
              <div className="bg-blue-50 p-4 border-b space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">📝 Subject</p>
                    <p className="text-sm font-semibold text-slate-900">{selectedConversation.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">📧 Email</p>
                    <a href={`mailto:${selectedConversation.userEmail}`} className="text-sm text-blue-600 hover:text-blue-700 underline">
                      {selectedConversation.userEmail}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-700 uppercase mb-1">📱 Phone</p>
                    <a href={`tel:${selectedConversation.userPhone}`} className="text-sm text-blue-600 hover:text-blue-700 underline">
                      {selectedConversation.userPhone || 'N/A'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              {isChatLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50">
                  {chatMessages.map((msg, idx) => (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'admin' ? 'justify-start' : 'justify-end'} group`}
                    >
                      <div className="flex flex-col gap-1">
                        <div
                          className={`max-w-xs px-4 py-3 rounded-lg ${
                            msg.sender === 'admin'
                              ? 'bg-slate-300 text-slate-900 rounded-bl-none'
                              : 'bg-blue-600 text-white rounded-br-none'
                          }`}
                          onMouseEnter={() => handleMarkAsSeen(msg.id || '')}
                        >
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {msg.sender === 'admin' ? 'Support' : 'You'}
                          </p>
                          {editingMessageId === msg.id ? (
                            <div className="space-y-2">
                              <Input
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="text-sm bg-white text-slate-900"
                                placeholder="Edit message..."
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  onClick={() => setEditingMessageId(null)}
                                  className="bg-slate-400 hover:bg-slate-500 text-white h-6 text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleEditMessage(msg.id || '')}
                                  disabled={isDeletingMessageId === msg.id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white h-6 text-xs flex items-center gap-1"
                                >
                                  {isDeletingMessageId === msg.id ? (
                                    <Loader className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="break-words">{msg.text}</p>
                              <div className="text-xs opacity-60 mt-1 flex items-center gap-1">
                                <span>{formatTime(msg.createdAt)}</span>
                                {msg.isEdited && <span className="italic">(edited)</span>}
                                {msg.seenBy?.admin && msg.sender === 'user' && (
                                  <span title="Seen by admin">👁️</span>
                                )}
                                {msg.seenBy?.user && msg.sender === 'admin' && (
                                  <span title="Seen by user">👁️</span>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Action Buttons (show on hover) */}
                        {!msg.isDeleted && msg.sender === 'admin' && editingMessageId !== msg.id && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                            <Button
                              onClick={() => {
                                setEditingMessageId(msg.id || '');
                                setEditingText(msg.text);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white h-6 px-2 text-xs flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteMessage(msg.id || '')}
                              disabled={isDeletingMessageId === msg.id}
                              className="bg-red-500 hover:bg-red-600 text-white h-6 px-2 text-xs flex items-center gap-1"
                            >
                              {isDeletingMessageId === msg.id ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Message Input - Always Show Reply */}
              <div className="border-t bg-white p-4 flex-shrink-0 space-y-3">
                <div className="flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your reply..."
                    className="flex-1 border-2 border-slate-200 rounded-lg p-2"
                    disabled={isSendingMessage || !selectedConversation.userId}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendMessage}
                    disabled={isSendingMessage || !newMessage.trim() || !selectedConversation.userId}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg flex items-center gap-2 font-semibold"
                  >
                    {isSendingMessage ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Reply
                  </motion.button>
                </div>
                {!selectedConversation.userId && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    ℹ️ This is a guest message. You can only view the message or use the contact info above to respond via email or phone.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
