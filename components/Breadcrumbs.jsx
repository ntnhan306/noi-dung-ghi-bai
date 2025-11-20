import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6 overflow-x-auto whitespace-nowrap py-2 font-sans">
      <button 
        onClick={() => onNavigate(null)}
        className="hover:text-blue-600 flex items-center transition-colors"
      >
        <Home className="w-4 h-4" />
      </button>
      
      {items.map((item) => (
        <React.Fragment key={item.id}>
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
          <button
            onClick={() => onNavigate(item.id)}
            className="hover:text-blue-600 hover:underline font-medium transition-colors"
          >
            {item.title}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};