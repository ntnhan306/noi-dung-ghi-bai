
import React, { useState, useEffect, useRef } from 'react';
import { html } from './utils/html.js';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link, useNavigate } from 'react-router-dom';
import { Explorer } from './pages/Explorer.js';
import { AuthGuard } from './pages/AuthGuard.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { BookOpen, Lock, ShieldAlert } from 'lucide-react';
import { apiService } from './services/apiService.js';

const getBasename = () => {
  const path = window.location.pathname;
  if (path.includes('/app/application/phone/special-application/view')) {
      return '/noi-dung-ghi-bai/app/application/phone/special-application';
  }
  const hostname = window.location.hostname;
  if (hostname.includes('github.io')) return '/noi-dung-ghi-bai';
  return '/';
};

const AnimatedRoutes = ({ isAppMode, uiConfig }) => {
    const location = useLocation();
    const prevDepth = useRef(0);
    const [direction, setDirection] = useState('right');

    useEffect(() => {
        const currentDepth = location.pathname.split('/').filter(Boolean).length;
        if (currentDepth > prevDepth.current) setDirection('right');
        else if (currentDepth < prevDepth.current) setDirection('left');
        prevDepth.current = currentDepth;
    }, [location]);

    const animationClass = isAppMode 
        ? (direction === 'right' ? 'animate-[slideInRight_0.3s_ease-out]' : 'animate-[slideInLeft_0.3s_ease-out]') 
        : '';

    return html`
        <div key=${location.pathname} className=${`w-full ${animationClass}`}>
            <${Routes} location=${location}>
                <${Route} key="route-home" path="/" element=${html`<${Navigate} to="/view" replace />`} />
                <${Route} key="route-view" path="/view" element=${html`<${Explorer} mode="view" isAppMode=${isAppMode} uiConfig=${uiConfig} />`} />
                <${Route} key="route-view-node" path="/view/:nodeId" element=${html`<${Explorer} mode="view" isAppMode=${isAppMode} uiConfig=${uiConfig} />`} />
                ${!isAppMode && html`
                    <${React.Fragment} key="edit-routes">
                        <${Route} key="route-edit" path="/edit" element=${html`<${AuthGuard}><${Explorer} mode="edit" uiConfig=${uiConfig} /></${AuthGuard}>`} />
                        <${Route} key="route-settings" path="/edit/settings" element=${html`<${AuthGuard}><${SettingsPage} /></${AuthGuard}>`} />
                        <${Route} key="route-edit-node" path="/edit/:nodeId" element=${html`<${AuthGuard}><${Explorer} mode="edit" uiConfig=${uiConfig} /></${AuthGuard}>`} />
                    </${React.Fragment}>
                `}
                <${Route} key="route-catch-all" path="*" element=${html`<${Navigate} to="/view" replace />`} />
            </${Routes}>
        </div>
    `;
}

