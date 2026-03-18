
import React, { useEffect, useRef } from 'react';
import { html } from '../utils/html.js';
import { ChevronRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Breadcrumbs = ({ items, onNavigate, isLiquid }) => {
  const navRef = useRef(null);
  const isHoveringRef = useRef(false);
  const hasScrolledRef = useRef(false); // Đánh dấu đã cuộn cho ID hiện tại chưa
  const lastItemsIdRef = useRef('');

  // Tạo ID đại diện cho danh sách items hiện tại để phát hiện thay đổi
  const currentItemsId = items.map(i => i.id).join('-');

  useEffect(() => {
    // Nếu danh sách đường dẫn thay đổi (chuyển trang) -> Reset trạng thái cuộn
    if (lastItemsIdRef.current !== currentItemsId) {
        hasScrolledRef.current = false;
        lastItemsIdRef.current = currentItemsId;
    }

    const attemptScroll = () => {
        // Nếu đã cuộn rồi thì thôi (chặn cuộn lại khi component re-render)
        if (hasScrolledRef.current) return;

        // Nếu người dùng đang để chuột vào -> Khoan hãy cuộn
        if (isHoveringRef.current) return;

        if (navRef.current) {
            navRef.current.scrollTo({
                left: navRef.current.scrollWidth,
                behavior: 'smooth'
            });
            hasScrolledRef.current = true; // Đánh dấu đã hoàn tất cuộn
        }
    };

    // Đợi 100ms để animation bắt đầu rồi mới cuộn
    const timer = setTimeout(attemptScroll, 100);

    return () => clearTimeout(timer);
  }, [currentItemsId]);

  const handleMouseEnter = () => {
    isHoveringRef.current = true;
  };

  const handleMouseLeave = () => {
    isHoveringRef.current = false;
    // Nếu lúc nãy chưa cuộn được do chuột đang đè lên, thì giờ cuộn luôn
    if (!hasScrolledRef.current && navRef.current) {
         navRef.current.scrollTo({
            left: navRef.current.scrollWidth,
            behavior: 'smooth'
        });
        hasScrolledRef.current = true;
    }
  };

  // Xử lý lăn chuột trên Desktop: Cuộn dọc -> Cuộn ngang
  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    const handleWheel = (e) => {
        // Chỉ can thiệp nếu nội dung bị tràn (có thanh cuộn)
        if (container.scrollWidth > container.clientWidth) {
            e.preventDefault();
            container.scrollLeft += e.deltaY;
        }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return html`
    <style key="breadcrumbs-style">
      .breadcrumbs-scroll::-webkit-scrollbar {
        display: none;
      }
      .breadcrumbs-scroll {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
      }
    </style>
    
    <nav 
      key="breadcrumbs-nav"
      ref=${navRef}
      onMouseEnter=${handleMouseEnter}
      onMouseLeave=${handleMouseLeave}
      className=${`breadcrumbs-scroll flex items-center space-x-1 text-sm text-slate-600 mb-8 overflow-x-auto whitespace-nowrap p-1.5 rounded-full max-w-full touch-pan-x border ${isLiquid ? 'bg-white/40 backdrop-blur-md border-white/50 shadow-glass' : 'bg-white border-slate-200 shadow-sm'}`}
    >
      <button 
        key="home-button"
        onClick=${() => onNavigate(null)}
        className=${`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-slate-600 hover:text-indigo-600 shadow-sm transition-all border ${isLiquid ? 'bg-white/60 border-transparent hover:border-indigo-100 hover:bg-indigo-50' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
        title="Trang chủ"
      >
        <${Home} className="w-4 h-4" />
      </button>
      
      <${AnimatePresence} mode="popLayout">
        ${items.map((item, index) => html`
          <${motion.div} 
            key=${`bc-group-${item.id || index}`}
            layout
            initial=${{ opacity: 0, x: 10 }}
            animate=${{ opacity: 1, x: 0 }}
            exit=${{ opacity: 0, x: -10 }}
            transition=${{ duration: 0.2 }}
            className="flex items-center"
          >
            <${ChevronRight} key=${`sep-${item.id || index}`} className="w-3 h-3 text-slate-400 flex-shrink-0 mx-1" />
            <button
              key=${`btn-${item.id || index}`}
              onClick=${() => onNavigate(item.id)}
              className=${`flex-shrink-0 hover:text-indigo-700 font-bold transition-colors px-3 py-1.5 rounded-full border border-transparent text-slate-600 ${isLiquid ? 'hover:bg-white/60 hover:shadow-sm hover:border-white/50' : 'hover:bg-slate-50 hover:border-slate-100'}`}
            >
              ${item.title}
            </button>
          </${motion.div}>
        `)}
      </${AnimatePresence}>
    </nav>
  `;
};
