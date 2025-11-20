
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">
            ${mode === 'CREATE' ? 'Tạo mới' : 'Cập nhật'} ${NODE_LABELS[targetType]}
          </h2>
          <button onClick=${onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full p-1 transition-colors">
            <${X} size=${20} />
          </button>
        </div>

        <form onSubmit=${handleSubmit} className="p-8 flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tiêu đề mục</label>
            <input
              type="text"
              required
              value=${title}
              onChange=${(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg placeholder:text-slate-300"
              placeholder="Ví dụ: Toán học, Chương 1..."
              autoFocus
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick=${onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick=${handleSubmit}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all flex items-center gap-2"
          >
            <${Check} size=${18} />
            ${mode === 'CREATE' ? 'Tạo ngay' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  `;
};