const Layout = ({ children, isAppMode, uiConfig, currentBg }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isEditMode = location.pathname.startsWith('/edit');
  const [secretCount, setSecretCount] = useState(0);

  useEffect(() => {
    let timer;
    if (secretCount > 0) timer = setTimeout(() => setSecretCount(0), 1000);
    return () => clearTimeout(timer);
  }, [secretCount]);

  const handleSecretEntry = () => {
    if (isAppMode) return; 
    if (isEditMode) return;
    const newCount = secretCount + 1;
    setSecretCount(newCount);
    if (newCount >= 5) {
      setSecretCount(0);
      navigate('/edit');
    }
  };

  const isLiquid = uiConfig.style === 'liquid';

  return html`
    <!-- BACKGROUND -->
    <div key="layout-background" className="fixed inset-0 -z-10 bg-slate-50 overflow-hidden pointer-events-none transition-all duration-1000">
        ${(uiConfig.backgroundActive && currentBg) ? html`
            <div key="bg-image" className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out" style=${{ backgroundImage: `url('${currentBg}')` }}>
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]"></div>
            </div>
        ` : isLiquid ? html`
            <div key="liquid-blobs" className="absolute inset-0 overflow-hidden">
                <div key="blob-1" className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob"></div>
                <div key="blob-2" className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
                <div key="blob-3" className="absolute -bottom-32 left-[20%] w-[800px] h-[800px] bg-pink-300/30 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000"></div>
                <div key="blob-4" className="absolute top-[40%] right-[30%] w-[600px] h-[600px] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-2000"></div>
                <div key="blob-5" className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-yellow-200/40 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob animation-delay-4000"></div>
            </div>
        ` : html`
             <div key="bg-default" className="absolute inset-0 bg-slate-50"></div>
        `}
    </div>

    <div key="layout-main" className="min-h-screen flex flex-col overflow-x-hidden">
      <header className=${`sticky top-0 z-30 transition-all duration-300 ${isAppMode ? 'h-16' : 'h-20'} ${isLiquid ? 'bg-white/60 backdrop-blur-xl border-b border-white/20' : 'bg-white border-b border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer select-none active:scale-95 transition-transform group" onClick=${handleSecretEntry}>
            <div key="logo-container" className=${`relative p-2.5 rounded-2xl border transition-all duration-500 overflow-hidden ${isLiquid ? 'bg-white/20 backdrop-blur-md border-white/50 shadow-glass group-hover:shadow-neon' : 'bg-white border-slate-200 shadow-sm'} ${secretCount > 0 ? 'ring-2 ring-indigo-400' : ''}`}>
              ${isLiquid && html`<div key="liquid-bg" className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>`}
              <${BookOpen} key="logo-icon" className=${`relative z-10 text-indigo-600 drop-shadow-sm ${isAppMode ? "w-5 h-5" : "w-7 h-7"}`} strokeWidth=${2.5} />
            </div>
            <div key="logo-text" className="flex flex-col">
                <span key="main-label" className=${`font-serif font-bold tracking-tight drop-shadow-sm ${isAppMode ? 'text-xl' : 'text-2xl'} ${isLiquid ? 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-violet-900' : 'text-slate-800'}`}>Nội dung ghi bài</span>
                ${!isAppMode && html`<span key="sub-label" className="text-[10px] font-bold tracking-[0.2em] text-indigo-400 uppercase opacity-0 group-hover:opacity-100 transition-opacity -mt-1">Cloud Learning</span>`}
            </div>
          </div>
          <nav className="flex items-center gap-3">
            ${isEditMode && !isAppMode && html`
              <${Link} key="view-mode-link" to="/view" className=${`relative overflow-hidden flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full transition-all group ${isLiquid ? 'text-indigo-900 bg-white/30 hover:bg-white/60 border border-white/60 shadow-glass hover:shadow-lg backdrop-blur-md' : 'text-slate-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-indigo-600'}`}>
                ${isLiquid && html`<div key="liquid-overlay" className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>`}
                <${BookOpen} key="view-icon" size=${16} /> Chế độ xem
              </${Link}>
            `}
          </nav>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        ${children}
      </main>
      <footer className=${`border-t py-8 mt-auto ${isLiquid ? 'bg-white/30 border-white/20 backdrop-blur-sm' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p key="footer-text" className="text-slate-900 text-sm font-sans font-medium">
            <span key="copyright">© ${new Date().getFullYear()} Nội dung ghi bài.</span>
            ${!isAppMode && html`
              <${React.Fragment} key="footer-extra">
                <span key="sep" className="text-slate-400 mx-2">|</span>
                <span key="system" className=${isLiquid ? 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 font-bold' : 'text-indigo-600 font-bold'}>Cloud System</span>
              </${React.Fragment}>
            `}
          </p>
        </div>
      </footer>
    </div>
  `;
};

const AccessDenied = () => {
    return html`
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <div className="w-32 h-32 bg-red-100/50 backdrop-blur-xl border border-white/50 text-red-500 rounded-full flex items-center justify-center mb-8 animate-float shadow-glass"><${ShieldAlert} size=${56} /></div>
            <h1 className="text-4xl font-serif font-bold text-slate-800 mb-4">Truy cập bị từ chối</h1>
            <p className="text-slate-500 max-w-md mx-auto font-medium text-lg">Yêu cầu không hợp lệ. Bạn cần có đủ mã khóa xác thực để truy cập ứng dụng này.</p>
        </div>
    `;
};

const App = () => {
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [uiConfig, setUiConfig] = useState({ style: 'liquid', zoom: { view: true, edit: true, app: false }, backgroundActive: false, backgrounds: [] });
  const [currentBg, setCurrentBg] = useState(null);
  const isAppMode = window.location.pathname.includes('/special-application/');

  useEffect(() => {
    if (isAppMode) {
        const params = new URLSearchParams(window.location.search);
        const REQUIRED_KEYS = { 'key': 'NoiDungGhiBaiSecret2024', 'key1': 'lty7zpnw5osslfj1o89znurovmi0y8d9cv5zuukgxigqbowjyaf3hnek0toeee0tdh6h6gtixzt3v6fmafpr9qsowkns9pyswavb', 'key2': 'anklp677xs4nukuzzbiluus4q5yssi9wr662tqcth6sfacdlm0wcafae0dopwm5c7d3t36yqh1us1ok7rpt0y75dry0bsmkkpqga', 'key3': 'g81jkmi8bu2rrlvhffxa3kl0ameqg15ywdsvrm1b7f4j9swj6pr3rtsr2dqmwv1sygflf36ytudl3md56f8xo170f2z0zd7e70oy0idfe0fufq4eexptckzufcnkkpqt6bb6mtf498ipnevocimmi9', 'key4': 'xzyne6bybfqbam1bqabtrkgyo7vxsz68zr0w6w5g5od9rmjg4i3jnmobscejymmwte7wk7qcmpew8ivzyxh6witbd70q7an5aizec1fr911hogee27ve539zy3zlloqwnhzm0lkr2bfxj51pqofipo', 'key5': '2l36em0t88qlugivnz6x8b8rzwseoawequ578dzy2yuly7kiy58vyjwy3pvv1ap7x806mgx8vcilp0aycrn4taa01n3k12c10cymgkm3ay9ij1g25n2kim30cg0hui6697vw68qw6106b907z4efklmkfs0gb9th8mke9w0zngih3lcc2gc1204llbvvsjo5dixkupo5' };
        let isValid = true;
        for (const [paramName, expectedValue] of Object.entries(REQUIRED_KEYS)) { if (params.get(paramName) !== expectedValue) { isValid = false; break; } }
        if (!isValid) setIsAuthorized(false);
    }
  }, [isAppMode]);

  useEffect(() => {
      const initConfig = async () => {
          const fullConfig = await apiService.getFullConfig();
          setUiConfig({
              style: fullConfig.ui.style,
              zoom: fullConfig.ui.zoom,
              backgroundActive: fullConfig.background.active,
              backgrounds: fullConfig.background.images
          });
          
          if (fullConfig.background.active && fullConfig.background.images.length > 0) {
            setCurrentBg(fullConfig.background.images[Math.floor(Math.random() * fullConfig.background.images.length)]);
          }
      };
      initConfig();
  }, []);

  useEffect(() => {
    if (!uiConfig.backgroundActive || uiConfig.backgrounds.length <= 1) return;
    const interval = setInterval(() => {
        const otherBgs = uiConfig.backgrounds.filter(bg => bg !== currentBg);
        if (otherBgs.length > 0) setCurrentBg(otherBgs[Math.floor(Math.random() * otherBgs.length)]);
    }, 60000);
    return () => clearInterval(interval);
  }, [uiConfig, currentBg]);

  if (!isAuthorized) return html`<${AccessDenied} />`;

  return html`
    <${BrowserRouter} basename=${getBasename()}>
      <${Layout} isAppMode=${isAppMode} uiConfig=${uiConfig} currentBg=${currentBg}>
         <${AnimatedRoutes} isAppMode=${isAppMode} uiConfig=${uiConfig} />
      </${Layout}>
    </${BrowserRouter}>
  `;
};

export default App;
