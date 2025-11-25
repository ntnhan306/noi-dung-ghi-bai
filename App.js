
import React, { useState, useEffect, useRef } from 'react';
import { html } from './utils/html.js';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Explorer } from './pages/Explorer.js';
import { AuthGuard } from './pages/AuthGuard.js';
import { BookOpen, Lock, ShieldAlert } from 'lucide-react';

// Detect basename for GitHub Pages vs Cloudflare/Local
const getBasename = () => {
  const path = window.location.pathname;
  // Hỗ trợ đường dẫn đặc biệt cho App
  if (path.includes('/app/application/phone/special-application/view')) {
      return '/noi-dung-ghi-bai/app/application/phone/special-application';
  }
  
  const hostname = window.location.hostname;
  if (hostname.includes('github.io')) {
    return '/noi-dung-ghi-bai';
  }
  return '/';
};

// Component Wrapper để xử lý hiệu ứng chuyển cảnh Slide
const AnimatedRoutes = ({ isAppMode }) => {
    const location = useLocation();
    const prevDepth = useRef(0);
    const [direction, setDirection] = useState('right'); // 'right' (vào), 'left' (ra)

    useEffect(() => {
        // Tính độ sâu của URL để xác định hướng
        const currentDepth = location.pathname.split('/').filter(Boolean).length;
        
        if (currentDepth > prevDepth.current) {
            setDirection('right'); // Vào sâu hơn -> Lướt từ phải qua
        } else if (currentDepth < prevDepth.current) {
            setDirection('left'); // Quay lại -> Lướt từ trái qua
        }
        prevDepth.current = currentDepth;
    }, [location]);

    const animationClass = isAppMode 
        ? (direction === 'right' ? 'animate-[slideInRight_0.3s_ease-out]' : 'animate-[slideInLeft_0.3s_ease-out]') 
        : '';

    return html`
        <div key=${location.pathname} className=${`w-full ${animationClass}`}>
            <${Routes} location=${location}>
                <${Route} path="/" element=${html`<${Navigate} to="/view" replace />`} />
                <${Route} path="/view" element=${html`<${Explorer} mode="view" isAppMode=${isAppMode} />`} />
                <${Route} path="/view/:nodeId" element=${html`<${Explorer} mode="view" isAppMode=${isAppMode} />`} />
                
                <!-- Chặn truy cập Edit nếu là App Mode -->
                ${!isAppMode && html`
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
                `}
                
                <!-- Catch-all route để tránh màn hình trắng nếu đường dẫn bị lệch -->
                <${Route} path="*" element=${html`<${Navigate} to="/view" replace />`} />
            </${Routes}>
        </div>
    `;
}

const Layout = ({ children, isAppMode }) => {
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
    // TẮT TÍNH NĂNG ẨN TRÊN APP MODE
    if (isAppMode) return; 

    if (isEditMode) return;

    const newCount = secretCount + 1;
    setSecretCount(newCount);

    if (newCount >= 5) {
      setSecretCount(0);
      navigate('/edit');
    }
  };

  return html`
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex flex-col overflow-x-hidden">
      <!-- App Mode Header gọn hơn -->
      <header className=${`bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-30 shadow-sm transition-all ${isAppMode ? 'h-16' : 'h-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            onClick=${handleSecretEntry}
          >
            <div className=${`p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/30 text-white transition-all duration-300 ${secretCount > 0 ? 'ring-4 ring-indigo-100' : ''}`}>
              <${BookOpen} className=${isAppMode ? "w-5 h-5" : "w-6 h-6"} strokeWidth=${2.5} />
            </div>
            <span className=${`font-serif font-bold bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent tracking-tight ${isAppMode ? 'text-xl' : 'text-2xl'}`}>
              Nội dung ghi bài
            </span>
          </div>

          <nav className="flex items-center gap-3">
            ${isEditMode && !isAppMode && html`
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

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        ${children}
      </main>

      <footer className="bg-white/60 border-t border-white/50 backdrop-blur-sm py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-sm font-sans font-medium">
            &copy; ${new Date().getFullYear()} Nội dung ghi bài.
            ${!isAppMode && html` <span className="text-slate-300 mx-2">|</span> <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Cloudflare Workers & D1</span>`}
          </p>
        </div>
      </footer>
    </div>
  `;
};

const AccessDenied = () => {
    return html`
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <${ShieldAlert} size=${40} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">Truy cập bị từ chối</h1>
            <p className="text-slate-500 max-w-xs mx-auto">
                Ứng dụng này chỉ được phép truy cập thông qua Ứng dụng Nội dung ghi bài chính thức.
            </p>
        </div>
    `;
};

const App = () => {
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  // 1. Detect App Mode based on URL
  const isAppMode = window.location.pathname.includes('/special-application/');

  useEffect(() => {
    // 2. Security Check: Nếu là App Mode, bắt buộc UserAgent phải đúng
    if (isAppMode) {
        const userAgent = navigator.userAgent;
        if (!userAgent.includes("NoiDungGhiBaiApp")) {
            setIsAuthorized(false);
        }
    }
  }, [isAppMode]);

  if (!isAuthorized) {
      return html`<${AccessDenied} />`;
  }

  // Tăng kích thước font nếu là App Mode
  useEffect(() => {
      if (isAppMode) {
          document.documentElement.classList.add('text-lg'); 
      }
  }, [isAppMode]);

  return html`
    <${BrowserRouter} basename=${getBasename()}>
      <${Layout} isAppMode=${isAppMode}>
         <${AnimatedRoutes} isAppMode=${isAppMode} />
      </${Layout}>
    </${BrowserRouter}>
  `;
};

export default App;
