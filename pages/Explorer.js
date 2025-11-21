
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { html } from '../utils/html.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LayoutGrid, List as ListIcon, Loader2, Save, X, KeyRound, Copy, CornerDownRight, ClipboardList } from 'lucide-react';
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

  // Moving (Cut/Paste) state
  const [movingNode, setMovingNode] = useState(null);

  // Fetch Data
  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const data = await apiService.getAllNodes();
      if (Array.isArray(data)) {
        setAllNodes(data);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh in View mode
  useEffect(() => {
    if (mode !== 'view') return;
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetchData(true);
      }
    }, 2000);
    return () => clearInterval(intervalId);
  }, [mode]);

  // Initialize TinyMCE
  useEffect(() => {
    if (isEditingContent && window.tinymce) {
      window.tinymce.init({
        selector: '#lesson-editor',
        height: 'calc(100vh - 250px)',
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
        content_style: 'body { font-family:"Plus Jakarta Sans", sans-serif; font-size:18px; line-height: 1.8; color: #334155; background-color: #fff; }',
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
    allNodes
      .filter(n => n.parentId === (nodeId || null))
      // Ensure sorting by orderIndex explicitly in frontend as well
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)), 
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
    setEditingNode({ 
      parentId: nodeId || null,
      // New item gets highest orderIndex + 1
      orderIndex: children.length > 0 ? Math.max(...children.map(c => c.orderIndex || 0)) + 1 : 0
    });
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
        await fetchData(true); 
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
      fetchData(true);
    }
  };

  const handleSaveModal = async (data) => {
    await apiService.saveNode(data);
    fetchData(true);
  };
  
  const handleChangePassword = async (newPass) => {
    return await apiService.changePassword(newPass);
  };

  // --- Reorder Logic ---
  const handleMoveNodeOrder = async (node, direction) => {
    const currentIndex = children.findIndex(c => c.id === node.id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= children.length) return;

    const targetNode = children[targetIndex];
    
    // Swap order indexes
    const updates = [
      { id: node.id, parentId: node.parentId, orderIndex: targetNode.orderIndex || targetIndex },
      { id: targetNode.id, parentId: targetNode.parentId, orderIndex: node.orderIndex || currentIndex }
    ];

    // Optimistic UI Update (optional, but here we just wait for fetch)
    setLoading(true);
    await apiService.batchUpdateNodes(updates);
    await fetchData(true);
    setLoading(false);
  };

  // --- Move (Cut/Paste) Logic ---
  const handleStartMove = (node) => {
    setMovingNode(node);
  };

  const handleCancelMove = () => {
    setMovingNode(null);
  };

  const handlePasteNode = async () => {
    if (!movingNode) return;
    
    // Don't allow moving a folder into itself or its children (basic cycle check)
    if (movingNode.id === nodeId) {
      alert("Không thể di chuyển thư mục vào chính nó.");
      return;
    }
    
    setLoading(true);
    
    // Calculate new orderIndex at the end of the current list
    const maxOrder = children.length > 0 ? Math.max(...children.map(c => c.orderIndex || 0)) : -1;
    
    const updates = [{
      id: movingNode.id,
      parentId: nodeId || null, // Paste into current view
      orderIndex: maxOrder + 1
    }];

    await apiService.batchUpdateNodes(updates);
    setMovingNode(null);
    await fetchData(true);
    setLoading(false);
  };

  const currentType = currentNode ? currentNode.type : NodeType.ROOT;
  const allowedChildTypes = ALLOWED_CHILDREN[currentType] || [];

  if (loading && !allNodes.length) {
    return html`
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
             <div className="w-12 h-12 rounded-full border-4 border-indigo-100 animate-spin border-t-indigo-600"></div>
           </div>
           <span className="font-sans text-sm font-medium text-indigo-600/70">Đang tải dữ liệu...</span>
        </div>
      </div>
    `;
  }

  // --- VIEW: LESSON DETAIL ---
  if (currentNode?.type === NodeType.LESSON) {
    return html`
      <div className="max-w-5xl mx-auto pb-20">
        <${Breadcrumbs} items=${breadcrumbs} onNavigate=${handleNavigate} />
        
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-white/60 overflow-hidden min-h-[700px] flex flex-col relative">
          <div className="px-10 py-8 border-b border-slate-100 bg-white/95 backdrop-blur-sm flex justify-between items-start sticky top-0 z-20">
            <div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 uppercase tracking-widest mb-3">
                ${NODE_LABELS[NodeType.LESSON]}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 leading-tight">
                ${currentNode.title}
              </h1>
            </div>
            
            ${mode === 'edit' && !isEditingContent && html`
               <div className="flex gap-3">
                <button 
                  onClick=${() => handleEditTitle(currentNode)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 rounded-xl font-sans text-sm font-medium transition-colors"
                >
                   Sửa tên
                </button>
                <button 
                  onClick=${toggleContentEditor}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 font-sans"
                >
                  <${LayoutGrid} size=${18} /> Soạn thảo
                </button>
              </div>
            `}

            ${mode === 'edit' && isEditingContent && html`
              <div className="flex gap-3">
                <button 
                  onClick=${() => setIsEditingContent(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 font-sans"
                  disabled=${saving}
                >
                  <${X} size=${18} /> Hủy
                </button>
                <button 
                  onClick=${handleSaveContent}
                  disabled=${saving}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 font-sans disabled:opacity-70"
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
                className="p-10 md:p-14 prose prose-lg prose-slate max-w-none font-sans leading-loose prose-headings:font-serif prose-headings:font-bold prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-lg"
                dangerouslySetInnerHTML=${{ __html: currentNode.content || '<div class="flex flex-col items-center justify-center py-32 opacity-40"><div class="w-16 h-16 bg-slate-100 rounded-full mb-4"></div><p class="font-serif italic text-xl">Chưa có nội dung bài học.</p></div>' }}
              ></div>
            `}
          </div>
        </div>
        
        <div className="mt-8">
           <button 
             onClick=${() => handleNavigate(currentNode.parentId)}
             className="group text-slate-500 hover:text-indigo-600 flex items-center gap-2 font-sans text-sm transition-colors font-medium px-4 py-2 rounded-xl hover:bg-white hover:shadow-sm inline-flex"
           >
             <div className="p-1 rounded-full bg-slate-100 group-hover:bg-indigo-100 transition-colors"><${ArrowLeft} size=${16} /></div> Quay lại danh sách
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
    <div className="max-w-7xl mx-auto pb-20">
      <${Breadcrumbs} items=${breadcrumbs} onNavigate=${handleNavigate} />

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-slate-900 mb-3 tracking-tight">
            ${currentNode ? currentNode.title : 'Danh sách môn học'}
          </h1>
          <p className="text-slate-500 font-sans text-lg max-w-2xl">
            ${currentNode ? NODE_LABELS[currentNode.type] : 'Chọn một môn học để bắt đầu hành trình ghi chép.'}
          </p>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mt-6"></div>
        </div>
        
        ${mode === 'edit' && !currentNode && html`
          <button 
            onClick=${() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-slate-600 bg-white/60 backdrop-blur border border-white/60 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md"
          >
            <${KeyRound} size=${18} /> Đổi mật khẩu
          </button>
        `}
      </header>

      ${mode === 'edit' && allowedChildTypes.length > 0 && html`
        <div className="mb-10 flex gap-4 font-sans">
          ${allowedChildTypes.map(type => html`
            <button
              key=${type}
              onClick=${() => handleCreate(type)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all text-sm font-semibold tracking-wide"
            >
              <${Plus} size=${18} strokeWidth=${2.5} />
              Thêm ${NODE_LABELS[type]}
            </button>
          `)}
        </div>
      `}

      ${children.length === 0 ? html`
        <div className="text-center py-32 bg-white/60 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300/80 hover:border-indigo-300 transition-colors">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <${ListIcon} className="text-indigo-300" size=${48} />
          </div>
          <h3 className="text-xl font-serif font-medium text-slate-700">Chưa có nội dung</h3>
          <p className="text-slate-500 font-sans mt-2">Thư mục này hiện đang trống.</p>
          ${mode === 'edit' && html`
             <button 
               onClick=${() => allowedChildTypes[0] && handleCreate(allowedChildTypes[0])}
               className="mt-6 text-indigo-600 font-medium hover:underline decoration-2 underline-offset-4 font-sans"
             >
               Tạo mục mới ngay
             </button>
          `}
        </div>
      ` : html`
        <div className="grid grid-cols-1 gap-4">
          ${children.map((node, index) => html`
            <${NodeItem} 
              key=${node.id}
              node=${node}
              isEditMode=${mode === 'edit'}
              isFirst=${index === 0}
              isLast=${index === children.length - 1}
              onClick=${() => handleNavigate(node.id)}
              onEdit=${handleEditTitle}
              onDelete=${handleDelete}
              onMoveUp=${() => handleMoveNodeOrder(node, 'up')}
              onMoveDown=${() => handleMoveNodeOrder(node, 'down')}
              onStartMove=${handleStartMove}
            />
          `)}
        </div>
      `}

      <!-- Floating Status Bar for Move Operation -->
      ${movingNode && html`
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-10">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg"><${ClipboardList} size=${20}/></div>
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Đang di chuyển</p>
                    <p className="font-serif font-medium text-lg">${movingNode.title}</p>
                </div>
            </div>
            
            <div className="h-8 w-px bg-slate-700"></div>

            <div className="flex items-center gap-2">
                <button 
                    onClick=${handleCancelMove}
                    className="px-4 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                >
                    Hủy bỏ
                </button>
                <button 
                    onClick=${handlePasteNode}
                    className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg transition-colors text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                    <${CornerDownRight} size=${18} />
                    Dán vào đây
                </button>
            </div>
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
