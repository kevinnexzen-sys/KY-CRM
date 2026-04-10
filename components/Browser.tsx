
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Search, ArrowLeft, ArrowRight, RotateCw, X, Plus, Star, MoreVertical, Lock, Globe } from 'lucide-react';
import { BrowserTab } from '../types';

export const Browser: React.FC = () => {
  const { browserTabs, updateBrowserTabs } = useData();
  const [activeTabId, setActiveTabId] = useState<string>(browserTabs.find(t => t.active)?.id || browserTabs[0].id);
  const [urlInput, setUrlInput] = useState<string>("");

  const activeTab = browserTabs.find(t => t.id === activeTabId) || browserTabs[0];

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = urlInput;
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`; // Use Google proxy friendly URL for demo
    }
    
    updateTab(activeTabId, { 
      url: targetUrl, 
      title: targetUrl, // Ideally would fetch title
      history: [...activeTab.history, targetUrl]
    });
  };

  const updateTab = (id: string, updates: Partial<BrowserTab>) => {
    const newTabs = browserTabs.map(t => t.id === id ? { ...t, ...updates } : t);
    updateBrowserTabs(newTabs);
  };

  const handleNewTab = () => {
    const newId = Date.now().toString();
    const newTab: BrowserTab = {
      id: newId,
      title: 'New Tab',
      url: 'about:blank',
      active: true,
      history: []
    };
    updateBrowserTabs([...browserTabs.map(t => ({...t, active: false})), newTab]);
    setActiveTabId(newId);
    setUrlInput("");
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (browserTabs.length === 1) return; // Keep at least one tab
    const newTabs = browserTabs.filter(t => t.id !== id);
    if (id === activeTabId) {
       newTabs[newTabs.length - 1].active = true;
       setActiveTabId(newTabs[newTabs.length - 1].id);
    }
    updateBrowserTabs(newTabs);
  };

  const switchTab = (id: string) => {
    setActiveTabId(id);
    const tab = browserTabs.find(t => t.id === id);
    if (tab) {
        setUrlInput(tab.url === 'about:blank' ? '' : tab.url);
        updateBrowserTabs(browserTabs.map(t => ({...t, active: t.id === id})));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-lg overflow-hidden border border-slate-300 shadow-sm">
      {/* Browser Chrome */}
      <div className="bg-slate-200 border-b border-slate-300">
        {/* Tabs */}
        <div className="flex items-center px-2 pt-2 space-x-1 overflow-x-auto no-scrollbar">
          {browserTabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex items-center max-w-[200px] px-3 py-2 text-xs rounded-t-lg cursor-pointer select-none transition-colors group ${
                tab.id === activeTabId ? 'bg-white text-slate-800 shadow-sm z-10' : 'bg-transparent text-slate-600 hover:bg-slate-300/50'
              }`}
            >
              <Globe className="w-3 h-3 mr-2 opacity-70" />
              <span className="truncate flex-1 mr-2">{tab.title}</span>
              <button 
                onClick={(e) => closeTab(e, tab.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded-full transition-opacity"
              >
                <X className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          ))}
          <button onClick={handleNewTab} className="p-1 hover:bg-slate-300 rounded-full text-slate-600">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-2 flex items-center space-x-3 border-b border-slate-200">
          <div className="flex items-center space-x-2 text-slate-600">
            <button className="p-1.5 hover:bg-slate-100 rounded-full"><ArrowLeft className="w-4 h-4" /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-full"><ArrowRight className="w-4 h-4" /></button>
            <button onClick={() => {}} className="p-1.5 hover:bg-slate-100 rounded-full"><RotateCw className="w-4 h-4" /></button>
          </div>
          
          <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center bg-slate-100 rounded-full px-3 py-1.5 border border-transparent focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <Lock className="w-3 h-3 text-green-600 mr-2" />
            <input 
              type="text" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Search Google or enter a URL"
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder-slate-400"
            />
            <Star className="w-4 h-4 text-slate-400 hover:text-yellow-400 cursor-pointer" />
          </form>

          <div className="flex items-center space-x-2 text-slate-600">
            <button className="p-1.5 hover:bg-slate-100 rounded-full"><MoreVertical className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white relative">
        {activeTab.url === 'about:blank' ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <h3 className="text-xl font-semibold text-slate-300">New Tab</h3>
            </div>
        ) : (
            <iframe 
                src={activeTab.url} 
                className="w-full h-full border-none" 
                title="browser-content"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
        )}
      </div>
    </div>
  );
};
