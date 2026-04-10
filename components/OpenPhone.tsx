
import React, { useState } from 'react';
import { Search, ArrowLeft, ArrowRight, RotateCw, X, Star, MoreVertical, Lock, Globe } from 'lucide-react';

export const OpenPhone: React.FC = () => {
  const [url, setUrl] = useState('https://www.google.com/webhp?igu=1');
  const [urlInput, setUrlInput] = useState('https://www.google.com/webhp?igu=1');
  const [history, setHistory] = useState<string[]>(['https://www.google.com/webhp?igu=1']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetUrl = urlInput;
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`;
    }
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(targetUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setUrl(targetUrl);
    setUrlInput(targetUrl);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setUrlInput(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUrl(history[newIndex]);
      setUrlInput(history[newIndex]);
    }
  };

  const reload = () => {
    const currentUrl = url;
    setUrl('about:blank');
    setTimeout(() => setUrl(currentUrl), 10);
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f3f4] rounded-xl overflow-hidden border border-slate-300 shadow-lg font-sans">
      {/* Browser Tabs Bar (Chrome Style) */}
      <div className="flex items-center px-2 pt-2 space-x-0 bg-[#dee1e6] h-10">
        <div className="flex items-center w-[240px] h-8 px-3 py-2 text-[11px] font-medium rounded-t-lg cursor-default select-none bg-white text-slate-800 shadow-sm z-10 relative">
          <div className="w-4 h-4 mr-2 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="truncate flex-1 mr-2">Google</span>
          <button className="p-0.5 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-3 h-3 text-slate-500" />
          </button>
          
          {/* Tab shape corners (SVG for perfect Chrome look) */}
          <svg className="absolute bottom-0 -left-[8px] w-[8px] h-[8px] text-white fill-current" viewBox="0 0 8 8">
            <path d="M 8 8 L 8 0 C 8 4 4 8 0 8 Z" />
          </svg>
          <svg className="absolute bottom-0 -right-[8px] w-[8px] h-[8px] text-white fill-current" viewBox="0 0 8 8">
            <path d="M 0 8 L 0 0 C 0 4 4 8 8 8 Z" />
          </svg>
        </div>
        
        {/* Strictly NO Plus button here as per request */}
        <div className="flex-1"></div>
      </div>

      {/* Toolbar (Chrome Style) */}
      <div className="bg-white p-1.5 flex items-center space-x-2 border-b border-slate-200">
        <div className="flex items-center space-x-0.5 text-slate-600">
          <button 
            onClick={goBack} 
            disabled={historyIndex === 0}
            className={`p-2 rounded-full transition-colors ${historyIndex === 0 ? 'text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={goForward} 
            disabled={historyIndex === history.length - 1}
            className={`p-2 rounded-full transition-colors ${historyIndex === history.length - 1 ? 'text-slate-300' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button 
            onClick={reload}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center bg-[#f1f3f4] rounded-full px-4 py-1.5 border border-transparent focus-within:bg-white focus-within:border-slate-300 focus-within:shadow-sm transition-all group">
          <div className="flex items-center mr-2">
            <Lock className="w-3 h-3 text-slate-500" />
          </div>
          <input 
            type="text" 
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search Google or enter a URL"
            className="flex-1 bg-transparent border-none focus:ring-0 text-[13px] text-slate-700 placeholder-slate-400 p-0 h-5"
          />
          <Star className="w-4 h-4 text-slate-400 hover:text-yellow-400 cursor-pointer transition-colors" />
        </form>

        <div className="flex items-center space-x-0.5 text-slate-600">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white relative">
        <iframe 
          src={url} 
          className="w-full h-full border-none" 
          title="browser-content"
          allow="camera; microphone; geolocation; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};
