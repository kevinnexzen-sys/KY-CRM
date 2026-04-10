
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, Phone, Video, MoreHorizontal, Paperclip, Send, Image as ImageIcon, Plus, Users } from 'lucide-react';

export const Chat: React.FC = () => {
  const { chatGroups, chatMessages, sendMessage, createGroup, currentUser } = useData();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(chatGroups[0]?.id || null);
  const [inputText, setInputText] = useState("");
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedGroup = chatGroups.find(g => g.id === selectedGroupId);
  const currentMessages = chatMessages.filter(m => m.groupId === selectedGroupId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentMessages, selectedGroupId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedGroupId) return;
    sendMessage(selectedGroupId, inputText);
    setInputText("");
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !currentUser) return;
    createGroup(newGroupName, [currentUser.id]);
    setIsNewGroupModalOpen(false);
    setNewGroupName("");
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-80 border-r border-slate-200 bg-slate-50 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
          <div className="flex justify-between items-center">
             <h2 className="font-bold text-slate-800">Chats</h2>
             <button 
                onClick={() => setIsNewGroupModalOpen(true)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-emerald-600 transition-colors" title="New Group"
             >
                <Plus className="w-5 h-5" />
             </button>
          </div>
          <div className="relative">
             <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
             <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatGroups.map(chat => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedGroupId(chat.id)}
              className={`p-4 flex items-center gap-3 hover:bg-white cursor-pointer transition-colors border-b border-slate-100 ${selectedGroupId === chat.id ? 'bg-white border-l-4 border-l-emerald-500 shadow-sm' : ''}`}
            >
              <div className="relative">
                <img src={chat.avatar} alt={chat.name} className="w-10 h-10 rounded-full object-cover bg-emerald-100" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                   <h4 className="font-semibold text-sm text-slate-900 truncate">{chat.name}</h4>
                   <span className="text-xs text-slate-400">{new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.lastMessage}</p>
              </div>
              {chat.unreadCount > 0 && (
                <span className="bg-emerald-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">{chat.unreadCount}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedGroup ? (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-3">
              <img src={selectedGroup.avatar} alt="" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-bold text-slate-900">{selectedGroup.name}</h3>
                <span className="text-xs text-green-600 flex items-center gap-1">● Active now</span>
              </div>
            </div>
            <div className="flex gap-4 text-emerald-600">
              <button className="p-2 hover:bg-emerald-50 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-emerald-50 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
              <button className="p-2 hover:bg-emerald-50 rounded-full transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F0F2F5] bg-opacity-50" ref={scrollRef}>
            {currentMessages.length === 0 && (
                <div className="text-center text-slate-400 mt-10">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            )}
            {currentMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isSelf ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                  msg.isSelf 
                    ? 'bg-emerald-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}>
                  {!msg.isSelf && <p className="text-[10px] font-bold text-slate-500 mb-1">{msg.senderName}</p>}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                        {msg.attachments.map((att, idx) => (
                            <div key={idx} className="bg-black/10 p-2 rounded flex items-center gap-2">
                                <Paperclip className="w-3 h-3" />
                                <span className="text-xs underline cursor-pointer">{att.name}</span>
                            </div>
                        ))}
                    </div>
                  )}

                  <span className={`text-[10px] block mt-1 ${msg.isSelf ? 'text-emerald-200 text-right' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all">
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <ImageIcon className="w-5 h-5" />
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-2"
              />
              <button 
                onClick={handleSendMessage}
                className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
             <div className="text-center">
                 <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                 <p>Select a chat to start messaging</p>
             </div>
        </div>
      )}

      {/* New Group Modal */}
      {isNewGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl p-6 w-96">
                <h3 className="text-lg font-bold mb-4">Create New Group</h3>
                <form onSubmit={handleCreateGroup}>
                    <input 
                        type="text" 
                        placeholder="Group Name" 
                        className="w-full border p-2 rounded mb-4"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsNewGroupModalOpen(false)} className="px-4 py-2 text-slate-600">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded">Create</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
