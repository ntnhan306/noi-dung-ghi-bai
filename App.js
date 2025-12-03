
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
    <!-- LIQUID BACKGROUND CONTAINER -->
    <div className="fixed inset-0 -z-10 bg-slate-50 overflow-hidden pointer-events-none">
        <!-- Blobs -->
        <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-violet-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-[20%] w-[500px] h-[500px] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
    </div>

    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <!-- App Mode Header gọn hơn -->
      <header className=${`bg-white/30 backdrop-blur-lg border-b border-white/20 sticky top-0 z-30 shadow-glass transition-all ${isAppMode ? 'h-16' : 'h-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
            onClick=${handleSecretEntry}
          >
            <div className=${`p-2 rounded-2xl bg-gradient-to-br from-indigo-500/90 to-violet-500/90 shadow-lg shadow-indigo-500/20 text-white transition-all duration-300 ${secretCount > 0 ? 'ring-4 ring-indigo-300/50' : ''}`}>
              <${BookOpen} className=${isAppMode ? "w-5 h-5" : "w-6 h-6"} strokeWidth=${2.5} />
            </div>
            <span className=${`font-serif font-bold bg-gradient-to-r from-slate-800 to-indigo-900 bg-clip-text text-transparent tracking-tight drop-shadow-sm ${isAppMode ? 'text-xl' : 'text-2xl'}`}>
              Nội dung ghi bài
            </span>
          </div>

          <nav className="flex items-center gap-3">
            ${isEditMode && !isAppMode && html`
              <${Link} 
                to="/view" 
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-indigo-600 bg-white/40 hover:bg-white/80 border border-white/50 hover:border-indigo-100 rounded-full transition-all shadow-sm hover:shadow-glass backdrop-blur-sm"
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

      <footer className="bg-white/20 border-t border-white/20 backdrop-blur-md py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm font-sans font-medium">
            &copy; ${new Date().getFullYear()} Nội dung ghi bài.
            ${!isAppMode && html` <span className="text-slate-400 mx-2">|</span> <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">Cloudflare Workers & D1</span>`}
          </p>
        </div>
      </footer>
    </div>
  `;
};

const AccessDenied = () => {
    return html`
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-red-100/50 backdrop-blur text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce shadow-xl">
                <${ShieldAlert} size=${40} />
            </div>
            <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">Truy cập bị từ chối</h1>
            <p className="text-slate-600 max-w-xs mx-auto font-medium">
                Yêu cầu không hợp lệ. Bạn cần có đủ mã khóa xác thực để truy cập ứng dụng này.
            </p>
        </div>
    `;
};

const App = () => {
  const [isAuthorized, setIsAuthorized] = useState(true);
  
  // 1. Detect App Mode based on URL
  const isAppMode = window.location.pathname.includes('/special-application/');

  useEffect(() => {
    // 2. Security Check: Nếu là App Mode, kiểm tra ĐỦ 6 URL Key
    if (isAppMode) {
        // Lấy tham số từ URL hiện tại
        const params = new URLSearchParams(window.location.search);
        
        // BẢNG ĐỐI CHIẾU KEY BẮT BUỘC (AND logic) - SIÊU BẢO MẬT
        const REQUIRED_KEYS = {
            'key': 'NoiDungGhiBaiSecret2024',
            'key1': 'lty7zpnw5osslfj1o89znurovmi0y8d9cv5zuukgxigqbowjyaf3hnek0toeee0tdh6h6gtixzt3v6fmafpr9qsowkns9pyswavb',
            'key2': 'anklp677xs4nukuzzbiluus4q5yssi9wr662tqcth6sfacdlm0wcafae0dopwm5c7d3t36yqh1us1ok7rpt0y75dry0bsmkkpqga',
            'key3': 'g81jkmi8bu2rrlvhffxa3kl0ameqg15ywdsvrm1b7f4j9swj6pr3rtsr2dqmwv1sygflf36ytudl3md56f8xo170f2z0zd7e70oy0idfe0fufq4eexptckzufcnkkpqt6bb6mtf498ipnevocimmi9',
            'key4': 'xzyne6bybfqbam1bqabtrkgyo7vxsz68zr0w6w5g5od9rmjg4i3jnmobscejymmwte7wk7qcmpew8ivzyxh6witbd70q7an5aizec1fr911hogee27ve539zy3zlloqwnhzm0lkr2bfxj51pqofipo',
            'key5': '2l36em0t88qlugivnz6x8b8rzwseoawequ578dzy2yuly7kiy58vyjwy3pvv1ap7x806mgx8vcilp0aycrn4taa01n3k12c10cymgkm3ay9ij1g25n2kim30cg0hui6697vw68qw6106b907z4efklmkfs0gb9th8mke9w0zngih3lcc2gc1204llbvvsjo5dixkupo5'
        };

        let isValid = true;
        // Kiểm tra từng key, nếu thiếu hoặc sai bất kỳ key nào -> Chặn
        for (const [paramName, expectedValue] of Object.entries(REQUIRED_KEYS)) {
            if (params.get(paramName) !== expectedValue) {
                isValid = false;
                break;
            }
        }

        if (!isValid) {
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
