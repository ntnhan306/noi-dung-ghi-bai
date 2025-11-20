import React from 'react';
import { html } from './utils/html.js';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Explorer } from './pages/Explorer.js';
import { AuthGuard } from './pages/AuthGuard.js';
import { BookOpen, Lock } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();
  const isEditMode = location.pathname.startsWith('/edit');

  return html`
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <${BookOpen} className="text-white w-5 h-5" />
            </div>
            <span className="font-serif font-bold text-xl text-gray-800 tracking-tight">
              Nội dung ghi bài
            </span>
          </div>

          <nav className="flex items-center gap-2">
            ${isEditMode ? html`
              <a 
                href="#/view" 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all font-sans"
              >
                <${BookOpen} size=${16} /> Chế độ xem
              </a>
            ` : html`
              <a 
                href="#/edit" 
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all font-sans"
              >
                <${Lock} size=${16} /> Chế độ sửa
              </a>
            `}
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
    <${HashRouter}>
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
    </${HashRouter}>
  `;
};

export default App;