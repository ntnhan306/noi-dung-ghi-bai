
import React from 'react';
import { html } from '../utils/html.js';
import { Folder, FileText, ChevronRight, Edit2, Trash2, ArrowUp, ArrowDown, FolderInput, GripVertical } from 'lucide-react';
import { NodeType, NODE_LABELS } from '../types.js';

export const NodeItem = ({ 
  node, 
  isEditMode, 
  onClick, 
  onEdit, 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onStartMove,
  isFirst,
  isLast,
  // Drag Props
  onDragStart,
  onDragOver,
  onDrop,
  onDragLeave,
  isDragging,
  dropPosition // 'top' | 'bottom' | null
}) => {
  const isLesson = node.type === NodeType.LESSON;

  // Handle calculating drop position (top/bottom half)
  const handleDragOver = (e) => {
    if (!isEditMode || !onDragOver) return;
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';
    
    onDragOver(e, node, position);
  };

  return html`
    <div 
      draggable=${isEditMode}
      onDragStart=${(e) => isEditMode && onDragStart && onDragStart(e, node)}
      onDragOver=${handleDragOver}
      onDrop=${(e) => isEditMode && onDrop && onDrop(e, node)}
      onDragLeave=${(e) => isEditMode && onDragLeave && onDragLeave(e)}
      className=${`group relative bg-white/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 cursor-pointer p-5 flex items-center justify-between overflow-visible ${isDragging ? 'opacity-40 border-dashed border-indigo-400' : 'border-white/50 shadow-soft hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1'} ${dropPosition ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
      onClick=${() => onClick(node)}
    >
      <!-- Drop Indicators -->
      ${dropPosition === 'top' && html`
        <div className="absolute -top-3 left-0 right-0 h-1.5 bg-indigo-500 rounded-full shadow-glow z-50 pointer-events-none animate-pulse"></div>
      `}
      ${dropPosition === 'bottom' && html`
        <div className="absolute -bottom-3 left-0 right-0 h-1.5 bg-indigo-500 rounded-full shadow-glow z-50 pointer-events-none animate-pulse"></div>
      `}

      <!-- Decoration for hover -->
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>

      <div className="relative flex items-center gap-5 flex-1 overflow-hidden z-10">
        <!-- Drag Handle -->
        ${isEditMode && html`
          <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-indigo-400 -ml-1">
            <${GripVertical} size=${20} />
          </div>
        `}
      
        <div className=${`p-3.5 rounded-2xl flex-shrink-0 transition-all duration-300 shadow-sm group-hover:scale-110 ${isLesson ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 ring-1 ring-emerald-100' : 'bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-100'}`}>
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
        ${isEditMode && html`
          <div className="flex items-center gap-1 transition-opacity duration-200" onClick=${(e) => e.stopPropagation()}>
            <!-- Manual Reorder Buttons (Backup for Drag) -->
            <div className="flex flex-col gap-0.5 mr-2">
              <button 
                onClick=${() => onMoveUp && onMoveUp(node)}
                disabled=${isFirst}
                className=${`p-1 rounded hover:bg-slate-100 ${isFirst ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600'}`}
                title="Di chuyển lên"
              >
                <${ArrowUp} size=${14} />
              </button>
              <button 
                onClick=${() => onMoveDown && onMoveDown(node)}
                disabled=${isLast}
                className=${`p-1 rounded hover:bg-slate-100 ${isLast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600'}`}
                title="Di chuyển xuống"
              >
                <${ArrowDown} size=${14} />
              </button>
            </div>

            <!-- Move to Folder Button -->
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
        <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-white flex items-center justify-center transition-colors">
          <${ChevronRight} className="text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  `;
};
