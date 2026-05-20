import React from 'react';
import { html } from '../utils/html.js';
import { ShieldAlert, WifiOff, FileX, AlertTriangle, Search, Home } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLayoutError } from '../context/LayoutErrorContext.js';

export const StatusPage = ({ type, message, subMessage, icon: CustomIcon }) => {
  const { setLayoutError } = useLayoutError();

  React.useEffect(() => {
    const isTypeB = ['not-found', 'load-failed'].includes(type);
    if (isTypeB) {
      setLayoutError(type);
      return () => {
        setLayoutError(null);
      };
    }
  }, [type, setLayoutError]);

  const configs = {
    'access-denied': {
      icon: ShieldAlert,
      title: 'Quyền truy cập bị từ chối!',
      color: 'text-red-500',
      bgColor: 'bg-red-50/50',
      iconBg: 'bg-red-100/50'
    },
    'no-internet': {
      icon: WifiOff,
      title: 'Vui lòng kiểm tra kết nối Internet!',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50/50',
      iconBg: 'bg-amber-100/50'
    },
    'load-failed': {
      icon: FileX,
      title: 'Không tải được nội dung bài học!',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50/50',
      iconBg: 'bg-indigo-100/50',
      showContact: true
    },
    'source-error': {
      icon: AlertTriangle,
      title: 'Có lỗi về mã nguồn',
      color: 'text-rose-500',
      bgColor: 'bg-rose-50/50',
      iconBg: 'bg-rose-100/50',
      showContact: true
    },
    'not-found': {
      icon: Search,
      title: 'Trang không tồn tại',
      color: 'text-slate-500',
      bgColor: 'bg-slate-50/50',
      iconBg: 'bg-slate-100/50',
      showHome: true
    }
  };

  const config = configs[type] || configs['load-failed'];
  const Icon = CustomIcon || config.icon;

  const isTypeA = ['access-denied', 'no-internet', 'source-error'].includes(type);

  if (isTypeA) {
    return html`
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6 z-50 overflow-y-auto">
        <div className="w-[85vw] max-w-lg md:max-w-xl bg-white p-8 md:p-12 text-center rounded-[2.5rem] border border-slate-200/60 shadow-xl flex flex-col items-center justify-center mx-auto my-auto" style=${{ width: 'fit-content' }}>
          <${motion.div}
            initial=${{ y: 0 }}
            animate=${{ y: [-12, 0, -12] }}
            transition=${{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className=${`w-28 h-28 md:w-32 md:h-32 ${config.iconBg} border border-white/60 ${config.color} rounded-full flex items-center justify-center mb-10 shadow-lg`}
          >
            <${Icon} size=${48} className="md:w-14 md:h-14" strokeWidth=${2.5} />
          </${motion.div}>
          <h1 className=${`text-2xl md:text-3xl font-sans font-black ${config.color} mb-6 tracking-tight drop-shadow-sm`}>${message || config.title}</h1>
          <div className="flex flex-col gap-4">
            <p className="text-slate-600 max-w-sm mx-auto font-medium text-base md:text-lg leading-relaxed">
              ${subMessage || 'Yêu cầu không hợp lệ hoặc đã xảy ra sự cố kỹ thuật. Vui lòng kiểm tra lại thao tác của bạn.'}
            </p>
            ${config.showContact && html`
              <${React.Fragment}>
                <div className="h-px w-24 bg-slate-200 mx-auto my-4 opacity-50"></div>
                <p className="text-slate-500 text-[10px] md:text-xs font-extrabold uppercase tracking-[0.2em] animate-pulse">
                  Vui lòng liên hệ quản trị viên để xử lý!
                </p>
              </${React.Fragment}>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // Type B errors
  return html`
    <div className=${`min-h-[60vh] flex flex-col items-center justify-center p-8 text-center rounded-[2.5rem] border border-white/40 shadow-glass backdrop-blur-sm bg-white/40`}>
      <${motion.div}
        initial=${{ y: 0 }}
        animate=${{ y: [-12, 0, -12] }}
        transition=${{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className=${`w-32 h-32 ${config.iconBg} backdrop-blur-2xl border border-white/60 ${config.color} rounded-full flex items-center justify-center mb-10 shadow-xl ring-4 ring-white/30`}
      >
        <${Icon} size=${56} strokeWidth=${2.5} />
      </${motion.div}>
      <h1 className=${`text-3xl md:text-4xl font-sans font-black ${config.color} mb-6 tracking-tight drop-shadow-sm`}>${message || config.title}</h1>
      <div className="flex flex-col gap-4">
        <p className="text-slate-600 max-w-lg mx-auto font-medium text-lg md:text-xl leading-relaxed">
          ${subMessage || (type === 'not-found' ? 'Rất tiếc, nội dung bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.' : 'Yêu cầu không hợp lệ hoặc đã xảy ra sự cố kỹ thuật. Vui lòng kiểm tra lại thao tác của bạn.')}
        </p>

        ${config.showHome && html`
          <div className="mt-4">
            <${Link} to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all active:scale-95">
              <${Home} size=${18} />
              Quay lại trang chủ
            </${Link}>
          </div>
        `}

        ${config.showContact && html`
          <${React.Fragment}>
            <div className="h-px w-24 bg-slate-200 mx-auto my-4 opacity-50"></div>
            <p className="text-slate-500 text-xs md:text-sm font-extrabold uppercase tracking-[0.2em] animate-pulse">
              Vui lòng liên hệ quản trị viên để xử lý!
            </p>
          </${React.Fragment}>
        `}
      </div>
    </div>
  `;
};
