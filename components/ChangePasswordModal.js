
import React, { useState } from 'react';
import { html } from '../utils/html.js';
import { X, Lock, Save, CheckCircle } from 'lucide-react';

export const ChangePasswordModal = ({ isOpen, onClose, onSave }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (newPassword.length < 4) {
      setError('Mật khẩu quá ngắn.');
      return;
    }

    setLoading(true);
    const result = await onSave(newPassword);
    setLoading(false);

    if (result) {
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } else {
      setError('Có lỗi khi lưu mật khẩu. Vui lòng thử lại.');
    }
  };

  return html`
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-glass w-full max-w-md overflow-hidden transform transition-all border border-white/40 ring-1 ring-white/60">
        <div className="px-6 py-4 border-b border-white/30 flex justify-between items-center bg-white/40">
          <div className="flex items-center gap-2 text-slate-800">
            <${Lock} size=${20} className="text-indigo-600" />
            <h2 className="text-lg font-bold font-serif">Đổi mật khẩu</h2>
          </div>
          <button onClick=${onClose} className="text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-full p-2 transition-colors">
            <${X} size=${24} />
          </button>
        </div>

        <form onSubmit=${handleSubmit} className="p-6 flex flex-col gap-5">
          ${success ? html`
            <div className="flex flex-col items-center justify-center py-8 text-emerald-600 animate-pulse bg-emerald-50/50 rounded-2xl border border-emerald-100">
              <${CheckCircle} size=${48} className="mb-2" />
              <p className="font-bold text-lg">Thành công!</p>
            </div>
          ` : html`
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Mật khẩu mới</label>
              <input
                type="password"
                required
                value=${newPassword}
                onChange=${(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 select-text shadow-inner"
                placeholder="Nhập mật khẩu mới..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value=${confirmPassword}
                onChange=${(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/50 bg-white/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-900 select-text shadow-inner"
                placeholder="Nhập lại mật khẩu..."
              />
            </div>
            ${error && html`<p className="text-red-500 text-sm bg-red-50/80 p-3 rounded-xl border border-red-100 text-center font-medium">${error}</p>`}
          `}
        </form>

        ${!success && html`
          <div className="px-6 py-4 border-t border-white/30 bg-white/30 flex justify-end gap-3">
            <button 
              type="button" 
              onClick=${onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:bg-white/60 rounded-xl transition-colors border border-transparent hover:border-white/50"
            >
              Hủy
            </button>
            <button 
              onClick=${handleSubmit}
              disabled=${loading}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70 border border-white/10"
            >
              ${loading ? 'Đang lưu...' : html`<${React.Fragment}><${Save} size=${18} /> Lưu thay đổi</${React.Fragment}>`}
            </button>
          </div>
        `}
      </div>
    </div>
  `;
};
