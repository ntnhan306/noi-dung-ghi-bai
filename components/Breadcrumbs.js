
import React from 'react';
import { html } from '../utils/html.js';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items, onNavigate }) => {
  return html`
    <nav className="inline-flex items-center space-x-1 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap p-1.5 bg-white/60 backdrop-blur-md border border-white/60 rounded-full shadow-sm">
      <button 
        onClick=${() => onNavigate(null)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all"
        title="Trang chủ"
      >
        <${Home} className="w-4 h-4" />
      </button>
      
      ${items.map((item) => html`
        <${React.Fragment} key=${item.id}>
          <${ChevronRight} className="w-3 h-3 text-slate-300 flex-shrink-0 mx-1" />
          <button
            onClick=${() => onNavigate(item.id)}
            className="hover:text-indigo-600 font-medium transition-colors px-3 py-1.5 rounded-full hover:bg-white hover:shadow-sm text-slate-600"
          >
            ${item.title}
          </button>
        </${React.Fragment}>
      `)}
    </nav>
  `;
};
