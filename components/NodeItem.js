
import React, { useState, useRef, useLayoutEffect } from 'react';
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
  const [isMobileActive, setIsMobileActive] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const lastTapRef = useRef(0);
  const titleRef = useRef(null);
  const containerRef = useRef(null);
  
  const isAppMode = window.location.pathname.includes('/special-application/');
  const isLesson = node.type === NodeType.LESSON;

  const selectNoneStyle = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitTouchCallout: 'none'
  };

  // Chỉ kiểm tra tràn text khi KHÔNG PHẢI chế độ App (vì App mode dùng wrap text)
  useLayoutEffect(() => {
    if (isAppMode) return;

    const checkOverflow = () => {
      if (titleRef.current && containerRef.current) {
        const isOver = titleRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsOverflowing(isOver);
      }
    };

    checkOverflow();
    const timeout = setTimeout(checkOverflow, 350);
    window.addEventListener('resize', checkOverflow);
    return () => {
        window.removeEventListener('resize', checkOverflow);
        clearTimeout(timeout);
    };
  }, [node.title, isMobileActive, isEditMode, isSorting, isAppMode]); 

  const handleItemClick = (e) => {
    if (isSorting) return;

    if (isAppMode) {
        onClick(node);
        return;
    }

    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    if (isTouch) {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            onClick(node);
            lastTapRef.current = 0; 
        } else {
            if (!isMobileActive) {
                setIsMobileActive(true);
            }
            lastTapRef.current = now;
        }
    } else {
        onClick(node);
    }
  };

  // Dynamic Classes based on Mode (Using Glassmorphism)
  const containerClasses = isAppMode 
    ? 'border-b border-white/30 py-4 px-4 bg-white/40 backdrop-blur-sm active:bg-white/60 transition-colors' 
    : `group relative bg-white/40 backdrop-blur-md rounded-2xl border transition-all duration-300 p-5 ${!isSorting ? 'border-white/50 shadow-glass cursor-pointer hover:bg-white/60 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1' : 'border-indigo-200/50 shadow-none'}`;

  return html`
    <div 
      data-id=${node.id}
      className=${`flex items-center justify-between overflow-hidden ${containerClasses}`}
      onClick=${handleItemClick}
      onMouseLeave=${() => setIsMobileActive(false)}
      style=${selectNoneStyle}
    >
      <!-- Decoration (Web Mode Only) -->
      ${!isSorting && !isAppMode && html`
        <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none"></div>
      `}

      <div className="relative flex items-center gap-4 flex-1 overflow-hidden z-10">
        <!-- Drag Handle (Only in Sort Mode) -->
        ${isSorting && html`
          <div className="drag-handle text-indigo-500 cursor-grab active:cursor-grabbing -ml-1 flex-shrink-0 p-2 bg-indigo-50/50 rounded-lg hover:bg-indigo-100/50 transition-colors">
            <${GripVertical} size=${24} />
          </div>
        `}
      
        <!-- Icon -->
        <div className=${`flex-shrink-0 transition-all duration-300 ${isAppMode ? 'text-indigo-600' : `p-3.5 rounded-2xl shadow-sm ${!isSorting && 'group-hover:scale-110'} ${isLesson ? 'bg-emerald-100/60 text-emerald-600 ring-1 ring-emerald-200/50' : 'bg-indigo-100/60 text-indigo-600 ring-1 ring-indigo-200/50'}`}`}>
          ${isLesson ? html`<${FileText} size=${isAppMode ? 24 : 24} strokeWidth=${1.5} />` : html`<${Folder} size=${isAppMode ? 24 : 24} strokeWidth=${1.5} />`}
        </div>
        
        <!-- Content Container -->
        <div className="min-w-0 flex-1" ref=${containerRef}>
          <!-- Label (Hidden in App Mode) -->
          ${!isAppMode && html`
            <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest mb-1.5 block group-hover:text-indigo-500 transition-colors" style=${selectNoneStyle}>
                ${NODE_LABELS[node.type]}
            </span>
          `}
          
          <!-- Title Container -->
          ${isAppMode ? html`
             <!-- App Mode: Wrap text, Standard font size -->
             <h3 className="font-serif font-medium text-slate-800 text-lg leading-snug whitespace-normal" style=${selectNoneStyle}>
                ${node.title}
             </h3>
          ` : html`
             <!-- Web Mode: Marquee logic -->
             <div className="relative h-8 flex items-center overflow-hidden">
                ${isOverflowing ? html`
                    <div className="whitespace-nowrap animate-marquee inline-block">
                        <h3 
                            ref=${titleRef}
                            className="font-serif font-semibold text-slate-800 group-hover:text-indigo-800 transition-colors leading-snug text-lg"
                            style=${selectNoneStyle}
                        >
                            ${node.title}
                        </h3>
                    </div>
                ` : html`
                    <h3 
                        ref=${titleRef}
                        className="font-serif font-semibold text-slate-800 group-hover:text-indigo-800 truncate transition-colors leading-snug text-lg"
                        style=${selectNoneStyle}
                    >
                        ${node.title}
                    </h3>
                `}
             </div>
          `}
        </div>
      </div>

      <!-- Actions (Web Mode Only) -->
      ${!isAppMode && html`
        <div className="relative flex items-center pl-2 z-10 bg-transparent">
            ${isEditMode && !isSorting && html`
            <div 
                className=${`flex items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out ${isMobileActive ? 'max-w-[140px] opacity-100 ml-2' : 'max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2'}`}
                onClick=${(e) => e.stopPropagation()}
            >
                <button 
                onClick=${() => onStartMove && onStartMove(node)}
                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-100/50 rounded-full transition-colors flex-shrink-0"
                title="Di chuyển sang thư mục khác"
                >
                <${FolderInput} size=${16} />
                </button>

                <button 
                onClick=${() => onEdit && onEdit(node)}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-100/50 rounded-full transition-colors flex-shrink-0"
                title="Sửa tên"
                >
                <${Edit2} size=${16} />
                </button>
                <button 
                onClick=${() => onDelete && onDelete(node)}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100/50 rounded-full transition-colors flex-shrink-0"
                title="Xóa"
                >
                <${Trash2} size=${16} />
                </button>
            </div>
            `}
            
            ${!isSorting && html`
            <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-white/40 flex items-center justify-center transition-colors ml-2 flex-shrink-0">
                <${ChevronRight} className="text-slate-400 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-0.5" />
            </div>
            `}
        </div>
      `}
    </div>
  `;
};
