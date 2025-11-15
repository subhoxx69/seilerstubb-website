'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Clock,
  Phone,
  FileText,
  Search,
  MessageSquare,
  XCircle,
  Image as ImageIcon,
  Paperclip,
  Calendar,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { ContactThread, ContactMessage } from '@/lib/firebase/contact-thread-service';
import {
  subscribeToAllThreads,
  subscribeToThreadMessages,
  addMessageToThread,
  closeThread,
} from '@/lib/firebase/contact-thread-service';
import { postThreadReplyWithNotification } from '@/lib/server-actions/contact-actions';

export default function AdminContactPage() {
  const { user, firebaseUser, isLoading } = useAuth();
  const router = useRouter();
  const [threads, setThreads] = useState<ContactThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  // Admin attachments
  const [attachedImage, setAttachedImage] = useState<{
    url: string;
    name: string;
    size: number;
  } | null>(null);
  const [pageLinkUrl, setPageLinkUrl] = useState('');
  const [pageLinkTitle, setPageLinkTitle] = useState('');
  const [showPageLinkForm, setShowPageLinkForm] = useState(false);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [attachedReservation, setAttachedReservation] = useState<any | null>(null);
  const [showReservationsDropdown, setShowReservationsDropdown] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Subscribe to all threads
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    setThreadsLoading(true);
    const unsubscribe = subscribeToAllThreads(
      threads => {
        setThreads(threads);
        setThreadsLoading(false);
      },
      error => {
        console.error('Error loading threads:', error);
        setThreadsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Subscribe to selected thread messages
  useEffect(() => {
    if (!selectedThreadId) return;

    console.log(`👨‍💼 Admin subscribing to messages for thread: ${selectedThreadId}`);
    setMessagesLoading(true);
    const unsubscribe = subscribeToThreadMessages(
      selectedThreadId,
      messages => {
        console.log(`👨‍💼 Admin received ${messages.length} messages:`, messages);
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

    // Fetch user reservations
    const fetchUserReservations = async () => {
      try {
        const selectedThread = threads.find(t => t.id === selectedThreadId);
        if (!selectedThread || !firebaseUser) return;

        const token = await firebaseUser.getIdToken();
        const response = await fetch(`/api/reservations/user-reservations?userId=${selectedThread.userId}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUserReservations(data.reservations || []);
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
      }
    };

    fetchUserReservations();

    return () => unsubscribe();
  }, [selectedThreadId, threads, firebaseUser]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedThreadId || (!replyText.trim() && !attachedImage && !attachedReservation) || !firebaseUser) {
      return;
    }

    setIsReplying(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Use server action to post reply and create notification
      const result = await postThreadReplyWithNotification(
        selectedThreadId,
        replyText,
        attachedImage,
        undefined, // no page links
        attachedReservation ? {
          id: attachedReservation.id,
          date: attachedReservation.date,
          time: attachedReservation.time,
          people: attachedReservation.people,
          status: attachedReservation.status,
        } : undefined
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to send reply');
      }

      setSuccessMessage('Antwort gesendet!');
      setReplyText('');
      setAttachedImage(null);
      setAttachedReservation(null);
      setPageLinkUrl('');
      setPageLinkTitle('');
      setShowPageLinkForm(false);
      setShowReservationsDropdown(false);

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending reply:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setIsReplying(false);
    }
  };

  const handleCloseThread = async () => {
    if (!selectedThreadId || !firebaseUser) return;

    setIsClosing(true);
    setErrorMessage('');

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/contact/close', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close thread');
      }

      setSuccessMessage('Thread geschlossen!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error closing thread:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setIsClosing(false);
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

  const handleSendNotification = async () => {
    if (!selectedThreadId || !selectedThread || !firebaseUser) return;

    setIsSendingNotification(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const token = await firebaseUser.getIdToken();

      const response = await fetch('/api/email/send-contact-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: selectedThread.userEmail,
          userName: selectedThread.userName,
          subject: selectedThread.subject || 'Ihre Anfrage',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }

      setSuccessMessage('Benachrichtigungsemail erfolgreich versendet!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending notification:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
      );
    } finally {
      setIsSendingNotification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const filteredThreads = threads.filter(thread =>
    thread.userName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    thread.userEmail.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const openThreads = filteredThreads.filter(t => t.isOpen);
  const closedThreads = filteredThreads.filter(t => !t.isOpen);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <div className="mb-5">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Admin - Kontakt-Management
            </h1>
            <p className="text-sm text-gray-600">
              {openThreads.length} offene Konversation{openThreads.length !== 1 ? 'en' : ''} • {closedThreads.length} geschlossen
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Nach Name, E-Mail oder Betreff suchen..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 gap-6 p-4 sm:p-6 overflow-hidden max-w-7xl mx-auto w-full">
        {/* Threads list */}
        <div className="w-full sm:w-96 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {threadsLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-gray-500 text-sm">Wird geladen...</p>
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Mail className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-sm">Keine Konversationen gefunden</p>
            </div>
          ) : (
            <div className="overflow-y-auto">
              {/* Open threads section */}
              {openThreads.length > 0 && (
                <>
                  <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      Offene Threads ({openThreads.length})
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {openThreads.map(thread => (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`w-full text-left p-4 border-l-4 transition-all duration-200 ${
                          selectedThreadId === thread.id
                            ? 'border-primary bg-primary/5 hover:bg-primary/10'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {thread.userName}
                          </h3>
                          {thread.lastActor === 'user' && (
                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                              Neu
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1.5 mb-1">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {thread.userEmail}
                        </p>
                        <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1.5 mb-1">
                          <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {thread.userPhone}
                        </p>
                        {thread.subject && (
                          <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1.5 mb-2">
                            <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            {thread.subject}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{thread.messageCount} Nachrichten</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(
                              thread.lastMessageAt?.toDate?.() || 
                              (typeof thread.lastMessageAt === 'number' ? thread.lastMessageAt : Date.now())
                            ).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Closed threads section */}
              {closedThreads.length > 0 && (
                <>
                  <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-3 border-t-2 border-b border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-gray-400" />
                      Geschlossene Threads ({closedThreads.length})
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100 opacity-60">
                    {closedThreads.map(thread => (
                      <button
                        key={thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                        className={`w-full text-left p-4 border-l-4 transition-all duration-200 ${
                          selectedThreadId === thread.id
                            ? 'border-primary bg-primary/5 hover:bg-primary/10'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {thread.userName}
                          </h3>
                          <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded-full font-medium">
                            Geschlossen
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {thread.userEmail}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Messages panel */}
        <div className="flex-1 hidden sm:flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {selectedThread ? (
            <>
              {/* Thread Header with Info */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{selectedThread.userName}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">E-Mail</p>
                    <p className="text-sm text-gray-900 truncate">{selectedThread.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Telefon</p>
                    <p className="text-sm text-gray-900">{selectedThread.userPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Betreff</p>
                    <p className="text-sm text-gray-900 truncate">{selectedThread.subject || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Status</p>
                    <p className={`text-sm font-semibold flex items-center gap-2 ${
                      selectedThread.isOpen ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${selectedThread.isOpen ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {selectedThread.isOpen ? 'Offen' : 'Geschlossen'}
                    </p>
                  </div>
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
                      const isAdminMessage = message.sender === 'admin';
                      
                      const timestamp = message.createdAt?.toDate?.() || 
                                       (typeof message.createdAt === 'number' ? new Date(message.createdAt) : new Date());
                      
                      const showTimestamp = 
                        idx === 0 || 
                        Math.abs(
                          (messages[idx - 1].createdAt?.toDate?.() || new Date()).getTime() - timestamp.getTime()
                        ) > 5 * 60 * 1000;

                      console.log(`Admin Message ${idx}: sender=${message.sender}, isAdminMessage=${isAdminMessage}, text=${message.text.substring(0, 30)}`);

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
                            className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-sm transform transition-all hover:shadow-md ${
                                isAdminMessage
                                  ? 'bg-blue-600 text-white rounded-br-none hover:bg-blue-700'
                                  : 'bg-gray-300 text-gray-900 rounded-bl-none hover:bg-gray-400'
                              }`}
                            >
                              {!isAdminMessage && (
                                <p className="text-xs font-bold mb-2 text-gray-900">
                                  {selectedThread.userName}
                                </p>
                              )}
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

                              {/* Page Link attachment */}
                              {message.pageLink && (
                                <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                                  isAdminMessage ? 'bg-blue-700 border-blue-400' : 'bg-gray-200 border-gray-400'
                                }`}>
                                  <p className="text-xs font-bold mb-2 flex items-center gap-1">
                                    <LinkIcon className="h-3 w-3" />
                                    Link
                                  </p>
                                  <a
                                    href={message.pageLink.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-xs underline flex items-center gap-1 ${
                                      isAdminMessage ? 'text-blue-100' : 'text-gray-700'
                                    }`}
                                  >
                                    {message.pageLink.title || message.pageLink.url}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              )}

                              {/* Reservation attachment */}
                              {message.reservation && (
                                <div className={`mt-3 p-3 rounded-lg border-l-4 ${
                                  isAdminMessage ? 'bg-blue-700 border-blue-400' : 'bg-gray-200 border-gray-400'
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
                                  isAdminMessage
                                    ? 'text-blue-100'
                                    : 'text-gray-700'
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
                      );
                    })}
                  </>
                )}
              </div>

              {/* Reply Form and Actions */}
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
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-sm font-semibold text-amber-900">Angehängte Reservierung</p>
                      <button
                        onClick={() => setAttachedReservation(null)}
                        className="text-amber-400 hover:text-amber-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="bg-white p-3 rounded border border-amber-200 space-y-2">
                      <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700 mb-2">
                        <strong>ID:</strong> {attachedReservation.id || attachedReservation.reservationId}
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        📅 {new Date(attachedReservation.date).toLocaleDateString('de-DE')} um {attachedReservation.time} Uhr
                      </p>
                      <p className="text-xs text-gray-600">
                        👥 {attachedReservation.people} Personen
                      </p>
                      <p className={`text-xs font-semibold ${
                        attachedReservation.status === 'confirmed' ? 'text-green-600' :
                        attachedReservation.status === 'pending' ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        Status: {
                          attachedReservation.status === 'confirmed' ? 'Bestätigt' :
                          attachedReservation.status === 'pending' ? 'Ausstehend' :
                          'Abgelehnt'
                        }
                      </p>
                      {attachedReservation.note && (
                        <p className="text-xs text-gray-600 italic">Notiz: {attachedReservation.note}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Show page link preview */}
                {pageLinkUrl && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-blue-900">Angehängter Link</p>
                      <button
                        onClick={() => {
                          setPageLinkUrl('');
                          setPageLinkTitle('');
                          setShowPageLinkForm(false);
                        }}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <a
                      href={pageLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline flex items-center gap-2"
                    >
                      {pageLinkTitle || 'Seite anschauen'}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                )}

                {/* User Reservations Section */}
                {userReservations.length > 0 && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold text-amber-900 mb-3">Reservierungen dieses Benutzers:</p>
                    <div className="space-y-2">
                      {userReservations.map(reservation => (
                        <div key={reservation.id} className="bg-white p-3 rounded border border-amber-100">
                          <p className="text-sm font-semibold text-gray-900">
                            📅 {new Date(reservation.date).toLocaleDateString('de-DE')} um {reservation.time}
                          </p>
                          <p className="text-xs text-gray-600">
                            👥 {reservation.people} Personen - Status: <span className="font-semibold">{reservation.status}</span>
                          </p>
                          {reservation.note && (
                            <p className="text-xs text-gray-600 mt-1">Note: {reservation.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedThread.isOpen && (
                  <>
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
                          {/* Image Upload */}
                          <label className="cursor-pointer">
                            <input
                              id="admin-image-upload-input"
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={isReplying || isUploadingImage}
                              className="hidden"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isReplying || isUploadingImage}
                              className="rounded-lg"
                              onClick={(e) => {
                                e.preventDefault();
                                const input = document.getElementById('admin-image-upload-input') as HTMLInputElement;
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

                          {/* Page Link Button */}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isReplying || userReservations.length === 0}
                            className="rounded-lg relative"
                            onClick={() => setShowReservationsDropdown(!showReservationsDropdown)}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Reservierungen
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

                    {/* Page Link Form */}
                    {showReservationsDropdown && userReservations.length > 0 && (
                      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 space-y-3">
                        <p className="text-sm font-semibold text-amber-900">Reservierung auswählen</p>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {userReservations.map((reservation) => (
                            <button
                              key={reservation.id}
                              type="button"
                              onClick={() => {
                                setAttachedReservation(reservation);
                                setShowReservationsDropdown(false);
                              }}
                              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                attachedReservation?.id === reservation.id
                                  ? 'border-amber-500 bg-amber-100'
                                  : 'border-amber-200 bg-white hover:bg-amber-50'
                              }`}
                            >
                              <p className="text-sm font-semibold text-gray-900">
                                📅 {new Date(reservation.date).toLocaleDateString('de-DE')} um {reservation.time} Uhr
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                👥 {reservation.people} Personen
                              </p>
                              <p className={`text-xs font-semibold mt-1 ${
                                reservation.status === 'confirmed' ? 'text-green-600' :
                                reservation.status === 'pending' ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                Status: {
                                  reservation.status === 'confirmed' ? 'Bestätigt' :
                                  reservation.status === 'pending' ? 'Ausstehend' :
                                  'Abgelehnt'
                                }
                              </p>
                              {reservation.note && (
                                <p className="text-xs text-gray-600 mt-1 italic">Notiz: {reservation.note}</p>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={!attachedReservation}
                            className="flex-1 rounded-lg"
                            onClick={() => {
                              setShowReservationsDropdown(false);
                            }}
                          >
                            Auswählen
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 rounded-lg"
                            onClick={() => {
                              setShowReservationsDropdown(false);
                            }}
                          >
                            Abbrechen
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Close Thread Action */}
                {selectedThread.isOpen && (
                  <div className="flex gap-2 flex-col sm:flex-row">
                    <Button
                      onClick={handleSendNotification}
                      disabled={isSendingNotification}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {isSendingNotification ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Wird versendet...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Benachrichtigung versenden
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleCloseThread}
                      disabled={isClosing}
                      variant="outline"
                      className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 rounded-lg"
                    >
                      {isClosing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Wird geschlossen...
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          Thread schließen
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!selectedThread.isOpen && (
                  <div className="flex items-center justify-center gap-2 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
                    <XCircle className="h-4 w-4" />
                    Diese Konversation ist geschlossen
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <div className="p-3 bg-gray-100 rounded-lg">
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-700">Wählen Sie einen Thread aus</p>
              <p className="text-xs text-gray-500">Um Nachrichten anzuzeigen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
