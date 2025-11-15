'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2, Loader2, Clock, Phone, User, FileText, X, Image as ImageIcon, Paperclip, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { ContactThread, ContactMessage } from '@/lib/firebase/contact-thread-service';
import {
  subscribeToUserThreads,
  subscribeToThreadMessages,
  subscribeToUserNotifications,
  markNotificationAsRead,
} from '@/lib/firebase/contact-thread-service';

export default function UserMessagesPage() {
  const { user, firebaseUser, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadIdParam = searchParams.get('threadId');
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(threadIdParam);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Attachment state
  const [attachedImage, setAttachedImage] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [attachedReservation, setAttachedReservation] = useState<any>(null);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [showReservationPicker, setShowReservationPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);

  // Subscribe to threads
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('❌ User not authenticated, redirecting to signin');
      router.push('/auth/signin');
      return;
    }

    if (!user?.id) {
      console.log('⏳ Waiting for user.id...');
      return;
    }

    console.log(`✅ User authenticated: ${user.id}, starting to subscribe to threads`);
    setThreadsLoading(true);
    const unsubscribe = subscribeToUserThreads(
      user.id,
      threads => {
        console.log(`📧 Received ${threads.length} threads for user ${user.id}:`, threads);
        setThreads(threads);
        setThreadsLoading(false);

        // If threadId is provided via query param, prioritize it
        if (threadIdParam && threads.some(t => t.id === threadIdParam)) {
          console.log(`✨ Using thread from query parameter: ${threadIdParam}`);
          setSelectedThreadId(threadIdParam);
        } 
        // Auto-select first thread if none selected and no query param
        else if (!selectedThreadId && threads.length > 0) {
          console.log(`✨ Auto-selecting first thread: ${threads[0].id}`);
          setSelectedThreadId(threads[0].id);
        }
      },
      error => {
        console.error('❌ Error loading threads:', error);
        setThreadsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id, isLoading, threadIdParam]);

  // Subscribe to selected thread messages
  useEffect(() => {
    if (!selectedThreadId) return;

    console.log(`📩 User subscribing to messages for thread: ${selectedThreadId}`);
    setMessagesLoading(true);
    const unsubscribe = subscribeToThreadMessages(
      selectedThreadId,
      messages => {
        console.log(`📩 User received ${messages.length} messages:`, messages);
        messages.forEach((msg, i) => {
          console.log(`   [${i}] sender=${msg.sender}, text=${msg.text.substring(0, 40)}`);
        });
        setMessages(messages);
        setMessagesLoading(false);
      },
      error => {
        console.error('Error loading messages:', error);
        setMessagesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedThreadId]);

  // Mark notification as read when viewing thread
  useEffect(() => {
    if (!selectedThreadId || !user?.id) return;

    const checkNotifications = async () => {
      try {
        // This would need a separate API endpoint to get notifications
        // For now, we'll skip this automatic marking
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    };

    checkNotifications();
  }, [selectedThreadId, user?.id]);

  // Fetch user reservations
  useEffect(() => {
    if (!firebaseUser) return;

    const fetchReservations = async () => {
      try {
        setIsLoadingReservations(true);
        const token = await firebaseUser.getIdToken();
        console.log('🔄 Fetching reservations for user...');
        
        const response = await fetch('/api/reservations/user-reservations', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Reservations fetched:', data.reservations);
          setUserReservations(data.reservations || []);
        } else {
          console.error('❌ Failed to fetch reservations:', response.status);
        }
      } catch (error) {
        console.error('❌ Error fetching reservations:', error);
      } finally {
        setIsLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [firebaseUser]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedThreadId || (!replyText.trim() && !attachedImage && !attachedReservation) || !firebaseUser) {
      return;
    }

    setIsReplying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/contact/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
          text: replyText,
          image: attachedImage,
          reservation: attachedReservation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send reply');
      }

      setSuccessMessage('Antwort gesendet!');
      setReplyText('');
      setAttachedImage(null);
      setAttachedReservation(null);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending reply:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'An error occurred'
      );
    } finally {
      setIsReplying(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedThreadId) return;

    setIsUploadingImage(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('threadId', selectedThreadId);

      const token = await firebaseUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/contact/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      setAttachedImage({
        url: data.imageUrl,
        name: data.imageName,
        size: data.imageSize,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary mx-auto"></div>
          <p className="text-gray-600 font-medium">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - Modern Design */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/contact">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Meine Nachrichten
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {threads.length} {threads.length === 1 ? 'Konversation' : 'Konversationen'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 p-4 sm:p-6 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Threads Sidebar */}
        <div className={`${isMobileOpen ? 'fixed inset-0 z-50 bg-white' : 'hidden sm:flex'} sm:relative sm:z-0 flex-col w-full sm:w-80 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden`}>
          {/* Close button for mobile */}
          {isMobileOpen && (
            <div className="absolute top-4 right-4 z-10 sm:hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMobileOpen(false)}
                className="text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Threads List Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Konversationen</h2>
          </div>

          {/* Threads Content */}
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-gray-500 text-sm">Wird geladen...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm font-medium">Noch keine Nachrichten</p>
                <p className="text-xs text-gray-500">Starten Sie eine neue Konversation</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {threads.map((thread, idx) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      setSelectedThreadId(thread.id);
                      setIsMobileOpen(false);
                    }}
                    className={`w-full text-left p-4 transition-all duration-200 group border-l-4 ${
                      selectedThreadId === thread.id
                        ? 'bg-primary/5 border-primary hover:bg-primary/10'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {thread.userName}
                      </h3>
                      {!thread.isOpen && (
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">
                          Geschlossen
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-1 mb-2 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      {thread.userEmail}
                    </p>
                    {thread.subject && (
                      <p className="text-xs text-gray-600 line-clamp-1 mb-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {thread.subject}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      {new Date(
                        thread.lastMessageAt?.toDate?.() || 
                        (typeof thread.lastMessageAt === 'number' ? thread.lastMessageAt : Date.now())
                      ).toLocaleDateString('de-DE')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Panel */}
        <div className={`${isMobileOpen ? 'hidden' : 'flex'} sm:flex flex-1 flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden`}>
          {selectedThread ? (
            <>
              {/* Thread Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedThread.userName}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="truncate">{selectedThread.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-gray-700">
                        <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{selectedThread.userPhone}</span>
                      </div>
                      {selectedThread.subject && (
                        <div className="col-span-full flex items-center gap-2.5 text-gray-700">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="truncate">{selectedThread.subject}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileOpen(true)}
                    className="sm:hidden text-gray-600 hover:text-gray-900 ml-4"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-gray-500 text-sm">Nachrichten werden geladen...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Mail className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-medium text-sm">Noch keine Nachrichten</p>
                    <p className="text-xs text-gray-500">Starten Sie das Gespräch mit einer Nachricht</p>
                  </div>
                ) : (
                  <>
                    {/* Conversation start marker */}
                    <div className="text-center py-4">
                      <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                        Anfang der Konversation
                      </span>
                    </div>

                    {/* Messages */}
                    {messages.map((message, idx) => {
                      const timestamp = message.createdAt?.toDate?.() || 
                                       (typeof message.createdAt === 'number' ? new Date(message.createdAt) : new Date());
                      
                      // Determine if this is an admin or user message
                      // Admin messages should be aligned left, user messages right
                      const isAdminMessage = message.sender === 'admin';
                      const showTimestamp = 
                        idx === 0 || 
                        Math.abs(
                          (messages[idx - 1].createdAt?.toDate?.() || new Date()).getTime() - timestamp.getTime()
                        ) > 5 * 60 * 1000; // Show timestamp if 5+ mins apart

                      console.log(`Message ${idx}: sender="${message.sender}", isAdminMessage=${isAdminMessage}, text=${message.text.substring(0, 30)}`);

                      return (
                        <div key={message.id}>
                          {showTimestamp && (
                            <div className="text-center py-2">
                              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                {timestamp.toLocaleString('de-DE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })}
                              </span>
                            </div>
                          )}
                          <div
                            className={`flex ${isAdminMessage ? 'justify-start' : 'justify-end'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div className="flex flex-col gap-1">
                              {isAdminMessage && (
                                <span className="text-xs font-bold text-gray-600 pl-2">
                                  Restaurant Support
                                </span>
                              )}
                              <div
                                className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm transform transition-all hover:shadow-md ${
                                  isAdminMessage
                                    ? 'bg-gray-200 text-gray-900 rounded-bl-none'
                                    : 'bg-blue-600 text-white rounded-br-none hover:bg-blue-700'
                                }`}
                              >
                                {message.text && (
                                  <p className="text-sm break-words leading-relaxed font-medium">{message.text}</p>
                                )}

                                {/* Image attachment */}
                                {message.image && (
                                  <div className="mt-2">
                                    <a
                                      href={message.image.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-block max-w-xs"
                                    >
                                      <img
                                        src={message.image.url}
                                        alt={message.image.name}
                                        className="max-w-xs h-auto rounded-lg"
                                      />
                                    </a>
                                    <p className="text-xs mt-2 opacity-75">{message.image.name}</p>
                                  </div>
                                )}

                                {/* Reservation attachment */}
                                {message.reservation && (
                                  <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                                    isAdminMessage ? 'bg-gray-100 border-gray-400' : 'bg-blue-700 border-blue-400'
                                  }`}>
                                    <p className="text-xs font-bold mb-1">Reservierung</p>
                                    <div className="text-xs space-y-1">
                                      <p>📅 {new Date(message.reservation.date).toLocaleDateString('de-DE')}</p>
                                      <p>⏰ {message.reservation.time} Uhr</p>
                                      <p>👥 {message.reservation.people} Personen</p>
                                      <p>📊 Status: {message.reservation.status}</p>
                                    </div>
                                  </div>
                                )}

                                <p
                                  className={`text-xs mt-3 font-semibold ${
                                    isAdminMessage ? 'text-gray-700' : 'text-blue-100'
                                  }`}
                                >
                                  {timestamp.toLocaleString('de-DE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Reply Form */}
              {selectedThread.isOpen ? (
                <div className="border-t border-gray-200 bg-white p-6 space-y-4">
                  {errorMessage && (
                    <div className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p>{errorMessage}</p>
                    </div>
                  )}
                  {successMessage && (
                    <div className="flex gap-3 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <p>{successMessage}</p>
                    </div>
                  )}

                  {/* Show attached image preview */}
                  {attachedImage && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold text-gray-900">Angehängtes Bild</p>
                        <button
                          onClick={() => setAttachedImage(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <img
                        src={attachedImage.url}
                        alt={attachedImage.name}
                        className="max-w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="text-xs text-gray-600">{attachedImage.name}</p>
                    </div>
                  )}

                  {/* Show attached reservation preview */}
                  {attachedReservation && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <p className="text-sm font-semibold text-blue-900">Angehängte Reservierung</p>
                        <button
                          onClick={() => setAttachedReservation(null)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="bg-white p-3 rounded border border-blue-200 space-y-2 mb-2">
                        <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                          <strong>ID:</strong> {attachedReservation.id || attachedReservation.reservationId}
                        </p>
                      </div>
                      <div className="text-sm text-blue-900 space-y-1">
                        <p>📅 {new Date(attachedReservation.date).toLocaleDateString('de-DE')}</p>
                        <p>⏰ {attachedReservation.time} Uhr</p>
                        <p>👥 {attachedReservation.people} Personen</p>
                        <p>📊 Status: {attachedReservation.status}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleReply} className="space-y-4">
                    <Textarea
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Schreiben Sie Ihre Antwort..."
                      maxLength={5000}
                      disabled={isReplying || isUploadingImage}
                      className="min-h-24 resize-none bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-primary focus:ring-primary/50"
                    />
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-gray-500 font-medium">
                        {replyText.length}/5000
                      </span>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isReplying || isUploadingImage}
                              className="hidden"
                              id="image-upload-input"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isReplying || isUploadingImage}
                              className="rounded-lg"
                              onClick={(e) => {
                                e.preventDefault();
                                const input = document.getElementById('image-upload-input') as HTMLInputElement;
                                input?.click();
                              }}
                            >
                            {isUploadingImage ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Lädt...
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Bild
                              </>
                            )}
                          </Button>
                        </label>

                        {/* Reservation Attachment */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isReplying || userReservations.length === 0 || isLoadingReservations}
                          className="rounded-lg"
                          onClick={() => setShowReservationPicker(!showReservationPicker)}
                        >
                          {isLoadingReservations ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Wird geladen...
                            </>
                          ) : (
                            <>
                              <Paperclip className="h-4 w-4 mr-1" />
                              Reservierung {userReservations.length === 0 ? '(keine)' : `(${userReservations.length})`}
                            </>
                          )}
                        </Button>

                        {/* Send Button */}
                        <Button
                          type="submit"
                          disabled={(!replyText.trim() && !attachedImage && !attachedReservation) || isReplying || isUploadingImage}
                          className="rounded-lg"
                        >
                          {isReplying ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Wird gesendet...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Senden
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>

                  {/* Reservation Picker Modal */}
                  {showReservationPicker && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Wählen Sie eine Reservierung:</p>
                      {userReservations.length > 0 ? (
                        <div className="space-y-2">
                          {userReservations.map(reservation => (
                            <button
                              key={reservation.id}
                              type="button"
                              onClick={() => {
                                setAttachedReservation(reservation);
                                setShowReservationPicker(false);
                              }}
                              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                                attachedReservation?.id === reservation.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 bg-white hover:border-blue-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    📅 {new Date(reservation.date).toLocaleDateString('de-DE')} um {reservation.time}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    👥 {reservation.people} Personen
                                  </p>
                                  <p className={`text-xs font-semibold mt-1 ${
                                    reservation.status === 'confirmed' ? 'text-green-600' :
                                    reservation.status === 'pending' ? 'text-orange-600' :
                                    'text-red-600'
                                  }`}>
                                    {reservation.status === 'confirmed' ? '✅ Bestätigt' :
                                     reservation.status === 'pending' ? '⏳ Ausstehend' :
                                     '❌ Abgelehnt'}
                                  </p>
                                </div>
                                {attachedReservation?.id === reservation.id && (
                                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-500">Keine Reservierungen gefunden</p>
                          <p className="text-xs text-gray-400 mt-1">Sie haben noch keine Reservierungen getätigt</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-yellow-200 bg-yellow-50 p-6 text-center text-sm text-yellow-800 font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Diese Konversation wurde geschlossen. Sie können keine neuen Nachrichten senden.
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">Wählen Sie eine Konversation aus</p>
              <p className="text-xs text-gray-500">Um die Nachrichten anzuzeigen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
