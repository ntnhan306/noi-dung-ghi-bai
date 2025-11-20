
import React, { useState, useEffect } from 'react';
import { html } from './utils/html.js';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Explorer } from './pages/Explorer.js';
import { AuthGuard } from './pages/AuthGuard.js';
import { BookOpen, Lock } from 'lucide-react';

// Detect basename for GitHub Pages vs Cloudflare/Local
const getBasename = () => {
  const hostname = window.location.hostname;
  if (hostname.includes('github.io')) {
    return '/noi-dung-ghi-bai';
  }
  return '/';
};

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.pathname.startsWith('/edit');
  
  // Secret trigger state
  const [secretCount, setSecretCount] = useState(0);

  // Reset secret counter if inactive for 1 second
  useEffect(() => {
    let timer;
    if (secretCount > 0) {
      timer = setTimeout(() => setSecretCount(0), 1000);
    }
    return () => clearTimeout(timer);
  }, [secretCount]);

  const handleSecretEntry = () => {
    if (isEditMode) return; // Already in edit mode

    const newCount = secretCount + 1;
    setSecretCount(newCount);

    // Trigger edit mode on 5th click
    if (newCount >= 5) {
      setSecretCount(0);
      navigate('/edit');
    }
  };

  return html`
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-30 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            onClick=${handleSecretEntry}
            title="Nhấp 5 lần để vào chế độ chỉnh sửa"
          >
            <div className=${`p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 text-white transition-all duration-300 ${secretCount > 0 ? 'ring-4 ring-indigo-100' : ''}`}>
              <${BookOpen} className="w-6 h-6" strokeWidth=${2.5} />
            </div>
            <span className="font-serif font-bold text-2xl bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent tracking-tight">
              Nội dung ghi bài
            </span>
          </div>

          <nav className="flex items-center gap-3">
            ${isEditMode && html`
              <${Link} 
                to="/view" 
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 rounded-full transition-all shadow-sm hover:shadow-md"
              >
                <${BookOpen} size=${16} /> Chế độ xem
              </${Link}>
            `}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        ${children}
      </main>

      <footer className="bg-white/60 border-t border-white/50 backdrop-blur-sm py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-sans font-medium">
            &copy; ${new Date().getFullYear()} Nội dung ghi bài. <span className="text-slate-300 mx-2">|</span> 
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Cloudflare Workers & D1</span>
          </p>
        </div>
      </footer>
    </div>
  `;
};

const App = () => {
  return html`
    <${BrowserRouter} basename=${getBasename()}>
      <${Layout}>
        <${Routes}>
          <${Route} path="/" element=${html`<${Navigate} to="/view" replace />`} />
          
          <${Route} path="/view" element=${html`<${Explorer} mode="view" />`} />
          <${Route} path="/view/:nodeId" element=${html`<${Explorer} mode="view" />`} />

          <${Route} path="/edit" element=${html`
            <${AuthGuard}>
              <${Explorer} mode="edit" />
            </${AuthGuard}>
          `} />
          <${Route} path="/edit/:nodeId" element=${html`
            <${AuthGuard}>
              <${Explorer} mode="edit" />
            </${AuthGuard}>
          `} />
        </${Routes}>
      </${Layout}>
    </${BrowserRouter}>
  `;
};

export default App;
