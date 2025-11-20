
import React, { useState, useEffect } from 'react';
import { html } from '../utils/html.js';
import { X, Check } from 'lucide-react';
import { NodeType, NODE_LABELS } from '../types.js';

export const EditorModal = ({ 
  isOpen, 
  mode, 
  initialData, 
  targetType, 
  onClose, 
  onSave 
}) => {
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
    } else {
      setTitle('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...initialData,
      title,
      type: targetType,
      content: initialData?.content || '' 
    });
    onClose();
  };

  return html`
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white/90 backdrop-blur rounded-3xl shadow-2xl ring-1 ring-white/50 w-full max-w-lg overflow-hidden flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-800">
              ${mode === 'CREATE' ? 'Tạo mới' : 'Cập nhật'} ${NODE_LABELS[targetType]}
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-1 uppercase tracking-wider">Nhập thông tin chi tiết</p>
          </div>
          <button onClick=${onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors">
            <${X} size=${20} />
          </button>
        </div>

        <form onSubmit=${handleSubmit} className="p-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">Tiêu đề mục</label>
            <input
              type="text"
              required
              value=${title}
              onChange=${(e) => setTitle(e.target.value)}
              className="w-full px-5 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-lg placeholder:text-slate-400 shadow-inner"
              placeholder="Ví dụ: Toán học, Chương 1..."
              autoFocus
            />
          </div>
        </form>

        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick=${onClose}
            className="px-6 py-3 text-slate-600 font-medium hover:bg-white hover:text-slate-800 hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick=${handleSubmit}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <${Check} size=${18} strokeWidth=${2.5} />
            ${mode === 'CREATE' ? 'Tạo ngay' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  `;
};
