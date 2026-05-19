
import React, { useState, useRef, useLayoutEffect } from 'react';
import { html } from '../utils/html.js';
import { Folder, FileText, ChevronRight, Edit2, Trash2, FolderInput, GripVertical } from 'lucide-react';
import { NodeType, NODE_LABELS } from '../types.js';

export const NodeItem = ({ 
  node, 
  isEditMode, 
  isSorting, 
  isAppMode: isAppModeProp,
  onClick, 
  onEdit, 
  onDelete, 
  onStartMove,
  uiStyle
}) => {
  const [isMobileActive, setIsMobileActive] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const lastTapRef = useRef(0);
  const titleRef = useRef(null);
  const containerRef = useRef(null);
  
  const isAppMode = isAppModeProp ?? window.location.pathname.includes('/special-application/');
  const isLesson = node.type === NodeType.LESSON;
  const isLiquid = uiStyle === 'liquid';

  const selectNoneStyle = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitTouchCallout: 'none'
  };

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

  // Styles logic
  // Liquid: bg-white/40, border-white/60, shadow-glass, backdrop-blur-md
  // Normal: bg-white, border-slate-200, shadow-sm, no opacity/blur
  
  const baseClasses = isAppMode 
    ? `rounded-xl py-5 px-5 transition-all active:bg-white/40 border ${
        isLiquid 
          ? 'bg-white/40 backdrop-blur-sm border-white/20' 
          : 'bg-white border-slate-200'
      }`
    : `group relative rounded-3xl p-6 transition-all duration-300 ease-out border overflow-hidden
       ${isLiquid 
            ? 'backdrop-blur-md bg-white/40 border-white/60 shadow-glass hover:shadow-glass-hover hover:bg-white/60 hover:border-white/80' 
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50'
       }
       ${!isSorting ? 'cursor-pointer hover:-translate-y-1' : ''}`;

  const sortingClasses = 'bg-white/20 border-white/30 shadow-none';
  
  const containerClasses = isSorting ? sortingClasses : baseClasses;

  // Colored shadows for web mode items
  const shadowColorClass = isLesson 
    ? 'group-hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.15)]' 
    : 'group-hover:shadow-[0_20px_40px_-10px_rgba(99,102,241,0.15)]';

  return html`
    <div 
      data-id=${node.id}
      className=${`flex items-center justify-between ${containerClasses} ${!isAppMode && !isSorting ? shadowColorClass : ''}`}
      onClick=${handleItemClick}
      onMouseLeave=${() => setIsMobileActive(false)}
      style=${selectNoneStyle}
    >
      <!-- Shine/Reflection Effect (Web Mode - Liquid Only) -->
      ${!isSorting && !isAppMode && isLiquid && html`
        <div key="shine-1" className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        <div key="shine-2" className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shimmer pointer-events-none" />
      `}

      <div className="relative flex items-center gap-5 flex-1 overflow-hidden z-10">
        <!-- Drag Handle -->
        ${isSorting && html`
          <div key="drag-handle" className="drag-handle text-indigo-500 cursor-grab active:cursor-grabbing -ml-1 flex-shrink-0 p-2 bg-white/40 rounded-xl hover:bg-white/60 transition-colors">
            <${GripVertical} size=${24} />
          </div>
        `}
      
        <!-- Icon Bubble -->
        <div key="icon-bubble" className=${`flex-shrink-0 transition-all duration-300 relative ${isAppMode ? 'text-indigo-600' : `p-4 rounded-2xl shadow-inner ${!isSorting && 'group-hover:scale-105 group-hover:rotate-3'} ${isLesson ? 'bg-emerald-100/50 text-emerald-600 border border-emerald-200/50' : 'bg-indigo-100/50 text-indigo-600 border border-indigo-200/50'}`}`}>
          ${isLesson ? html`<${FileText} key="icon-lesson" size=${isAppMode ? 24 : 26} strokeWidth=${1.5} />` : html`<${Folder} key="icon-folder" size=${isAppMode ? 24 : 26} strokeWidth=${1.5} />`}
        </div>
        
        <div className="min-w-0 flex-1" ref=${containerRef}>
          <!-- Label -->
          ${!isAppMode && html`
            <span key="node-label" className="text-[11px] font-sans font-extrabold text-slate-400/80 uppercase tracking-widest mb-1 block group-hover:text-indigo-500 transition-colors" style=${selectNoneStyle}>
                ${NODE_LABELS[node.type]}
            </span>
          `}
          
          <!-- Title -->
          ${isAppMode ? html`
             <h3 key="app-title" className="font-sans font-semibold text-slate-800 text-lg leading-snug whitespace-normal" style=${selectNoneStyle}>
                ${node.title}
             </h3>
          ` : html`
             <div key="web-title-container" className="relative h-8 flex items-center overflow-hidden">
                ${isOverflowing ? html`
                    <div key="marquee" className="whitespace-nowrap animate-marquee inline-block">
                        <h3 
                            ref=${titleRef}
                            className="font-sans font-bold text-slate-800 group-hover:text-indigo-900 transition-colors leading-snug text-xl"
                            style=${selectNoneStyle}
                        >
                            ${node.title}
                        </h3>
                    </div>
                ` : html`
                    <h3 
                        key="static-title"
                        ref=${titleRef}
                        className="font-sans font-bold text-slate-800 group-hover:text-indigo-900 truncate transition-colors leading-snug text-xl"
                        style=${selectNoneStyle}
                    >
                        ${node.title}
                    </h3>
                `}
             </div>
          `}
        </div>
      </div>

      <!-- Actions (Web Mode) -->
      ${!isAppMode && html`
        <div className="relative flex items-center pl-4 z-10 bg-transparent">
            ${isEditMode && !isSorting && html`
            <div 
                key="edit-actions"
                className=${`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${isMobileActive ? 'max-w-[200px] opacity-100 ml-4' : 'max-w-0 opacity-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-4'}`}
                onClick=${(e) => e.stopPropagation()}
            >
                <button key="btn-move" onClick=${() => onStartMove && onStartMove(node)} className="p-2.5 text-amber-500 hover:text-amber-700 bg-amber-50/50 hover:bg-amber-100/80 rounded-xl transition-colors shadow-sm" title="Di chuyển">
                    <${FolderInput} size=${18} />
                </button>
                <button key="btn-edit" onClick=${() => onEdit && onEdit(node)} className="p-2.5 text-blue-500 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/80 rounded-xl transition-colors shadow-sm" title="Sửa tên">
                    <${Edit2} size=${18} />
                </button>
                <button key="btn-delete" onClick=${() => onDelete && onDelete(node)} className="p-2.5 text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-100/80 rounded-xl transition-colors shadow-sm" title="Xóa">
                    <${Trash2} size=${18} />
                </button>
            </div>
            `}
            
            ${!isSorting && html`
            <div key="chevron-container" className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/40 flex items-center justify-center transition-all duration-300 ml-2 shadow-none group-hover:shadow-sm">
                <${ChevronRight} className="text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-0.5" strokeWidth=${2.5} size=${20} />
            </div>
            `}
        </div>
      `}
    </div>
  `;
};
