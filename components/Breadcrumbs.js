
import React, { useEffect, useRef } from 'react';
import { html } from '../utils/html.js';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items, onNavigate }) => {
  const navRef = useRef(null);

  // 1. Tự động cuộn sang phải cùng khi đường dẫn thay đổi
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navRef.current) {
        navRef.current.scrollTo({
            left: navRef.current.scrollWidth,
            behavior: 'smooth'
        });
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [items]);

  // 2. Xử lý lăn chuột trên Máy tính: Biến cuộn dọc thành cuộn ngang
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    const handleWheel = (e) => {
        // Kiểm tra xem nội dung có bị tràn không (có cần cuộn không)
        if (container.scrollWidth > container.clientWidth) {
            // Ngăn trang web cuộn dọc
            e.preventDefault();
            // Cộng dồn độ lăn vào vị trí ngang (lăn xuống -> sang phải)
            container.scrollLeft += e.deltaY;
        }
    };

    // Thêm event listener với passive: false để có thể dùng preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
        container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return html`
    <!-- CSS để ẩn thanh cuộn nhưng vẫn cho phép cuộn -->
    <style>
      .breadcrumbs-scroll::-webkit-scrollbar {
        display: none;
      }
      .breadcrumbs-scroll {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
    </style>
    
    <nav 
      ref=${navRef}
      className="breadcrumbs-scroll flex items-center space-x-1 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap p-1.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-full shadow-sm max-w-full touch-pan-x"
    >
      <button 
        onClick=${() => onNavigate(null)}
        className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all"
        title="Trang chủ"
      >
        <${Home} className="w-4 h-4" />
      </button>
      
      ${items.map((item) => html`
        <${React.Fragment} key=${item.id}>
          <${ChevronRight} className="w-3 h-3 text-slate-300 flex-shrink-0 mx-1" />
          <button
            onClick=${() => onNavigate(item.id)}
            className="flex-shrink-0 hover:text-indigo-600 font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-600"
          >
            ${item.title}
          </button>
        </${React.Fragment}>
      `)}
    </nav>
  `;
};
