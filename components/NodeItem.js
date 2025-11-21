
import React from 'react';
import { html } from '../utils/html.js';
import { Folder, FileText, ChevronRight, Edit2, Trash2, FolderInput, GripVertical } from 'lucide-react';
import { NodeType, NODE_LABELS } from '../types.js';

export const NodeItem = ({ 
  node, 
  isEditMode, 
  isSorting, 
  onClick, 
  onEdit, 
  onDelete, 
  onStartMove
}) => {
  const isLesson = node.type === NodeType.LESSON;

  const handleItemClick = () => {
    if (!isSorting) {
      onClick(node);
    }
  };

  return html`
    <div 
      data-id=${node.id}
      className=${`group relative bg-white/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 p-5 flex items-center justify-between overflow-visible ${!isSorting ? 'border-white/50 shadow-soft cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1' : 'border-indigo-200 shadow-none'}`}
      onClick=${handleItemClick}
    >
      <!-- Decoration for hover (only when not sorting) -->
      ${!isSorting && html`
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
      `}

      <div className="relative flex items-center gap-5 flex-1 overflow-hidden z-10">
        <!-- Drag Handle (Only in Sort Mode) -->
        ${isSorting && html`
          <div className="drag-handle text-indigo-500 cursor-grab active:cursor-grabbing -ml-1 flex-shrink-0 p-2 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
            <${GripVertical} size=${24} />
          </div>
        `}
      
        <div className=${`p-3.5 rounded-2xl flex-shrink-0 transition-all duration-300 shadow-sm ${!isSorting && 'group-hover:scale-110'} ${isLesson ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 ring-1 ring-emerald-100' : 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-100'}`}>
          ${isLesson ? html`<${FileText} size=${24} strokeWidth=${1.5} />` : html`<${Folder} size=${24} strokeWidth=${1.5} />`}
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5 block group-hover:text-indigo-400 transition-colors">
            ${NODE_LABELS[node.type]}
          </span>
          <h3 className="text-lg font-serif font-semibold text-slate-800 group-hover:text-indigo-700 truncate transition-colors leading-snug select-none">
            ${node.title}
          </h3>
        </div>
      </div>

      <div className="relative flex items-center gap-3 pl-4 border-l border-slate-100 ml-4 z-10">
        <!-- Actions (Only when NOT sorting) -->
        ${isEditMode && !isSorting && html`
          <div className="flex items-center gap-1 transition-opacity duration-200" onClick=${(e) => e.stopPropagation()}>
            <button 
              onClick=${() => onStartMove && onStartMove(node)}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
              title="Di chuyển sang thư mục khác"
            >
              <${FolderInput} size=${16} />
            </button>

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
        
        <!-- Navigate Icon (Only when NOT sorting) -->
        ${!isSorting && html`
          <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-white flex items-center justify-center transition-colors">
            <${ChevronRight} className="text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-0.5" />
          </div>
        `}
      </div>
    </div>
  `;
};