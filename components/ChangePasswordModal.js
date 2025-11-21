
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 text-slate-800">
            <${Lock} size=${20} className="text-blue-600" />
            <h2 className="text-lg font-semibold">Đổi mật khẩu quản trị</h2>
          </div>
          <button onClick=${onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <${X} size=${24} />
          </button>
        </div>

        <form onSubmit=${handleSubmit} className="p-6 flex flex-col gap-4">
          ${success ? html`
            <div className="flex flex-col items-center justify-center py-6 text-green-600 animate-pulse">
              <${CheckCircle} size=${48} className="mb-2" />
              <p className="font-medium">Đổi mật khẩu thành công!</p>
            </div>
          ` : html`
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                required
                value=${newPassword}
                onChange=${(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 select-text"
                placeholder="Nhập mật khẩu mới..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value=${confirmPassword}
                onChange=${(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-slate-900 select-text"
                placeholder="Nhập lại mật khẩu..."
              />
            </div>
            ${error && html`<p className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-100">${error}</p>`}
          `}
        </form>

        ${!success && html`
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
              type="button" 
              onClick=${onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick=${handleSubmit}
              disabled=${loading}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              ${loading ? 'Đang lưu...' : html`<${React.Fragment}><${Save} size=${18} /> Lưu thay đổi</${React.Fragment}>`}
            </button>
          </div>
        `}
      </div>
    </div>
  `;
};