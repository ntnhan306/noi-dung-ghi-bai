
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            onClick=${handleSecretEntry}
            title="Nhấp 5 lần để vào chế độ chỉnh sửa"
          >
            <div className=${`bg-blue-600 p-2 rounded-lg transition-colors ${secretCount > 0 ? 'bg-blue-700 ring-2 ring-blue-200' : ''}`}>
              <${BookOpen} className="text-white w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl text-gray-800 tracking-tight">
              Nội dung ghi bài
            </span>
          </div>

          <nav className="flex items-center gap-2">
            ${isEditMode && html`
              <${Link} 
                to="/view" 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all font-sans"
              >
                <${BookOpen} size=${16} /> Chế độ xem
              </${Link}>
            `}
            
            <!-- Hidden Edit Button: Accessed via clicking the logo 5 times -->
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ${children}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm font-sans">
          <p>&copy; ${new Date().getFullYear()} Nội dung ghi bài. Powered by Cloudflare Workers & D1.</p>
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
