import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, LayoutGrid, List as ListIcon, Loader2 } from 'lucide-react';
import { apiService } from '../services/apiService';
import { NodeData, NodeType, Breadcrumb, ALLOWED_CHILDREN, NODE_LABELS } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { NodeItem } from '../components/NodeItem';
import { EditorModal } from '../components/EditorModal';

interface ExplorerProps {
  mode: 'view' | 'edit';
}

export const Explorer: React.FC<ExplorerProps> = ({ mode }) => {
  const { nodeId } = useParams<{ nodeId?: string }>();
  const navigate = useNavigate();
  
  const [allNodes, setAllNodes] = useState<NodeData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'UPDATE'>('CREATE');
  const [editingNode, setEditingNode] = useState<Partial<NodeData> | undefined>(undefined);
  const [targetType, setTargetType] = useState<NodeType>(NodeType.SUBJECT);

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

  // Derive current view state
  const currentNode = useMemo(() => 
    allNodes.find(n => n.id === nodeId), 
  [allNodes, nodeId]);

  const children = useMemo(() => 
    allNodes.filter(n => n.parentId === (nodeId || null)), 
  [allNodes, nodeId]);

  // Build Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const path: Breadcrumb[] = [];
    let curr = currentNode;
    while (curr) {
      path.unshift({ id: curr.id, title: curr.title });
      // eslint-disable-next-line no-loop-func
      curr = allNodes.find(n => n.id === curr?.parentId);
    }
    return path;
  }, [currentNode, allNodes]);

  // Handlers
  const handleNavigate = (id: string | null) => {
    const prefix = mode === 'edit' ? '/edit' : '/view';
    navigate(id ? `${prefix}/${id}` : prefix);
  };

  const handleCreate = (type: NodeType) => {
    setModalMode('CREATE');
    setTargetType(type);
    setEditingNode({ parentId: nodeId || null });
    setIsModalOpen(true);
  };

  const handleEdit = (node: NodeData) => {
    setModalMode('UPDATE');
    setTargetType(node.type);
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const handleDelete = async (node: NodeData) => {
    if (window.confirm(`Bạn có chắc muốn xóa "${node.title}"?`)) {
      await apiService.deleteNode(node.id);
      fetchData();
    }
  };

  const handleSave = async (data: Partial<NodeData>) => {
    await apiService.saveNode(data);
    fetchData();
  };

  // Determine allowed actions
  const currentType = currentNode ? currentNode.type : NodeType.ROOT;
  const allowedChildTypes = ALLOWED_CHILDREN[currentType] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Render Content for LESSON type
  if (currentNode?.type === NodeType.LESSON) {
    return (
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigate} />
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
          <div className="p-8 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-sm font-sans font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  {NODE_LABELS[NodeType.LESSON]}
                </span>
                <h1 className="text-3xl font-serif font-bold text-gray-900 leading-tight">
                  {currentNode.title}
                </h1>
              </div>
              {mode === 'edit' && (
                <button 
                  onClick={() => handleEdit(currentNode)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 font-sans"
                >
                  <LayoutGrid size={16} /> Chỉnh sửa nội dung
                </button>
              )}
            </div>
          </div>
          
          <div className="p-8 prose prose-lg max-w-none font-serif text-gray-800 whitespace-pre-wrap leading-relaxed">
            {currentNode.content || (
              <em className="text-gray-400">Chưa có nội dung...</em>
            )}
          </div>
        </div>
        
        <div className="mt-6">
           <button 
             onClick={() => handleNavigate(currentNode.parentId)}
             className="text-gray-500 hover:text-gray-900 flex items-center gap-2 font-sans text-sm transition-colors"
           >
             <ArrowLeft size={16} /> Quay lại
           </button>
        </div>

        <EditorModal 
          isOpen={isModalOpen}
          mode={modalMode}
          targetType={currentNode.type}
          initialData={editingNode}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      </div>
    );
  }

  // Render List for Containers (Subject, Chapter, etc.)
  return (
    <div className="max-w-5xl mx-auto">
      <Breadcrumbs items={breadcrumbs} onNavigate={handleNavigate} />

      <header className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          {currentNode ? currentNode.title : 'Danh sách môn học'}
        </h1>
        <p className="text-gray-500 font-sans">
          {currentNode ? NODE_LABELS[currentNode.type] : 'Chọn một môn để xem chi tiết'}
        </p>
      </header>

      {mode === 'edit' && allowedChildTypes.length > 0 && (
        <div className="mb-6 flex gap-2 font-sans">
          {allowedChildTypes.map(type => (
            <button
              key={type}
              onClick={() => handleCreate(type)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 hover:shadow transition-all text-sm font-medium"
            >
              <Plus size={16} />
              Thêm {NODE_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ListIcon className="text-gray-300" size={32} />
          </div>
          <p className="text-gray-500 font-sans">Chưa có mục nào ở đây.</p>
          {mode === 'edit' && <p className="text-sm text-gray-400 mt-1 font-sans">Hãy thêm mục mới để bắt đầu.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {children.map(node => (
            <NodeItem 
              key={node.id}
              node={node}
              isEditMode={mode === 'edit'}
              onClick={() => handleNavigate(node.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <EditorModal 
        isOpen={isModalOpen}
        mode={modalMode}
        targetType={targetType}
        initialData={editingNode}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
};