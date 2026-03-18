
import React, { useState, useEffect } from 'react';
import { html } from '../utils/html.js';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { useBreadcrumbs } from '../context/BreadcrumbContext.js';

export const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setBreadcrumbsVisible } = useBreadcrumbs();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const storedPass = sessionStorage.getItem('auth_pass');
    if (storedPass) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    setBreadcrumbsVisible(isAuthenticated);
    return () => setBreadcrumbsVisible(true);
  }, [isAuthenticated, setBreadcrumbsVisible]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError('');
    try {
      const isValid = await apiService.verifyPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('auth_pass', password);
      } else {
        setError('Mật khẩu không đúng. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra.');
    } finally {
      setChecking(false);
    }
  };

  if (isAuthenticated) return children;

  return html`
    <div className="min-h-screen flex items-center justify-center px-4 font-sans relative overflow-hidden">
      <!-- 3D Floating Auth Card -->
      <div className="max-w-md w-full bg-white/40 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden relative z-10 animate-float ring-1 ring-white/40">
        <!-- Glossy Reflection -->
        <div className="absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-transparent pointer-events-none"></div>

        <div className="bg-gradient-to-br from-indigo-600/90 to-violet-600/90 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
            
          <div className="relative w-20 h-20 bg-white/20 backdrop-blur-md border border-white/40 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 group-hover:rotate-6 transition-transform">
            <${Lock} className="text-white w-10 h-10 drop-shadow-md" strokeWidth=${2.5} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-white tracking-tight drop-shadow-sm">Khu vực Quản trị</h2>
          <p className="text-indigo-100 mt-3 text-sm font-medium tracking-wide opacity-90">Hệ thống bảo mật Cloud Learning</p>
        </div>

        <div className="p-10 bg-white/40 relative z-10">
          <form onSubmit=${handleLogin}>
            <div className="mb-8">
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-3 ml-1">Mật khẩu truy cập</label>
              <div className="relative group">
                  <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <input 
                    type="password" 
                    value=${password}
                    onChange=${(e) => setPassword(e.target.value)}
                    className="relative w-full px-6 py-4 rounded-2xl border border-white/60 bg-white/60 focus:bg-white/90 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xl font-medium tracking-widest select-text shadow-inner"
                    placeholder="••••••••"
                    autoFocus
                  />
              </div>
              ${error && html`<div className="mt-4 p-3 rounded-xl bg-red-50/80 border border-red-100/50 text-red-500 text-sm font-bold text-center animate-pulse shadow-sm">${error}</div>`}
              <p className="text-xs text-slate-400 mt-4 text-center font-medium">Gợi ý: 'admin' hoặc 'secret123'</p>
            </div>

            <button 
              type="submit"
              disabled=${checking}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group border-t border-white/20"
            >
              ${checking ? 'Đang xác thực...' : html`
                <${React.Fragment}>Truy cập ngay <${ArrowRight} size=${20} className="group-hover:translate-x-1 transition-transform" /></${React.Fragment}>
              `}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-slate-300/30 pt-6">
             <${Link} to="/view" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 group">
               <span className="group-hover:-translate-x-1 transition-transform">←</span> Quay lại trang xem
             </${Link}>
          </div>
        </div>
      </div>
    </div>
  `;
};
