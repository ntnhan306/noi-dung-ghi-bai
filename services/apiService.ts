import { NodeData, NodeType } from '../types';

// Key for local storage simulation
const STORAGE_KEY = 'app_data_v1';

// Helper to generate ID
const generateId = () => Math.random().toString(36).substr(2, 9);

// Simulation of the D1 database structure in LocalStorage
const getLocalDB = (): NodeData[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // Seed data
    const seed: NodeData[] = [
      { id: 'root_math', parentId: null, type: NodeType.SUBJECT, title: 'Toán Học', createdAt: Date.now() },
      { id: 'root_lit', parentId: null, type: NodeType.SUBJECT, title: 'Ngữ Văn', createdAt: Date.now() },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(stored);
};

const saveLocalDB = (data: NodeData[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const apiService = {
  // Simulate GET /api/get
  getAllNodes: async (): Promise<NodeData[]> => {
    // In a real app, this would be: await fetch('/api/get').then(r => r.json())
    return new Promise((resolve) => {
      setTimeout(() => resolve(getLocalDB()), 300); // Simulate network delay
    });
  },

  // Simulate POST /api/save
  saveNode: async (node: Partial<NodeData>): Promise<NodeData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const db = getLocalDB();
        const existingIndex = db.findIndex(n => n.id === node.id);
        
        const newNode: NodeData = {
          id: node.id || generateId(),
          parentId: node.parentId || null,
          type: node.type || NodeType.SUBJECT,
          title: node.title || 'Không tiêu đề',
          content: node.content || '',
          createdAt: node.createdAt || Date.now()
        };

        if (existingIndex >= 0) {
          // Update
          db[existingIndex] = { ...db[existingIndex], ...node } as NodeData;
        } else {
          // Insert
          db.push(newNode);
        }
        
        saveLocalDB(db);
        resolve(newNode);
      }, 300);
    });
  },

  // Simulate POST /api/delete
  deleteNode: async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let db = getLocalDB();
        // Recursive delete logic would be better on backend, 
        // but for simulation we just delete the node. 
        // In a real SQL D1, you might use ON DELETE CASCADE or handle in worker.
        
        // Simple filter for now (leaving orphans in simulation is acceptable for demo)
        db = db.filter(n => n.id !== id);
        saveLocalDB(db);
        resolve(true);
      }, 300);
    });
  },
  
  // Authentication Check (Mocking the Worker Secret Check)
  verifyPassword: async (password: string): Promise<boolean> => {
    // This simulates the Worker checking env.PASS or D1 stored password
    // "admin" is the D1 password, "secret123" is the Worker Variable
    return new Promise((resolve) => {
      setTimeout(() => {
        if (password === 'admin' || password === 'secret123') {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 500);
    });
  }
};