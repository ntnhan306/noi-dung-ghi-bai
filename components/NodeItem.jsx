import React from 'react';
import { Folder, FileText, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { NodeType, NODE_LABELS } from '../types';

export const NodeItem = ({ node, isEditMode, onClick, onEdit, onDelete }) => {
  const isLesson = node.type === NodeType.LESSON;

  return (
    <div 
      className="group relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer p-4 flex items-center justify-between"
      onClick={() => onClick(node)}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className={`p-2 rounded-full ${isLesson ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
          {isLesson ? <FileText size={20} /> : <Folder size={20} />}
        </div>
        <div>
          <span className="text-xs font-sans font-bold text-gray-400 uppercase tracking-wider">
            {NODE_LABELS[node.type]}
          </span>
          <h3 className="text-lg font-serif font-medium text-gray-800 group-hover:text-blue-700">
            {node.title}
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditMode && (
          <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => onEdit && onEdit(node)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Sửa tên"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => onDelete && onDelete(node)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
        <ChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  );
};