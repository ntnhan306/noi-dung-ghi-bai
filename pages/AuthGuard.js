
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
    const session = sessionStorage.getItem('auth_session');
    if (session === 'valid') {
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
        sessionStorage.setItem('auth_session', 'valid');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <${Lock} className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Khu vực Quản trị</h2>
          <p className="text-blue-100 mt-2 text-sm">Vui lòng nhập mật khẩu để chỉnh sửa nội dung.</p>
        </div>

        <div className="p-8">
          <form onSubmit=${handleLogin}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu bảo vệ</label>
              <input 
                type="password" 
                value=${password}
                onChange=${(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg select-text"
                placeholder="Nhập mật khẩu..."
                autoFocus
              />
              ${error && html`<p className="text-red-500 text-sm mt-2">${error}</p>`}
              <p className="text-xs text-gray-400 mt-2 italic">Gợi ý demo: nhập 'admin' hoặc 'secret123'</p>
            </div>

            <button 
              type="submit"
              disabled=${checking}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 disabled:opacity-50"
            >
              ${checking ? 'Đang kiểm tra...' : html`
                <${React.Fragment}>Truy cập <${ArrowRight} size=${18} /></${React.Fragment}>
              `}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <${Link} to="/view" className="text-sm text-gray-500 hover:text-blue-600 hover:underline">
               Quay lại trang xem
             </${Link}>
          </div>
        </div>
      </div>
    </div>
  `;
};