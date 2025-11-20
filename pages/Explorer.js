
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { html } from '../utils/html.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LayoutGrid, List as ListIcon, Loader2, Save, X, KeyRound } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { NodeType, ALLOWED_CHILDREN, NODE_LABELS } from '../types.js';
import { Breadcrumbs } from '../components/Breadcrumbs.js';
import { NodeItem } from '../components/NodeItem.js';
import { EditorModal } from '../components/EditorModal.js';
import { ChangePasswordModal } from '../components/ChangePasswordModal.js';

export const Explorer = ({ mode }) => {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  
  const [allNodes, setAllNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingNode, setEditingNode] = useState(undefined);
  const [targetType, setTargetType] = useState(NodeType.SUBJECT);

  // Content Editing state
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

  // Initialize TinyMCE
  useEffect(() => {
    if (isEditingContent && window.tinymce) {
      window.tinymce.init({
        selector: '#lesson-editor',
        height: 'calc(100vh - 250px)', // Responsive height
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
        content_style: 'body { font-family:"Times New Roman",serif; font-size:18px; line-height: 1.6; color: #334155; }',
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

  const currentNode = useMemo(() => 
    allNodes.find(n => n.id === nodeId), 
  [allNodes, nodeId]);

  const children = useMemo(() => 
    allNodes.filter(n => n.parentId === (nodeId || null)), 
  [allNodes, nodeId]);

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

  const handleEditTitle = (node) => {
    setModalMode('UPDATE');
    setTargetType(node.type);
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const toggleContentEditor = () => {
    setIsEditingContent(true);
  };

  const handleSaveContent = async () => {
    if (editorRef.current) {
      setSaving(true);
      const newContent = editorRef.current.getContent();
      try {
        await apiService.saveNode({
          ...currentNode,
          content: newContent
        });
        setIsEditingContent(false);
        fetchData();
      } catch (e) {
        alert("Lỗi khi lưu nội dung!");
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDelete = async (node) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${node.title}"?`)) {
      await apiService.deleteNode(node.id);
      fetchData();
    }
  };

  const handleSaveModal = async (data) => {
    await apiService.saveNode(data);
    fetchData();
  };
  
  const handleChangePassword = async (newPass) => {
    return await apiService.changePassword(newPass);
  };

  const currentType = currentNode ? currentNode.type : NodeType.ROOT;
  const allowedChildTypes = ALLOWED_CHILDREN[currentType] || [];

  if (loading) {
    return html`
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <div className="flex flex-col items-center gap-3">
           <${Loader2} className="w-10 h-10 animate-spin text-blue-500" />
           <span className="font-sans text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    `;
  }

  // --- VIEW: LESSON DETAIL ---
  if (currentNode?.type === NodeType.LESSON) {
    return html`
      <div className="max-w-5xl mx-auto pb-20">
        <${Breadcrumbs} items=${breadcrumbs} onNavigate=${handleNavigate} />
        
        <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[700px] flex flex-col">
          <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-20 backdrop-blur-sm bg-white/90">
            <div>
              <span className="text-xs font-sans font-bold text-blue-500 uppercase tracking-wider block mb-1">
                ${NODE_LABELS[NodeType.LESSON]}
              </span>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-800">
                ${currentNode.title}
              </h1>
            </div>
            
            ${mode === 'edit' && !isEditingContent && html`
               <div className="flex gap-3">
                <button 
                  onClick=${() => handleEditTitle(currentNode)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-full font-sans text-sm font-medium transition-colors"
                >
                   Sửa tên
                </button>
                <button 
                  onClick=${toggleContentEditor}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2 font-sans shadow-md hover:shadow-lg"
                >
                  <${LayoutGrid} size=${18} /> Soạn thảo
                </button>
              </div>
            `}

            ${mode === 'edit' && isEditingContent && html`
              <div className="flex gap-3">
                <button 
                  onClick=${() => setIsEditingContent(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-full text-sm font-medium transition-colors flex items-center gap-2 font-sans"
                  disabled=${saving}
                >
                  <${X} size=${18} /> Hủy
                </button>
                <button 
                  onClick=${handleSaveContent}
                  disabled=${saving}
                  className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-2 font-sans shadow-md hover:shadow-lg disabled:opacity-70"
                >
                  ${saving ? html`<${Loader2} size=${18} className="animate-spin"/>` : html`<${Save} size=${18} />`}
                  ${saving ? 'Đang lưu...' : 'Lưu bài'}
                </button>
              </div>
            `}
          </div>
          
          <div className="flex-1 bg-white relative">
            ${isEditingContent ? html`
              <div className="p-0 h-full">
                <textarea id="lesson-editor" defaultValue=${currentNode.content}></textarea>
              </div>
            ` : html`
              <div 
                className="p-8 md:p-12 prose prose-lg max-w-none font-serif text-slate-800 leading-loose"
                dangerouslySetInnerHTML=${{ __html: currentNode.content || '<div class="flex flex-col items-center justify-center py-20 text-slate-300"><p class="italic">Chưa có nội dung.</p></div>' }}
              ></div>
            `}
          </div>
        </div>
        
        <div className="mt-8">
           <button 
             onClick=${() => handleNavigate(currentNode.parentId)}
             className="text-slate-500 hover:text-blue-600 flex items-center gap-2 font-sans text-sm transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-100 inline-flex"
           >
             <${ArrowLeft} size=${18} /> Quay lại danh sách
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

  // --- VIEW: LIST (EXPLORER) ---
  return html`
    <div className="max-w-6xl mx-auto pb-20">
      <${Breadcrumbs} items=${breadcrumbs} onNavigate=${handleNavigate} />

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-2 tracking-tight">
            ${currentNode ? currentNode.title : 'Danh sách môn học'}
          </h1>
          <p className="text-slate-500 font-sans">
            ${currentNode ? NODE_LABELS[currentNode.type] : 'Chọn một môn học để bắt đầu'}
          </p>
        </div>
        
        ${mode === 'edit' && !currentNode && html`
          <button 
            onClick=${() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-lg transition-all text-sm font-medium shadow-sm"
          >
            <${KeyRound} size=${16} /> Đổi mật khẩu
          </button>
        `}
      </header>

      ${mode === 'edit' && allowedChildTypes.length > 0 && html`
        <div className="mb-8 flex gap-3 font-sans">
          ${allowedChildTypes.map(type => html`
            <button
              key=${type}
              onClick=${() => handleCreate(type)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm font-medium"
            >
              <${Plus} size=${18} />
              Thêm ${NODE_LABELS[type]}
            </button>
          `)}
        </div>
      `}

      ${children.length === 0 ? html`
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-slate-300 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <${ListIcon} className="text-slate-300" size=${40} />
          </div>
          <h3 className="text-lg font-medium text-slate-700">Trống trơn!</h3>
          <p className="text-slate-500 font-sans mt-2">Chưa có mục nào được tạo trong thư mục này.</p>
          ${mode === 'edit' && html`<p className="text-sm text-blue-500 mt-4 font-sans cursor-pointer hover:underline" onClick=${() => allowedChildTypes[0] && handleCreate(allowedChildTypes[0])}>Tạo mục mới ngay</p>`}
        </div>
      ` : html`
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      
      <${ChangePasswordModal}
        isOpen=${isPasswordModalOpen}
        onClose=${() => setIsPasswordModalOpen(false)}
        onSave=${handleChangePassword}
      />
    </div>
  `;
};
