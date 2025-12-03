
import React, { useState, useEffect } from 'react';
import { html } from '../utils/html.js';
import { Link } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export const AuthGuard = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  // Simple session persistence for refresh
  useEffect(() => {
    const storedPass = sessionStorage.getItem('auth_pass');
    if (storedPass) {
      // Optimistically set true, real check happens in Explorer's fetchData
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setChecking(true);
    setError('');

    try {
      const isValid = await apiService.verifyPassword(password);
      if (isValid) {
        setIsAuthenticated(true);
        // Store password to send in headers for periodic validation
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

  if (isAuthenticated) {
    return children;
  }

  return html`
    <div className="min-h-screen flex items-center justify-center px-4 font-sans relative overflow-hidden">
      <!-- Background handled by App.js layout, just centering here -->
      
      <div className="max-w-md w-full bg-white/40 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-br from-indigo-600/90 to-violet-600/90 p-8 text-center relative overflow-hidden">
            <!-- Decorative circle -->
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <${Lock} className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Khu vực Quản trị</h2>
          <p className="text-indigo-100 mt-2 text-sm font-medium">Vui lòng nhập mật khẩu để tiếp tục</p>
        </div>

        <div className="p-8 bg-white/30">
          <form onSubmit=${handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Mật khẩu bảo vệ</label>
              <input 
                type="password" 
                value=${password}
                onChange=${(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 rounded-xl border border-white/60 bg-white/60 focus:bg-white focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-lg select-text shadow-inner"
                placeholder="Nhập mật khẩu..."
                autoFocus
              />
              ${error && html`<p className="text-red-500 text-sm mt-3 font-medium bg-red-50/50 p-2 rounded-lg border border-red-100 text-center">${error}</p>`}
              <p className="text-xs text-slate-500 mt-3 text-center">Gợi ý demo: 'admin' hoặc 'secret123'</p>
            </div>

            <button 
              type="submit"
              disabled=${checking}
              className="w-full bg-slate-900/90 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ${checking ? 'Đang kiểm tra...' : html`
                <${React.Fragment}>Truy cập <${ArrowRight} size=${18} /></${React.Fragment}>
              `}
            </button>
          </form>
          
          <div className="mt-8 text-center border-t border-slate-200/50 pt-6">
             <${Link} to="/view" className="text-sm font-medium text-slate-600 hover:text-indigo-600 hover:underline decoration-2 underline-offset-4 transition-colors">
               Quay lại trang xem
             </${Link}>
          </div>
        </div>
      </div>
    </div>
  `;
};
