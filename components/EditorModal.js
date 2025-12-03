
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white/70 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/60 w-full max-w-lg overflow-hidden flex flex-col transform transition-all scale-100 animate-in zoom-in-95 duration-200 ring-1 ring-white/50 relative">
        <!-- Shine effect -->
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none"></div>

        <div className="px-8 py-6 border-b border-white/40 flex justify-between items-center bg-white/40 relative z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-800">
              ${mode === 'CREATE' ? 'Tạo mới' : 'Cập nhật'} ${NODE_LABELS[targetType]}
            </h2>
            <p className="text-xs text-indigo-600 font-bold tracking-widest uppercase mt-1">Thông tin chi tiết</p>
          </div>
          <button onClick=${onClose} className="text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-full p-2.5 transition-colors">
            <${X} size=${24} />
          </button>
        </div>

        <form onSubmit=${handleSubmit} className="p-8 flex flex-col gap-6 relative z-10">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-3 ml-1">Tiêu đề mục</label>
            <input
              type="text"
              required
              value=${title}
              onChange=${(e) => setTitle(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl border border-white/60 bg-white/40 focus:bg-white/80 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all text-xl font-medium placeholder:text-slate-400 shadow-inner select-text"
              placeholder="Nhập tiêu đề..."
              autoFocus
            />
          </div>
        </form>

        <div className="px-8 py-6 border-t border-white/40 bg-white/30 flex justify-end gap-3 relative z-10">
          <button 
            type="button" 
            onClick=${onClose}
            className="px-6 py-3.5 text-slate-600 font-bold hover:bg-white/60 hover:text-slate-900 rounded-xl transition-all border border-transparent hover:border-white/50"
          >
            Hủy bỏ
          </button>
          <button 
            onClick=${handleSubmit}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 border-t border-white/20"
          >
            <${Check} size=${20} strokeWidth=${3} />
            ${mode === 'CREATE' ? 'Tạo ngay' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  `;
};
