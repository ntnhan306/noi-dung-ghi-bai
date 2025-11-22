
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
  
  const isLesson = node.type === NodeType.LESSON;

  // Style object for robust text selection blocking across all browsers
  const selectNoneStyle = {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
    WebkitTouchCallout: 'none'
  };

  // Kiểm tra tiêu đề có bị tràn không để kích hoạt chạy chữ
  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (titleRef.current && containerRef.current) {
        // So sánh độ rộng nội dung (scrollWidth) với độ rộng hiển thị (clientWidth)
        const isOver = titleRef.current.scrollWidth > containerRef.current.clientWidth;
        setIsOverflowing(isOver);
      }
    };

    // Kiểm tra ngay lập tức
    checkOverflow();

    // Kiểm tra lại sau khi transition của nút thao tác hoàn tất (300ms)
    const timeout = setTimeout(checkOverflow, 350);

    window.addEventListener('resize', checkOverflow);
    return () => {
        window.removeEventListener('resize', checkOverflow);
        clearTimeout(timeout);
    };
  }, [node.title, isMobileActive, isEditMode, isSorting]); 

  const handleItemClick = (e) => {
    if (isSorting) return;

    // Phát hiện thiết bị cảm ứng (thô)
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    if (isTouch) {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Bấm 2 lần liên tục -> Truy cập (Đi tiếp)
            // Kể cả khi nút thao tác có hiện hay không vẫn đi tiếp
            onClick(node);
            lastTapRef.current = 0; // Reset
        } else {
            // Bấm 1 lần
            // Nếu đang ẩn nút -> Hiện nút, chặn đi tiếp
            // Nếu đang hiện nút -> Vẫn chặn đi tiếp (chờ double tap để đi)
            if (!isMobileActive) {
                setIsMobileActive(true);
            }
            lastTapRef.current = now;
        }
    } else {
        // Desktop: Click là vào luôn (Hover đã xử lý việc hiện nút)
        onClick(node);
    }
  };

  return html`
    <div 
      data-id=${node.id}
      className=${`group relative bg-white/80 backdrop-blur-sm rounded-2xl border transition-all duration-300 p-5 flex items-center justify-between overflow-hidden ${!isSorting ? 'border-white/50 shadow-soft cursor-pointer hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1' : 'border-indigo-200 shadow-none'}`}
      onClick=${handleItemClick}
      onMouseLeave=${() => setIsMobileActive(false)}
      style=${selectNoneStyle}
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
        
        <!-- Content Container -->
        <div className="min-w-0 flex-1 overflow-hidden" ref=${containerRef}>
          <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5 block group-hover:text-indigo-400 transition-colors" style=${selectNoneStyle}>
            ${NODE_LABELS[node.type]}
          </span>
          
          <!-- Title Container -->
          <div className="relative h-8 flex items-center overflow-hidden">
             <!-- Logic: Luôn render H3 để đo độ rộng. Nếu isOverflowing = true thì wrap trong thẻ marquee -->
             ${isOverflowing ? html`
                <div className="whitespace-nowrap animate-marquee inline-block">
                    <h3 
                        ref=${titleRef}
                        className="text-lg font-serif font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors leading-snug pr-8"
                        style=${selectNoneStyle}
                    >
                        ${node.title}
                    </h3>
                </div>
             ` : html`
                <h3 
                    ref=${titleRef}
                    className="text-lg font-serif font-semibold text-slate-800 group-hover:text-indigo-700 truncate transition-colors leading-snug"
                    style=${selectNoneStyle}
                >
                    ${node.title}
                </h3>
             `}
          </div>
        </div>
      </div>

      <div className="relative flex items-center pl-2 z-10 bg-transparent">
        <!-- Actions (Only when NOT sorting) -->
        <!-- Hiệu ứng mở rộng: max-w-0 -> max-w-xxx -->
        ${isEditMode && !isSorting && html`
          <div 
            className=${`flex items-center gap-1 overflow-hidden transition-all duration-300 ease-in-out ${isMobileActive ? 'max-w-[140px] opacity-100 ml-2' : 'max-w-0 opacity-0 group-hover:max-w-[140px] group-hover:opacity-100 group-hover:ml-2'}`}
            onClick=${(e) => e.stopPropagation()}
          >
            <button 
              onClick=${() => onStartMove && onStartMove(node)}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors flex-shrink-0"
              title="Di chuyển sang thư mục khác"
            >
              <${FolderInput} size=${16} />
            </button>

            <button 
              onClick=${() => onEdit && onEdit(node)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
              title="Sửa tên"
            >
              <${Edit2} size=${16} />
            </button>
            <button 
              onClick=${() => onDelete && onDelete(node)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors flex-shrink-0"
              title="Xóa"
            >
              <${Trash2} size=${16} />
            </button>
          </div>
        `}
        
        <!-- Navigate Icon (Only when NOT sorting) -->
        ${!isSorting && html`
          <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-white flex items-center justify-center transition-colors ml-2 flex-shrink-0">
            <${ChevronRight} className="text-slate-300 group-hover:text-indigo-500 transition-colors transform group-hover:translate-x-0.5" />
          </div>
        `}
      </div>
    </div>
  `;
};
