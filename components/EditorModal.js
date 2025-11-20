import React, { useState, useEffect } from 'react';
import { html } from 'htm/react';
import { X } from 'lucide-react';
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
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setContent(initialData?.content || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...initialData,
      title,
      content: targetType === NodeType.LESSON ? content : undefined,
      type: targetType
    });
    onClose();
  };

  return html`
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">
            ${mode === 'CREATE' ? 'Thêm mới' : 'Chỉnh sửa'} ${NODE_LABELS[targetType]}
          </h2>
          <button onClick=${onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <${X} size=${24} />
          </button>
        </div>

        <form onSubmit=${handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
            <input
              type="text"
              required
              value=${title}
              onChange=${(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Nhập tiêu đề..."
            />
          </div>

          ${targetType === NodeType.LESSON && html`
            <div className="flex-1 flex flex-col min-h-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung bài học</label>
              <textarea
                value=${content}
                onChange=${(e) => setContent(e.target.value)}
                className="w-full flex-1 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-serif"
                placeholder="Nhập nội dung bài học..."
                style=${{ minHeight: '300px' }}
              />
              <p className="text-xs text-gray-500 mt-1">Hỗ trợ văn bản thuần (Ghi chú đơn giản).</p>
            </div>
          `}
        </form>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick=${onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>
          <button 
            onClick=${handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
          >
            Lưu lại
          </button>
        </div>
      </div>
    </div>
  `;
};