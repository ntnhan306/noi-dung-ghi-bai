
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { html } from '../utils/html.js';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LayoutGrid, List as ListIcon, Loader2, Save, X, KeyRound, CornerDownRight, ClipboardList, ArrowUpDown, LogOut, Mic, MicOff, Globe } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { NodeType, ALLOWED_CHILDREN, NODE_LABELS } from '../types.js';
import { Breadcrumbs } from '../components/Breadcrumbs.js';
import { NodeItem } from '../components/NodeItem.js';
import { EditorModal } from '../components/EditorModal.js';
import { ChangePasswordModal } from '../components/ChangePasswordModal.js';
import Sortable from 'sortablejs';

export const Explorer = ({ mode }) => {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  
  // --- State Definitions ---
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
  // We use this to track if TinyMCE is ready, but direct access goes through window.tinymce
  const [editorReady, setEditorReady] = useState(false);

  // Voice Typing State
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('vi-VN'); // 'vi-VN' or 'en-US'
  const recognitionRef = useRef(null);

  // Moving (Cut/Paste) state
  const [movingNode, setMovingNode] = useState(null);

  // Sort Mode State
  const [isSorting, setIsSorting] = useState(false);
  const sortableListRef = useRef(null);
  const sortableInstance = useRef(null);

  // Fetch Lock to prevent race conditions
  const isFetchingRef = useRef(false);

  // --- Derived State (Moved to top to prevent ReferenceError) ---
  const currentNode = useMemo(() => 
    allNodes.find(n => n.id === nodeId), 
  [allNodes, nodeId]);

  const children = useMemo(() => 
    allNodes
      .filter(n => n.parentId === (nodeId || null))
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)), 
  [allNodes, nodeId]);

  const breadcrumbs = useMemo(() => {
    const path = [];
    let curr = currentNode;
    while (curr) {
      path.unshift({ id: curr.id, title: curr.title });
      curr = allNodes.find(n => n.id === curr?.parentId);
    }
    return path;
  }, [currentNode, allNodes]);

  // --- Fetch Data Function ---
  const fetchData = async (isBackground = false) => {
    // Prevent overlapping fetches
    if (isFetchingRef.current) return;
    
    if (!isBackground) setLoading(true);
    isFetchingRef.current = true;

    try {
      const currentPass = mode === 'edit' ? sessionStorage.getItem('auth_pass') : null;
      const data = await apiService.getAllNodes(currentPass);
      
      if (Array.isArray(data)) {
        // CRITICAL: Do NOT update nodes if user is sorting or editing content
        // This prevents UI jumps or data overwrites while user is interacting
        if (!isSorting && !isEditingContent) {
            setAllNodes(data);
        }
      }
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        sessionStorage.removeItem('auth_pass');
        window.location.reload(); 
        return;
      }
      console.error("Failed to load data", err);
    } finally {
      isFetchingRef.current = false;
      if (!isBackground) setLoading(false);
    }
  };

  // --- Effects ---

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Periodic refresh
  useEffect(() => {
    const intervalId = setInterval(() => {
      // STOP FETCHING IF: Offline OR Sorting OR Editing Content
      // This fixes the "Loss of content" bug by freezing the background sync while you type.
      if (navigator.onLine && !isSorting && !isEditingContent) {
        fetchData(true);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [mode, isSorting, isEditingContent]); // Re-run effect when edit state changes

  // Initialize SortableJS
  useEffect(() => {
    if (isSorting && sortableListRef.current) {
      sortableInstance.current = Sortable.create(sortableListRef.current, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'bg-indigo-50/50',
        dragClass: 'opacity-50',
        onEnd: () => {
          const newOrderIds = Array.from(sortableListRef.current.children).map(el => el.getAttribute('data-id'));
          const orderMap = new Map(newOrderIds.map((id, index) => [id, index]));

          setAllNodes(prev => prev.map(n => {
            if (orderMap.has(n.id)) {
              return { ...n, orderIndex: orderMap.get(n.id) };
            }
            return n;
          }));
        }
      });
    } else {
      if (sortableInstance.current) {
        sortableInstance.current.destroy();
        sortableInstance.current = null;
      }
    }
  }, [isSorting, nodeId]);

  // Initialize TinyMCE Editor
  useEffect(() => {
    if (isEditingContent) {
      const initTinyMCE = () => {
        if (window.tinymce) {
          // Remove existing instance if any
          if (window.tinymce.get('editor-container')) {
            window.tinymce.get('editor-container').remove();
          }

          window.tinymce.init({
            selector: '#editor-container',
            // Plugins khổng lồ cho "80 tính năng"
            plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
            menubar: 'file edit view insert format tools table help',
            toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
            toolbar_sticky: true,
            autosave_ask_before_unload: true,
            autosave_interval: '30s',
            autosave_prefix: '{path}{query}-{id}-',
            autosave_restore_when_empty: false,
            autosave_retention: '2m',
            image_advtab: true,
            importcss_append: true,
            // Cấu hình chiều cao cố định để tránh lỗi 0px
            height: '75vh', 
            min_height: 600,
            resize: true, // Cho phép người dùng kéo giãn
            image_caption: true,
            quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
            noneditable_noneditable_class: 'mceNonEditable',
            toolbar_mode: 'sliding',
            contextmenu: 'link image table',
            content_style: 'body { font-family: "Plus Jakarta Sans", sans-serif; font-size: 16px; margin: 1.5rem; } #voice-interim { color: #94a3b8; background-color: #f1f5f9; padding: 0 2px; border-radius: 2px; }',
            branding: false, // TẮT BRANDING
            promotion: false, // TẮT QUẢNG CÁO UPGRADE
            setup: (editor) => {
              editor.on('init', () => {
                if (currentNode && currentNode.content) {
                    editor.setContent(currentNode.content);
                }
                setEditorReady(true);
              });
            }
          });
        }
      };
      
      // Delay slightly to ensure DOM is ready
      setTimeout(initTinyMCE, 100);
    } else {
      // Cleanup when closing editor
      if (window.tinymce && window.tinymce.get('editor-container')) {
        window.tinymce.get('editor-container').remove();
      }
      setEditorReady(false);
    }
    
    return () => {
      if (window.tinymce && window.tinymce.get('editor-container')) {
        window.tinymce.get('editor-container').remove();
      }
      // Stop voice if active
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isEditingContent]); 

  // --- Voice Logic ---
  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        alert("Trình duyệt của bạn không hỗ trợ nhập liệu bằng giọng nói. Vui lòng thử Chrome, Edge hoặc Safari.");
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = true; // BẬT CHẾ ĐỘ KẾT QUẢ TẠM THỜI (Real-time)

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Xóa span tạm nếu còn sót
        const editor = window.tinymce.get('editor-container');
        if (editor) {
             const existingInterim = editor.dom.select('span#voice-interim')[0];
             if (existingInterim) editor.dom.remove(existingInterim);
        }
      };

      recognition.onerror = (event) => {
        console.error("Lỗi nhận diện giọng nói:", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
            alert("Vui lòng cấp quyền truy cập Micro để sử dụng tính năng này.");
        }
      };

      recognition.onresult = (event) => {
        const editor = window.tinymce.get('editor-container');
        if (!editor) return;

        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript;
          } else {
            interimChunk += event.results[i][0].transcript;
          }
        }
        
        // Xử lý văn bản chính thức (Final)
        if (finalChunk) {
            // Xóa interim cũ nếu có để tránh trùng lặp
            const existingInterim = editor.dom.select('span#voice-interim')[0];
            if (existingInterim) editor.dom.remove(existingInterim);

            // Chèn văn bản chốt vào
            editor.execCommand('mceInsertContent', false, finalChunk + ' ');
        }

        // Xử lý văn bản tạm thời (Interim - Streaming)
        if (interimChunk) {
            const existingInterim = editor.dom.select('span#voice-interim')[0];
            if (existingInterim) {
                // Cập nhật nội dung nếu span đã tồn tại
                existingInterim.innerText = interimChunk;
            } else {
                // Tạo span mới nếu chưa có
                editor.execCommand('mceInsertContent', false, `<span id="voice-interim">${interimChunk}</span>`);
            }
        } else {
            // Nếu không còn interim, xóa span
            const existingInterim = editor.dom.select('span#voice-interim')[0];
            if (existingInterim) editor.dom.remove(existingInterim);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // --- Handlers ---

  const handleNavigate = (id) => {
    if (isSorting) return;
    const prefix = mode === 'edit' ? '/edit' : '/view';
    navigate(id ? `${prefix}/${id}` : prefix);
  };

  const handleCreate = (type) => {
    setModalMode('CREATE');
    setTargetType(type);
    setEditingNode({ 
      parentId: nodeId || null,
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
    const editor = window.tinymce.get('editor-container');
    if (editor) {
      setSaving(true);
      // Xóa mọi thẻ tạm trước khi lưu
      const existingInterim = editor.dom.select('span#voice-interim')[0];
      if (existingInterim) editor.dom.remove(existingInterim);

      const newContent = editor.getContent();
      try {
        const updatedNode = {
          ...currentNode,
          content: newContent
        };
        
        setAllNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
        
        await apiService.saveNode(updatedNode);
        
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
    const success = await apiService.changePassword(newPass);
    if (success) {
        sessionStorage.setItem('auth_pass', newPass);
    }
    return success;
  };

  const handleLogout = () => {
    sessionStorage.removeItem('auth_pass');
    navigate('/view');
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    const updates = children.map((node) => ({
        id: node.id,
        parentId: node.parentId,
        orderIndex: node.orderIndex
    }));
    
    await apiService.batchUpdateNodes(updates);
    setSaving(false);
    setIsSorting(false);
    await fetchData(true); 
  };

  const handleStartMove = (node) => {
    setMovingNode(node);
  };

  const handleCancelMove = () => {
    setMovingNode(null);
  };

  const handlePasteNode = async () => {
    if (!movingNode) return;
    if (movingNode.id === nodeId) {
      alert("Không thể di chuyển thư mục vào chính nó.");
      return;
    }
    
    setLoading(true);
    const maxOrder = children.length > 0 ? Math.max(...children.map(c => c.orderIndex || 0)) : -1;
    
    const updates = [{
      id: movingNode.id,
      parentId: nodeId || null,
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
              <div className="flex flex-wrap items-center justify-end gap-3">
                <!-- Voice Input Control -->
                <div className="flex items-center bg-slate-100 rounded-xl p-1 mr-2 border border-slate-200">
                   <button
                     onClick=${toggleVoiceInput}
                     className=${`p-2 rounded-lg transition-all flex items-center gap-2 ${isListening ? 'bg-red-500 text-white shadow-md animate-pulse' : 'text-slate-600 hover:bg-white hover:text-indigo-600'}`}
                     title=${isListening ? "Dừng ghi âm" : "Bắt đầu nhập liệu bằng giọng nói"}
                   >
                     ${isListening ? html`<${MicOff} size=${18} />` : html`<${Mic} size=${18} />`}
                     ${isListening && html`<span className="text-xs font-bold">Đang nghe...</span>`}
                   </button>
                   <div className="h-6 w-px bg-slate-300 mx-1"></div>
                   <div className="relative flex items-center">
                      <${Globe} size=${14} className="absolute left-2 text-slate-400" />
                      <select 
                        value=${voiceLang} 
                        onChange=${(e) => setVoiceLang(e.target.value)}
                        className="pl-7 pr-2 py-1 bg-transparent text-xs font-medium text-slate-600 outline-none cursor-pointer hover:text-indigo-600 appearance-none"
                        disabled=${isListening}
                      >
                        <option value="vi-VN">Tiếng Việt</option>
                        <option value="en-US">English</option>
                      </select>
                   </div>
                </div>

                <button 
                  onClick=${() => { setIsEditingContent(false); if(recognitionRef.current) recognitionRef.current.stop(); }}
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
          
          <div className="flex-1 bg-white relative flex flex-col">
            ${isEditingContent ? html`
              <div className="bg-white select-text min-h-[600px]">
                <textarea id="editor-container" className="w-full"></textarea>
              </div>
            ` : html`
              <div 
                className="p-10 md:p-14 prose prose-lg prose-slate max-w-none font-sans leading-loose prose-headings:font-serif font-bold prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-lg select-text"
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
          <div className="flex items-center gap-3">
            <button 
              onClick=${() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 text-slate-600 bg-white/60 backdrop-blur border border-white/60 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md"
            >
              <${KeyRound} size=${18} /> Đổi mật khẩu
            </button>
            
            <button 
              onClick=${handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 text-red-500 bg-white/60 backdrop-blur border border-white/60 hover:border-red-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium shadow-sm hover:shadow-md"
              title="Đăng xuất và xóa phiên làm việc"
            >
              <${LogOut} size=${18} /> Đăng xuất
            </button>
          </div>
        `}
      </header>

      ${mode === 'edit' && allowedChildTypes.length > 0 && html`
        <div className="mb-10 flex flex-wrap items-center gap-4 font-sans">
          ${isSorting ? html`
             <button
               onClick=${handleSaveOrder}
               disabled=${saving}
               className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 transition-all text-sm font-semibold tracking-wide"
             >
               ${saving ? html`<${Loader2} size=${18} className="animate-spin" />` : html`<${Save} size=${18} strokeWidth=${2.5} />`}
               Lưu vị trí
             </button>
             <button
               onClick=${() => { setIsSorting(false); fetchData(); }}
               disabled=${saving}
               className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all text-sm font-semibold tracking-wide"
             >
               <${X} size=${18} strokeWidth=${2.5} />
               Hủy
             </button>
             <span className="text-indigo-600 font-medium animate-pulse flex items-center gap-2 px-2">
               <${ArrowUpDown} size=${16} />
               Kéo thả biểu tượng <${ClipboardList} size=${16} /> để sắp xếp
             </span>
          ` : html`
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

             ${children.length > 1 && html`
                <div className="w-px h-8 bg-slate-300 mx-2"></div>
                <button
                    onClick=${() => setIsSorting(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-all text-sm font-medium"
                    title="Sắp xếp lại thứ tự"
                >
                    <${ArrowUpDown} size=${18} />
                    Sắp xếp
                </button>
             `}
          `}
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
        <div ref=${sortableListRef} className="grid grid-cols-1 gap-4 transition-all">
          ${children.map((node) => html`
            <${NodeItem} 
              key=${node.id}
              node=${node}
              isEditMode=${mode === 'edit'}
              isSorting=${isSorting} 
              onClick=${() => handleNavigate(node.id)}
              onEdit=${handleEditTitle}
              onDelete=${handleDelete}
              onStartMove=${handleStartMove}
            />
          `)}
        </div>
      `}

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
