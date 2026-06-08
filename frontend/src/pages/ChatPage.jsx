import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchChatsList, 
  fetchMessageHistory, 
  sendDirectMessage, 
  setActiveChatPartner,
  markChatAsRead,
  receiveNewMessage
} from '../redux/slices/chatSlice';
import { Send, Image, Video, Sparkles, X, ChevronRight, ChevronLeft, MessageSquare, AlertCircle } from 'lucide-react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { chats, activeChatPartner, messages, onlineUsers, typingUsers, isLoading } = useSelector((state) => state.chat);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  const dispatch = useDispatch();

  const [messageText, setMessageText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [fileType, setFileType] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chats on mount
  useEffect(() => {
    dispatch(fetchChatsList());
  }, [dispatch]);

  // Load message history when active partner changes
  useEffect(() => {
    if (activeChatPartner) {
      dispatch(fetchMessageHistory({ userId: activeChatPartner._id, page: 1 }));
      dispatch(markChatAsRead(activeChatPartner._id));
    }
  }, [activeChatPartner, dispatch]);

  // Scroll to bottom of message thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing event emissions
  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    
    if (!activeChatPartner) return;
    const socket = getSocket();
    if (!socket) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { receiverId: activeChatPartner._id });
    }

    // Debounce stop typing event
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop_typing', { receiverId: activeChatPartner._id });
    }, 2000);
  };

  // Process attachments
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      return toast.error('File size exceeds the 20MB limit');
    }

    const type = file.type.startsWith('video/') ? 'video' : 'image';
    setFileType(type);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview('');
    setFileType('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    // Build form data
    const formData = new FormData();
    formData.append('receiverId', activeChatPartner._id);
    formData.append('content', messageText);
    if (selectedFile) {
      formData.append('media', selectedFile);
    }

    setMessageText('');
    clearFile();

    // Reset typing status locally and on socket
    if (isTyping) {
      setIsTyping(false);
      const socket = getSocket();
      socket?.emit('stop_typing', { receiverId: activeChatPartner._id });
    }

    try {
      await dispatch(sendDirectMessage(formData)).unwrap();
    } catch (err) {
      toast.error('Failed to send message');
    }
  };

  // Check if a partner is online
  const isOnline = (partnerId) => {
    return onlineUsers.includes(partnerId);
  };

  // Check if active partner is typing
  const partnerIsTyping = activeChatPartner && typingUsers.includes(activeChatPartner._id);

  return (
    <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 shadow-sm h-[80vh] flex overflow-hidden transition-colors">
      
      {/* Left Pane: Conversations list */}
      <div className={`w-full md:w-80 border-r border-slate-100 dark:border-dark-700 h-full flex flex-col ${activeChatPartner ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-50 dark:border-dark-700/50">
          <h2 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Conversations</h2>
        </div>
        
        <div className="flex-grow overflow-y-auto divide-y divide-slate-50 dark:divide-dark-700/35">
          {chats.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">No active chats.</div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.partner._id}
                onClick={() => dispatch(setActiveChatPartner(chat.partner))}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-dark-700/40 cursor-pointer transition-all ${
                  activeChatPartner?._id === chat.partner._id ? 'bg-brand-50/20 dark:bg-brand-900/10 border-l-4 border-brand-500' : ''
                }`}
              >
                {/* Avatar with status bubble */}
                <div className="relative">
                  <img src={chat.partner.avatar} alt="" className="h-10 w-10 rounded-xl object-cover" />
                  {isOnline(chat.partner._id) && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-800"></span>
                  )}
                </div>
                
                {/* Thread snippet */}
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{chat.partner.name}</h4>
                    {chat.lastMessage && (
                      <span className="text-[9px] text-slate-400">
                        {new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {chat.lastMessage?.content || (chat.lastMessage?.media?.url ? '📎 Attachment' : 'No messages')}
                  </p>
                </div>

                {/* Unread count badge */}
                {chat.unreadCount > 0 && (
                  <span className="flex items-center justify-center bg-red-500 text-white font-bold text-[9px] h-4.5 min-w-4.5 px-1 rounded-full">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Message Area */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50/40 dark:bg-dark-900/25 ${activeChatPartner ? 'flex' : 'hidden md:flex'}`}>
        {activeChatPartner ? (
          <>
            {/* Header info */}
            <div className="h-16 px-4 md:px-6 border-b border-slate-100 dark:border-dark-700 flex items-center justify-between bg-white dark:bg-dark-800 transition-colors">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setActiveChatPartner(null))}
                  className="md:hidden p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-700 rounded-lg mr-1"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <img src={activeChatPartner.avatar} alt="" className="h-9 w-9 rounded-xl object-cover" />
                <div>
                  <h3 className="text-xs font-bold text-slate-850 dark:text-slate-100">{activeChatPartner.name}</h3>
                  <span className="text-[9px] text-slate-450 dark:text-slate-400 block leading-none">
                    {isOnline(activeChatPartner._id) ? (
                      <span className="text-emerald-500 font-semibold">Online</span>
                    ) : (
                      'Offline'
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isSentByMe = (msg.sender._id || msg.sender) === currentUser.id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex gap-2.5 max-w-[70%] items-end">
                      {!isSentByMe && (
                        <img src={activeChatPartner.avatar} alt="" className="h-6 w-6 rounded-lg object-cover mb-1" />
                      )}
                      
                      <div className="space-y-1">
                        <div className={`p-3 rounded-2xl text-xs ${
                          isSentByMe
                            ? 'bg-brand-500 text-white rounded-br-none shadow-sm'
                            : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-slate-355 rounded-bl-none border border-slate-100 dark:border-dark-700'
                        }`}>
                          {msg.content && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                          
                          {/* Chat Media */}
                          {msg.media?.url && (
                            <div className="mt-2 rounded-xl overflow-hidden max-w-sm">
                              {msg.media.type === 'video' ? (
                                <video src={msg.media.url} controls className="max-h-48 object-cover" />
                              ) : (
                                <img src={msg.media.url} alt="Shared attachment" className="max-h-48 object-cover" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-1 text-[9px] text-slate-400 ${isSentByMe ? 'justify-end' : 'justify-start'}`}>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isSentByMe && (
                            <span className={msg.isRead ? 'text-brand-500 font-semibold' : 'text-slate-405'}>
                              {msg.isRead ? '• Read' : '• Sent'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing bubble */}
              {partnerIsTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[70%] items-end">
                    <img src={activeChatPartner.avatar} alt="" className="h-6 w-6 rounded-lg object-cover mb-1" />
                    <div className="p-3 bg-white dark:bg-dark-800 text-slate-400 rounded-2xl rounded-bl-none border border-slate-100 dark:border-dark-700 text-[10px] italic flex items-center gap-1.5">
                      <span>{activeChatPartner.name} is typing</span>
                      <span className="flex gap-0.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Media Upload Previews */}
            {filePreview && (
              <div className="px-6 py-2.5 bg-white dark:bg-dark-800 border-t border-slate-50 dark:border-dark-700/50 flex items-center justify-between">
                <div className="relative rounded-lg overflow-hidden h-14 w-20 border border-slate-100 dark:border-dark-700 bg-slate-50 dark:bg-dark-900">
                  {fileType === 'video' ? (
                    <video src={filePreview} className="w-full h-full object-cover" />
                  ) : (
                    <img src={filePreview} alt="Shared preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={clearFile}
                    className="absolute -top-1 -right-1 p-0.5 bg-black/60 rounded-full text-white hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input message form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-dark-800 border-t border-slate-100 dark:border-dark-700 flex gap-3 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-slate-400 hover:text-brand-500 rounded-xl hover:bg-slate-50 dark:hover:bg-dark-700 transition-all"
              >
                <Image className="h-5 w-5" />
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={handleInputChange}
                className="flex-grow px-4 py-2.5 text-xs bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl outline-none focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 text-slate-700 dark:text-slate-200"
              />

              <button
                type="submit"
                disabled={!messageText.trim() && !selectedFile}
                className="p-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white shadow-md transition-colors"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-brand-50 dark:bg-brand-950/20 rounded-2xl mb-4">
              <MessageSquare className="h-10 w-10 text-brand-500" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-700 dark:text-slate-200 uppercase tracking-wider">Start Messaging</h3>
            <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
              Select a user from the conversations sidebar on the left to start a real-time message thread.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ChatPage;
