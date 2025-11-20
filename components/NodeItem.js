
import React from 'react';
import { html } from '../utils/html.js';
import { Folder, FileText, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { NodeType, NODE_LABELS } from '../types.js';

export const NodeItem = ({ node, isEditMode, onClick, onEdit, onDelete }) => {
  const isLesson = node.type === NodeType.LESSON;

  return html`
    <div 
      className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer p-5 flex items-center justify-between"
      onClick=${() => onClick(node)}
    >
      <div className="flex items-center gap-5 flex-1 overflow-hidden">
        <div className=${`p-3 rounded-xl flex-shrink-0 transition-colors ${isLesson ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
          ${isLesson ? html`<${FileText} size=${24} />` : html`<${Folder} size=${24} />`}
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1 block">
            ${NODE_LABELS[node.type]}
          </span>
          <h3 className="text-lg font-serif font-medium text-slate-800 group-hover:text-blue-700 truncate">
            ${node.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-3 pl-4 border-l border-slate-50 ml-4">
        ${isEditMode && html`
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick=${(e) => e.stopPropagation()}>
            <button 
              onClick=${() => onEdit && onEdit(node)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Sửa tên"
            >
              <${Edit2} size=${16} />
            </button>
            <button 
              onClick=${() => onDelete && onDelete(node)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Xóa"
            >
              <${Trash2} size=${16} />
            </button>
          </div>
        `}
        <${ChevronRight} className="text-slate-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
      </div>
    </div>
  `;
};
