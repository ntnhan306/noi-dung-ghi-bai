import React, { useEffect, useState, useMemo, useRef } from 'react';
import { html } from '../utils/html.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LayoutGrid, List as ListIcon, Loader2, Save, X } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { NodeType, ALLOWED_CHILDREN, NODE_LABELS } from '../types.js';
import { Breadcrumbs } from '../components/Breadcrumbs.js';
import { NodeItem } from '../components/NodeItem.js';
import { EditorModal } from '../components/EditorModal.js';

export const Explorer = ({ mode }) => {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  
  const [allNodes, setAllNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state for Title editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingNode, setEditingNode] = useState(undefined);
  const [targetType, setTargetType] = useState(NodeType.SUBJECT);

  // Content Editing state (Rich Text)
  const [isEditingContent, setIsEditingContent] = useState(false);
  const editorRef = useRef(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllNodes();
      setAllNodes(data);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Initialize TinyMCE when entering content edit mode
  useEffect(() => {
    if (isEditingContent && window.tinymce) {
      window.tinymce.init({
        selector: '#lesson-editor',
        height: 600,
        menubar: 'file edit view insert format tools table help',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
        ],
        toolbar: 'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'image table media | removeformat | help',
        content_style: 'body { font-family:"Times New Roman",serif; font-size:16px }',
        setup: (editor) => {
          editorRef.current = editor;
        }
      });
    }

    return () => {
      if (window.tinymce) {
        window.tinymce.remove('#lesson-editor');
      }
    };
  }, [isEditingContent]);

  // Derive current view state
  const currentNode = useMemo(() => 
    allNodes.find(n => n.id === nodeId), 
  [allNodes, nodeId]);

  const children = useMemo(() => 
    allNodes.filter(n => n.parentId === (nodeId || null)), 
  [allNodes, nodeId]);

  // Build Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const path = [];
    let curr = currentNode;
    while (curr) {
      path.unshift({ id: curr.id, title: curr.title });
      // eslint-disable-next-line no-loop-func
      curr = allNodes.find(n => n.id === curr?.parentId);
    }
    return path;
  }, [currentNode, allNodes]);

  // Handlers
  const handleNavigate = (id) => {
    const prefix = mode === 'edit' ? '/edit' : '/view';
    navigate(id ? `${prefix}/${id}` : prefix);
  };

  const handleCreate = (type) => {
    setModalMode('CREATE');
    setTargetType(type);
    setEditingNode({ parentId: nodeId || null });
    setIsModalOpen(true);
  };

  // Edit Title Handler
  const handleEditTitle = (node) => {
    setModalMode('UPDATE');
    setTargetType(node.type);
    setEditingNode(node);
    setIsModalOpen(true);
  };

  // Toggle Content Editor
  const toggleContentEditor = () => {
    setIsEditingContent(true);
  };

  // Save Content from TinyMCE
  const handleSaveContent = async () => {
    if (editorRef.current) {
      const newContent = editorRef.current.getContent();
      await apiService.saveNode({
        ...currentNode,
        content: newContent
      });
      setIsEditingContent(false);
      fetchData();
    }
  };

  const handleDelete = async (node) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${node.title}"?`)) {
      await apiService.deleteNode(node.id);
      fetchData();
    }
  };

  // Save from Modal (Title only)
  const handleSaveModal = async (data) => {
    await apiService.saveNode(data);
    fetchData();
  };

  // Determine allowed actions
  const currentType = currentNode ? currentNode.type : NodeType.ROOT;
  const allowedChildTypes = ALLOWED_CHILDREN[currentType] || [];

  if (loading) {
    return html`
      <div className="flex items-center justify-center h-64 text-gray-400">
        <${Loader2} className="w-8 h-8 animate-spin" />
      </div>
    `;
  }

  // Render Content for LESSON type
  if (currentNode?.type === NodeType.LESSON) {
    return html`
      <div className="max-w-5xl mx-auto">
        <${Breadcrumbs} items=${breadcrumbs} onNavigate=${handleNavigate} />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-6 border-b border-gray-100 bg-white flex justify-between items-center sticky top-16 z-20">
            <div>
              <span className="text-sm font-sans font-bold text-gray-400 uppercase tracking-wider block mb-1">
                ${NODE_LABELS[NodeType.LESSON]}
              </span>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                ${currentNode.title}
              </h1>
            </div>
            
            ${mode === 'edit' && !isEditingContent && html`
               <div className="flex gap-2">
                <button 
                  onClick=${() => handleEditTitle(currentNode)}
                  className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-sans text-sm font-medium transition-colors"
                >
                   Sửa tên
                </button>
                <button 
                  onClick=${toggleContentEditor}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 font-sans shadow-sm"
                >
                  <${LayoutGrid} size=${16} /> Soạn thảo
                </button>
              </div>
            `}

            ${mode === 'edit' && isEditingContent && html`
              <div className="flex gap-2">
                <button 
                  onClick=${() => setIsEditingContent(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 font-sans"
                >
                  <${X} size=${16} /> Hủy
                </button>
                <button 
                  onClick=${handleSaveContent}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 font-sans shadow-sm"
                >
                  <${Save} size=${16} /> Lưu nội dung
                </button>
              </div>
            `}
          </div>
          
          <div className="flex-1 bg-white relative">
            ${isEditingContent ? html`
              <div className="p-4 h-full">
                <textarea id="lesson-editor" defaultValue=${currentNode.content}></textarea>
              </div>
            ` : html`
              <div 
                className="p-8 prose prose-lg max-w-none font-serif text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML=${{ __html: currentNode.content || '<div class="text-gray-400 italic text-center mt-10">Chưa có nội dung. Nhấn "Soạn thảo" để bắt đầu ghi bài.</div>' }}
              ></div>
            `}
          </div>
        </div>
        
        <div className="mt-6">
           <button 
             onClick=${() => handleNavigate(currentNode.parentId)}
             className="text-gray-500 hover:text-gray-900 flex items-center gap-2 font-sans text-sm transition-colors"
           >
             <${ArrowLeft} size=${16} /> Quay lại
           </button>
        </div>

        <${EditorModal} 
          isOpen=${isModalOpen}
          mode=${modalMode}
          targetType=${currentNode.type}
          initialData=${editingNode}
          onClose=${() => setIsModalOpen(false)}
          onSave=${handleSaveModal}
        />
      </div>
    `;
  }

  // Render List for Containers (Subject, Chapter, etc.)
  return html`
    <div className="max-w-5xl mx-auto">
      <${Breadcrumbs} items=${breadcrumbs} onNavigate=${handleNavigate} />

      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          ${currentNode ? currentNode.title : 'Danh sách môn học'}
        </h1>
        <p className="text-gray-500 font-sans">
          ${currentNode ? NODE_LABELS[currentNode.type] : 'Chọn một môn để xem chi tiết'}
        </p>
      </header>

      ${mode === 'edit' && allowedChildTypes.length > 0 && html`
        <div className="mb-6 flex gap-2 font-sans">
          ${allowedChildTypes.map(type => html`
            <button
              key=${type}
              onClick=${() => handleCreate(type)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 hover:shadow transition-all text-sm font-medium"
            >
              <${Plus} size=${16} />
              Thêm ${NODE_LABELS[type]}
            </button>
          `)}
        </div>
      `}

      ${children.length === 0 ? html`
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <${ListIcon} className="text-gray-300" size=${32} />
          </div>
          <p className="text-gray-500 font-sans">Chưa có mục nào ở đây.</p>
          ${mode === 'edit' && html`<p className="text-sm text-gray-400 mt-1 font-sans">Hãy thêm mục mới để bắt đầu.</p>`}
        </div>
      ` : html`
        <div className="grid grid-cols-1 gap-3">
          ${children.map(node => html`
            <${NodeItem} 
              key=${node.id}
              node=${node}
              isEditMode=${mode === 'edit'}
              onClick=${() => handleNavigate(node.id)}
              onEdit=${handleEditTitle}
              onDelete=${handleDelete}
            />
          `)}
        </div>
      `}

      <${EditorModal} 
        isOpen=${isModalOpen}
        mode=${modalMode}
        targetType=${targetType}
        initialData=${editingNode}
        onClose=${() => setIsModalOpen(false)}
        onSave=${handleSaveModal}
      />
    </div>
  `;
};