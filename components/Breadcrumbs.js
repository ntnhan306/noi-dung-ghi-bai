
import React from 'react';
import { html } from '../utils/html.js';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items, onNavigate }) => {
  return html`
    <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-8 overflow-x-auto whitespace-nowrap py-2 font-sans scrollbar-hide">
      <button 
        onClick=${() => onNavigate(null)}
        className="hover:text-blue-600 flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50 transition-all"
        title="Trang chủ"
      >
        <${Home} className="w-4 h-4" />
      </button>
      
      ${items.map((item) => html`
        <${React.Fragment} key=${item.id}>
          <${ChevronRight} className="w-4 h-4 text-slate-300 flex-shrink-0" />
          <button
            onClick=${() => onNavigate(item.id)}
            className="hover:text-blue-600 hover:underline decoration-blue-300 underline-offset-4 font-medium transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
          >
            ${item.title}
          </button>
        </${React.Fragment}>
      `)}
    </nav>
  `;
};
