
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { html } from '../utils/html.js';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Minus, ArrowLeft, LayoutGrid, List as ListIcon, Loader2, Save, X, KeyRound, CornerDownRight, ClipboardList, ArrowUpDown, LogOut, Mic, MicOff, Globe, Wand2 } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { NodeType, ALLOWED_CHILDREN, NODE_LABELS } from '../types.js';
import { Breadcrumbs } from '../components/Breadcrumbs.js';
import { NodeItem } from '../components/NodeItem.js';
import { EditorModal } from '../components/EditorModal.js';
import { ChangePasswordModal } from '../components/ChangePasswordModal.js';
import Sortable from 'sortablejs';

export const Explorer = ({ mode, isAppMode }) => {
  const { nodeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [allNodes, setAllNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewFontSize, setViewFontSize] = useState(16);
  const lastInitializedLessonId = useRef(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [editingNode, setEditingNode] = useState(undefined);
  const [targetType, setTargetType] = useState(NodeType.SUBJECT);

  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [autoFormat, setAutoFormat] = useState(true);
  const tempContentRef = useRef(null);

  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('vi-VN'); 
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const shouldListenRef = useRef(false);

  const [movingNode, setMovingNode] = useState(null);
  const [isSorting, setIsSorting] = useState(false);
  const sortableListRef = useRef(null);
  const sortableInstance = useRef(null);
  const isFetchingRef = useRef(false);
  const [visibleBreadcrumbs, setVisibleBreadcrumbs] = useState([]);

  const currentNode = useMemo(() => allNodes.find(n => n.id === nodeId), [allNodes, nodeId]);
  const children = useMemo(() => allNodes.filter(n => n.parentId === (nodeId || null)).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)), [allNodes, nodeId]);
  const calculatedBreadcrumbs = useMemo(() => {
    const path = [];
    let curr = currentNode;
    while (curr) {
      path.unshift({ id: curr.id, title: curr.title });
      curr = allNodes.find(n => n.id === curr?.parentId);
    }
    return path;
  }, [currentNode, allNodes]);

  useEffect(() => { if (!loading) setVisibleBreadcrumbs(calculatedBreadcrumbs); }, [loading, calculatedBreadcrumbs]);

  const fetchData = async (isBackground = false) => {
    if (isFetchingRef.current) return;
    const shouldDelay = isAppMode && nodeId && !isBackground;
    const startTime = Date.now();
    if (!isBackground) setLoading(true);
    isFetchingRef.current = true;
    try {
      const currentPass = mode === 'edit' ? sessionStorage.getItem('auth_pass') : null;
      const data = await apiService.getAllNodes(currentPass);
      if (Array.isArray(data)) {
        if (!isSorting && !isEditingContent) setAllNodes(data);
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
      if (!isBackground) {
        if (shouldDelay) {
            const elapsed = Date.now() - startTime;
            const MIN_LOAD_TIME = 1000;
            if (elapsed < MIN_LOAD_TIME) await new Promise(resolve => setTimeout(resolve, MIN_LOAD_TIME - elapsed));
        }
        setLoading(false);
      }
    }
  };

  useEffect(() => { fetchData(); }, [nodeId]);

  useEffect(() => {
    if (currentNode?.type === NodeType.LESSON) {
        if (lastInitializedLessonId.current !== currentNode.id) {
            if (currentNode.content) {
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(currentNode.content, 'text/html');
                    const elementWithFontSize = doc.querySelector('[style*="font-size"]');
                    if (elementWithFontSize) {
                        const style = elementWithFontSize.style.fontSize;
                        if (style) {
                            const match = style.match(/(\d+(\.\d+)?)(pt|px)/);
                            if (match) {
                                let size = parseFloat(match[1]);
                                const unit = match[3];
                                if (unit === 'px') size = size * 0.75;
                                if (!isNaN(size) && size > 5) setViewFontSize(Math.round(size));
                            }
                        }
                    } else { setViewFontSize(16); }
                } catch (e) { setViewFontSize(16); }
            } else { setViewFontSize(16); }
            lastInitializedLessonId.current = currentNode.id;
        }
    } else { lastInitializedLessonId.current = null; }
  }, [currentNode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (navigator.onLine && !isSorting && !isEditingContent) fetchData(true);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [mode, isSorting, isEditingContent]);

  useEffect(() => {
    if (isSorting && sortableListRef.current) {
      sortableInstance.current = Sortable.create(sortableListRef.current, {
        animation: 150, handle: '.drag-handle', ghostClass: 'bg-indigo-50/50', dragClass: 'opacity-50',
        onEnd: () => {
          const newOrderIds = Array.from(sortableListRef.current.children).map(el => el.getAttribute('data-id'));
          const orderMap = new Map(newOrderIds.map((id, index) => [id, index]));
          setAllNodes(prev => prev.map(n => {
            if (orderMap.has(n.id)) return { ...n, orderIndex: orderMap.get(n.id) };
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

  useEffect(() => {
    if (isEditingContent) {
      const initTinyMCE = () => {
        if (window.tinymce && window.tinymce.get('editor-container')) {
           tempContentRef.current = window.tinymce.get('editor-container').getContent();
           window.tinymce.get('editor-container').remove();
        }
        window.tinymce.init({
          selector: '#editor-container',
          plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons textpattern',
          menubar: 'file edit view insert format tools table help',
          toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
          toolbar_sticky: true,
          autosave_interval: '30s',
          height: '75vh', 
          min_height: 600,
          content_style: 'body { font-family: "Plus Jakarta Sans", sans-serif; font-size: 16px; margin: 1.5rem; background-color: #ffffff; } #voice-interim { color: #94a3b8; background-color: #f1f5f9; padding: 0 2px; border-radius: 2px; }',
          branding: false,
          promotion: false,
          textpattern_patterns: autoFormat ? [
            {start: '*', end: '*', format: 'italic'},
            {start: '**', end: '**', format: 'bold'},
            {start: '#', format: 'h1'},
            {start: '##', format: 'h2'},
            {start: '###', format: 'h3'},
            {start: '1. ', cmd: 'InsertOrderedList'},
            {start: '- ', cmd: 'InsertUnorderedList'}
          ] : [],
          setup: (editor) => {
            editor.on('init', () => {
              const contentToLoad = tempContentRef.current !== null ? tempContentRef.current : (currentNode && currentNode.content);
              if (contentToLoad) editor.setContent(contentToLoad);
              setEditorReady(true);
              tempContentRef.current = null;
            });
            editor.on('change keyup', () => { tempContentRef.current = editor.getContent(); });
          }
        });
      };
      setTimeout(initTinyMCE, 100);
    } else {
      if (window.tinymce && window.tinymce.get('editor-container')) window.tinymce.get('editor-container').remove();
      setEditorReady(false);
      tempContentRef.current = null;
    }
    return () => {
      shouldListenRef.current = false;
      if (window.tinymce && window.tinymce.get('editor-container')) {
        tempContentRef.current = window.tinymce.get('editor-container').getContent();
        window.tinymce.get('editor-container').remove();
      }
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isEditingContent, autoFormat]);

  const processSmartText = (text, editor) => {
    if (!text) return '';
    let processed = text.trim();
    const replacements = [
        { key: /(xuống dòng)/gi, val: '<br/>' }, 
        { key: /(chấm hết)/gi, val: '.' },
        { key: /(gạch đầu dòng)/gi, val: '-' },
        { key: /(chấm phẩy)/gi, val: ';' },
        { key: /( hai chấm)/gi, val: ':' },
        { key: /(chấm hỏi)/gi, val: '?' },
        { key: /(chấm than)/gi, val: '!' },
        { key: /(phần trăm)/gi, val: '%' },
        { key: /(mở ngoặc đơn)/gi, val: '(' },
        { key: /(đóng ngoặc đơn)/gi, val: ')' },
        { key: /(mở ngoặc kép)/gi, val: '"' },
        { key: /(đóng ngoặc kép)/gi, val: '"' },
        { key: /(mũi tên phải)/gi, val: '→' },
        { key: /(mũi tên trái)/gi, val: '←' },
        { key: /(suy ra)/gi, val: '⇒' },
        { key: /(chấm)/gi, val: '. ' }, 
        { key: /( phẩy)/gi, val: ',' },
        { key: /(cộng)/gi, val: '+' },
        { key: /(trừ)/gi, val: '-' }
    ];
    replacements.forEach(({key, val}) => { processed = processed.replace(key, val); });
    const properNouns = ["Việt Nam", "Hà Nội", "Hồ Chí Minh", "Sài Gòn", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Huế", "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
    properNouns.forEach(word => { processed = processed.replace(new RegExp(`\\b${word}\\b`, 'gi'), word); });
    processed = processed.replace(/\s+([.,;?!%)\]}])/g, '$1');
    const rng = editor.selection.getRng();
    let needsCap = false;
    if (rng.startOffset === 0) {
        const node = editor.selection.getNode();
        if (node.nodeName === 'LI' || node.innerText.trim().length === 0) needsCap = true;
    } else {
        const textContent = rng.startContainer.textContent || "";
        const prevContext = textContent.slice(Math.max(0, rng.startOffset - 3), rng.startOffset).trim();
        const prevChar = textContent.charAt(rng.startOffset - 1);
        if (['.', '!', '?', '\n'].includes(prevChar) || prevContext.endsWith('.') || prevContext.endsWith('!') || prevContext.endsWith('?')) needsCap = true;
        if (prevChar === '-' || prevContext.endsWith('-')) needsCap = true;
    }
    if (needsCap && processed.length > 0 && !processed.startsWith('<br')) processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    processed = processed.replace(/([.?!])\s*([a-zà-ỹ])/g, (match, p1, p2) => p1 + ' ' + p2.toUpperCase());
    return processed;
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      shouldListenRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { alert("Trình duyệt không hỗ trợ nhập liệu bằng giọng nói."); return; }
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = true;
      shouldListenRef.current = true;
      const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
            shouldListenRef.current = false;
            if (recognitionRef.current) recognitionRef.current.stop();
            setIsListening(false);
        }, 30000);
      };
      recognition.onstart = () => { setIsListening(true); resetSilenceTimer(); };
      recognition.onend = () => {
        if (shouldListenRef.current) { try { recognition.start(); } catch (e) { setIsListening(false); shouldListenRef.current = false; } return; }
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
        const editor = window.tinymce.get('editor-container');
        if (editor) { const existingInterim = editor.dom.select('span#voice-interim')[0]; if (existingInterim) editor.dom.remove(existingInterim); }
      };
      recognition.onerror = (event) => { if (event.error === 'not-allowed' || event.error === 'service-not-allowed') { shouldListenRef.current = false; setIsListening(false); } };
      recognition.onresult = (event) => {
        resetSilenceTimer();
        const editor = window.tinymce.get('editor-container');
        if (!editor) return;
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalChunk += event.results[i][0].transcript; else interimChunk += event.results[i][0].transcript;
        }
        if (finalChunk) {
            const existingInterim = editor.dom.select('span#voice-interim')[0];
            if (existingInterim) editor.dom.remove(existingInterim);
            const smartText = processSmartText(finalChunk, editor);
            const suffix = smartText.endsWith(' ') || smartText.endsWith('<br/>') ? '' : ' ';
            editor.execCommand('mceInsertContent', false, smartText + suffix);
        }
        if (interimChunk) {
            const existingInterim = editor.dom.select('span#voice-interim')[0];
            if (existingInterim) existingInterim.innerText = interimChunk;
            else editor.execCommand('mceInsertContent', false, `<span id="voice-interim">${interimChunk}</span>`);
        } else {
            const existingInterim = editor.dom.select('span#voice-interim')[0];
            if (existingInterim) editor.dom.remove(existingInterim);
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleNavigate = (id) => {
    if (isSorting) return;
    const prefix = mode === 'edit' ? '/edit' : '/view';
    let path = id ? `${prefix}/${id}` : prefix;
    if (location.search) path += location.search;
    navigate(path);
  };

  const handleCreate = (type) => {
    setModalMode('CREATE');
    setTargetType(type);
    setEditingNode({ parentId: nodeId || null, orderIndex: children.length > 0 ? Math.max(...children.map(c => c.orderIndex || 0)) + 1 : 0 });
    setIsModalOpen(true);
  };
  const handleEditTitle = (node) => { setModalMode('UPDATE'); setTargetType(node.type); setEditingNode(node); setIsModalOpen(true); };
  const toggleContentEditor = () => setIsEditingContent(true);
  const handleSaveContent = async () => {
    const editor = window.tinymce.get('editor-container');
    if (editor) {
      setSaving(true);
      const existingInterim = editor.dom.select('span#voice-interim')[0];
      if (existingInterim) editor.dom.remove(existingInterim);
      const newContent = editor.getContent();
      try {
        const updatedNode = { ...currentNode, content: newContent };
        setAllNodes(prev => prev.map(n => n.id === updatedNode.id ? updatedNode : n));
        await apiService.saveNode(updatedNode);
        setIsEditingContent(false);
        await fetchData(true); 
      } catch (e) { alert("Lỗi khi lưu nội dung!"); } finally { setSaving(false); }
    }
  };
  const handleDelete = async (node) => { if (window.confirm(`Bạn có chắc muốn xóa "${node.title}"?`)) { await apiService.deleteNode(node.id); fetchData(true); } };
  const handleSaveModal = async (data) => { await apiService.saveNode(data); fetchData(true); };
  const handleChangePassword = async (newPass) => { const success = await apiService.changePassword(newPass); if (success) sessionStorage.setItem('auth_pass', newPass); return success; };
  const handleLogout = () => { sessionStorage.removeItem('auth_pass'); navigate('/view'); };
  const handleSaveOrder = async () => {
    setSaving(true);
    const updates = children.map((node) => ({ id: node.id, parentId: node.parentId, orderIndex: node.orderIndex }));
    await apiService.batchUpdateNodes(updates);
    setSaving(false); setIsSorting(false); await fetchData(true); 
  };
  const handleStartMove = (node) => setMovingNode(node);
  const handleCancelMove = () => setMovingNode(null);
  const handlePasteNode = async () => {
    if (!movingNode) return;
    if (movingNode.id === nodeId) { alert("Không thể di chuyển thư mục vào chính nó."); return; }
    setLoading(true);
    const maxOrder = children.length > 0 ? Math.max(...children.map(c => c.orderIndex || 0)) : -1;
    const updates = [{ id: movingNode.id, parentId: nodeId || null, orderIndex: maxOrder + 1 }];
    await apiService.batchUpdateNodes(updates);
    setMovingNode(null); await fetchData(true); setLoading(false);
  };
  const increaseFontSize = () => setViewFontSize(prev => Math.min(prev + 4, 74));
  const decreaseFontSize = () => setViewFontSize(prev => Math.max(prev - 4, 6));
  const allowedChildTypes = ALLOWED_CHILDREN[currentNode ? currentNode.type : NodeType.ROOT] || [];

  const renderMainContent = () => {
    if (loading && !allNodes.length) {
        if (isAppMode && nodeId) return html`<div className="flex items-center justify-center h-[60vh]"><div className="loader"></div></div>`;
        return html`
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4 p-8 bg-white/40 backdrop-blur-xl rounded-3xl shadow-glass border border-white/50 animate-float">
               <div className="relative">
                 <div className="w-14 h-14 rounded-full border-[5px] border-white/30 animate-spin border-t-indigo-500 shadow-lg"></div>
               </div>
               <span className="font-serif text-base font-bold text-indigo-800 tracking-wider">Đang tải dữ liệu...</span>
            </div>
          </div>
        `;
    }

    if (currentNode?.type === NodeType.LESSON) {
        return html`
            <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] shadow-glass border border-white/50 overflow-hidden min-h-[700px] flex flex-col relative ring-1 ring-white/60">
              <div className="px-6 md:px-12 py-6 md:py-8 border-b border-white/30 bg-white/40 backdrop-blur-md flex justify-between items-start sticky top-0 z-20">
                <div>
                  ${!isAppMode && html`
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-indigo-500 to-violet-500 text-white uppercase tracking-widest mb-3 shadow-md shadow-indigo-500/20">
                        ${NODE_LABELS[NodeType.LESSON]}
                      </span>
                  `}
                  <h1 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 leading-tight drop-shadow-sm">
                    ${currentNode.title}
                  </h1>
                </div>
                ${mode === 'edit' && !isEditingContent && html`
                   <div className="flex gap-3">
                    <button onClick=${() => handleEditTitle(currentNode)} className="px-4 py-2 text-slate-600 hover:bg-white/60 hover:text-indigo-600 rounded-xl font-sans text-sm font-bold transition-all border border-transparent hover:border-white/50 hover:shadow-sm">Sửa tên</button>
                    <button onClick=${toggleContentEditor} className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 border border-white/20"><${LayoutGrid} size=${18} /> Soạn thảo</button>
                  </div>
                `}
                ${mode === 'edit' && isEditingContent && html`
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="flex items-center bg-white/50 backdrop-blur rounded-xl p-1 mr-2 border border-white/50 shadow-sm">
                       <button onClick=${toggleVoiceInput} className=${`p-2 rounded-lg transition-all flex items-center gap-2 ${isListening ? 'bg-red-500 text-white shadow-md animate-pulse' : 'text-slate-600 hover:bg-white hover:text-indigo-600'}`}>${isListening ? html`<${MicOff} size=${18} />` : html`<${Mic} size=${18} />`}</button>
                       <div className="h-6 w-px bg-slate-300 mx-1"></div>
                       <select value=${voiceLang} onChange=${(e) => setVoiceLang(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer" disabled=${isListening}><option value="vi-VN">VN</option><option value="en-US">EN</option></select>
                       <div className="h-6 w-px bg-slate-300 mx-1"></div>
                       <button onClick=${() => setAutoFormat(!autoFormat)} className=${`p-2 rounded-lg transition-all ${autoFormat ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400'}`}><${Wand2} size=${18} /></button>
                    </div>
                    <button onClick=${() => { setIsEditingContent(false); if(recognitionRef.current) recognitionRef.current.stop(); shouldListenRef.current = false; }} className="px-4 py-2 text-slate-600 hover:bg-white/60 rounded-xl text-sm font-bold transition-colors border border-transparent hover:border-white/50"><${X} size=${18} /> Hủy</button>
                    <button onClick=${handleSaveContent} disabled=${saving} className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2 border border-white/20">${saving ? html`<${Loader2} size=${18} className="animate-spin"/>` : html`<${Save} size=${18} />`} ${saving ? 'Đang lưu...' : 'Lưu bài'}</button>
                  </div>
                `}
              </div>
              
              <div className="flex-1 relative flex flex-col">
                ${isEditingContent ? html`
                  <div className="bg-white/80 select-text min-h-[600px]">
                    <textarea id="editor-container" className="w-full"></textarea>
                  </div>
                ` : html`
                  <div className="relative flex flex-col bg-white/30 min-h-[500px]">
                      <style>
                        .lesson-content p, .lesson-content ul, .lesson-content ol, .lesson-content li, .lesson-content span, .lesson-content div, .lesson-content td, .lesson-content th, .lesson-content pre, .lesson-content code { font-size: ${viewFontSize}pt !important; line-height: 1.6; }
                        .lesson-content h1 { font-size: ${Math.round(viewFontSize * 2.2)}pt !important; margin-bottom: 0.5em; font-weight: bold; }
                        .lesson-content h2 { font-size: ${Math.round(viewFontSize * 1.8)}pt !important; margin-bottom: 0.5em; font-weight: bold; }
                        .lesson-content h3 { font-size: ${Math.round(viewFontSize * 1.5)}pt !important; margin-bottom: 0.5em; font-weight: bold; }
                        .lesson-content h4 { font-size: ${Math.round(viewFontSize * 1.25)}pt !important; margin-bottom: 0.5em; font-weight: bold; }
                        .lesson-content h5 { font-size: ${Math.round(viewFontSize * 1.1)}pt !important; margin-bottom: 0.5em; font-weight: bold; }
                        .lesson-content h6 { font-size: ${viewFontSize}pt !important; margin-bottom: 0.5em; font-weight: bold; text-transform: uppercase; }
                        .lesson-content ul, .lesson-content ol { padding-left: 2em; } .lesson-content li { margin-bottom: 0.25em; }
                      </style>
                      <div className="lesson-content p-6 md:p-14 prose prose-slate max-w-none font-sans leading-loose prose-a:text-indigo-600 prose-img:rounded-2xl prose-img:shadow-xl select-text" dangerouslySetInnerHTML=${{ __html: currentNode.content || '<div class="flex flex-col items-center justify-center py-32 opacity-40"><div class="w-16 h-16 bg-white/50 rounded-full mb-4 shadow-sm"></div><p class="font-serif italic text-xl text-slate-600">Chưa có nội dung bài học.</p></div>' }}></div>
                  </div>
                `}
              </div>
            </div>
            <div className="mt-8 px-4">
               <button onClick=${() => handleNavigate(currentNode.parentId)} className="group text-slate-600 hover:text-indigo-600 flex items-center gap-2 font-sans text-sm transition-colors font-bold px-5 py-2.5 rounded-2xl hover:bg-white/50 hover:shadow-glass inline-flex backdrop-blur-sm border border-transparent hover:border-white/50"><div className="p-1 rounded-full bg-slate-200/50 group-hover:bg-indigo-100 transition-colors"><${ArrowLeft} size=${16} /></div> Quay lại</button>
            </div>
        `;
    }

    return html`
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 mb-3 tracking-tight drop-shadow-sm">
            ${currentNode ? currentNode.title : 'Danh sách môn học'}
          </h1>
          <p className="text-slate-600 font-sans text-lg max-w-2xl font-medium">
            ${isAppMode ? '' : (currentNode ? NODE_LABELS[currentNode.type] : 'Chọn một môn học để xem nội dung chi tiết.')}
          </p>
          ${!isAppMode && html`<div className="h-1.5 w-32 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mt-6 shadow-lg shadow-indigo-500/20"></div>`}
        </div>
        ${mode === 'edit' && !currentNode && html`
          <div className="flex items-center gap-3 relative z-10">
            <button onClick=${() => setIsPasswordModalOpen(true)} className="flex items-center gap-2 px-6 py-3 text-slate-700 bg-white/40 backdrop-blur-md border border-white/50 hover:border-indigo-200 hover:text-indigo-600 hover:bg-white/70 rounded-2xl transition-all text-sm font-bold shadow-glass hover:shadow-lg hover:-translate-y-0.5"><${KeyRound} size=${18} /> Đổi mật khẩu</button>
            <button onClick=${handleLogout} className="flex items-center gap-2 px-6 py-3 text-red-500 bg-white/40 backdrop-blur-md border border-white/50 hover:border-red-200 hover:text-red-600 hover:bg-red-50/50 rounded-2xl transition-all text-sm font-bold shadow-glass hover:shadow-lg hover:-translate-y-0.5"><${LogOut} size=${18} /> Đăng xuất</button>
          </div>
        `}
      </header>
      ${mode === 'edit' && allowedChildTypes.length > 0 && html`
        <div className="mb-12 flex flex-wrap items-center gap-4 font-sans px-2 relative z-10">
          ${isSorting ? html`
             <button onClick=${handleSaveOrder} disabled=${saving} className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all text-sm font-bold tracking-wide border border-transparent border-t-white/20">${saving ? html`<${Loader2} size=${18} className="animate-spin" />` : html`<${Save} size=${18} strokeWidth=${2.5} />`} Lưu vị trí</button>
             <button onClick=${() => { setIsSorting(false); fetchData(); }} disabled=${saving} className="flex items-center gap-2 px-8 py-3.5 bg-white/50 backdrop-blur-md border border-white/60 text-slate-600 rounded-2xl hover:bg-white/80 transition-all text-sm font-bold tracking-wide shadow-glass"><${X} size=${18} strokeWidth=${2.5} /> Hủy</button>
             <span className="text-indigo-600 font-bold animate-pulse flex items-center gap-2 px-5 py-3 bg-indigo-50/60 rounded-2xl border border-indigo-100/50 backdrop-blur-sm"><${ArrowUpDown} size=${16} /> Kéo thả biểu tượng <${ClipboardList} size=${16} /> để sắp xếp</span>
          ` : html`
             ${allowedChildTypes.map(type => html`
                <button key=${type} onClick=${() => handleCreate(type)} className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 transition-all text-sm font-bold tracking-wide border border-transparent border-t-white/20"><${Plus} size=${18} strokeWidth=${2.5} /> Thêm ${NODE_LABELS[type]}</button>
             `)}
             ${children.length > 1 && html`<div className="w-px h-10 bg-slate-400/30 mx-2"></div><button onClick=${() => setIsSorting(true)} className="flex items-center gap-2 px-6 py-3.5 bg-white/40 backdrop-blur-md border border-white/50 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl shadow-glass hover:shadow-lg transition-all text-sm font-bold" title="Sắp xếp lại thứ tự"><${ArrowUpDown} size=${18} /> Sắp xếp</button>`}
          `}
        </div>
      `}
      ${children.length === 0 ? html`
        <div className="text-center py-32 bg-white/30 backdrop-blur-md rounded-[2rem] border border-dashed border-white/60 hover:border-indigo-300 transition-colors mx-2 shadow-glass relative overflow-hidden group">
          <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-110 transition-transform"><${ListIcon} className="text-indigo-300" size=${48} /></div>
          <h3 className="text-xl font-serif font-bold text-slate-700">${!currentNode ? 'Chưa có môn học nào' : 'Chưa có nội dung'}</h3>
          <p className="text-slate-500 font-sans mt-2 font-medium">Danh sách này hiện đang trống.</p>
          ${mode === 'edit' && html`<button onClick=${() => allowedChildTypes[0] && handleCreate(allowedChildTypes[0])} className="mt-8 px-6 py-2 bg-white/50 hover:bg-white rounded-full text-indigo-600 font-bold shadow-sm hover:shadow-md transition-all">Tạo mục mới ngay</button>`}
        </div>
      ` : html`
        <div ref=${sortableListRef} className="grid grid-cols-1 gap-5 transition-all px-2 pb-10">
          ${children.map((node) => html`
            <${NodeItem} key=${node.id} node=${node} isEditMode=${mode === 'edit'} isSorting=${isSorting} onClick=${() => handleNavigate(node.id)} onEdit=${handleEditTitle} onDelete=${handleDelete} onStartMove=${handleStartMove} />
          `)}
        </div>
      `}
    `;
  };

  return html`
    <div className="max-w-7xl mx-auto pb-20 relative z-10">
      <${Breadcrumbs} items=${visibleBreadcrumbs} onNavigate=${handleNavigate} />
      ${renderMainContent()}
      ${movingNode && html`
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl text-white px-8 py-5 rounded-3xl shadow-2xl z-50 flex items-center gap-8 animate-in slide-in-from-bottom-10 border border-white/20 ring-1 ring-black/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/30"><${ClipboardList} size=${24}/></div>
                <div><p className="text-xs text-slate-400 uppercase tracking-widest font-extrabold mb-1">Đang di chuyển</p><p className="font-serif font-bold text-xl tracking-tight">${movingNode.title}</p></div>
            </div>
            <div className="h-10 w-px bg-slate-700"></div>
            <div className="flex items-center gap-3">
                <button onClick=${handleCancelMove} className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-sm font-bold">Hủy bỏ</button>
                <button onClick=${handlePasteNode} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-colors text-sm font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 border-t border-white/20"><${CornerDownRight} size=${18} strokeWidth=${3} /> Dán vào đây</button>
            </div>
        </div>
      `}
      <${EditorModal} isOpen=${isModalOpen} mode=${modalMode} targetType=${targetType} initialData=${editingNode} onClose=${() => setIsModalOpen(false)} onSave=${handleSaveModal} />
      <${ChangePasswordModal} isOpen=${isPasswordModalOpen} onClose=${() => setIsPasswordModalOpen(false)} onSave=${handleChangePassword} />
      ${mode === 'view' && !isAppMode && currentNode?.type === NodeType.LESSON && html`
          <div className="fixed bottom-12 right-12 flex flex-col gap-4 z-50">
              <button onClick=${increaseFontSize} className="p-4 bg-white/80 backdrop-blur-xl text-indigo-600 rounded-full shadow-glass hover:shadow-neon hover:bg-white hover:scale-110 active:scale-95 transition-all select-none border border-white/60"><${Plus} size=${24} strokeWidth=${3} /></button>
              <div className="bg-white/80 backdrop-blur-xl px-3 py-1.5 rounded-xl text-xs font-extrabold text-center text-slate-600 shadow-glass border border-white/60 select-none">${viewFontSize}pt</div>
              <button onClick=${decreaseFontSize} className="p-4 bg-white/80 backdrop-blur-xl text-indigo-600 rounded-full shadow-glass hover:shadow-neon hover:bg-white hover:scale-110 active:scale-95 transition-all select-none border border-white/60"><${Minus} size=${24} strokeWidth=${3} /></button>
          </div>
      `}
    </div>
  `;
};
