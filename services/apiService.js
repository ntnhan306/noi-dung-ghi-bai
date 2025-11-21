
import { NodeType } from '../types.js';

const API_URL = 'https://noi-dung-ghi-bai.nhanns23062012.workers.dev';

export const apiService = {
  // Lấy tất cả dữ liệu từ D1
  // password: Mật khẩu hiện tại (nếu có) để xác thực phiên
  getAllNodes: async (password = null) => {
    try {
      const headers = {};
      if (password) {
        headers['X-Auth-Pass'] = password;
      }

      const response = await fetch(`${API_URL}/api/get`, {
        method: 'GET',
        headers: headers
      });
      
      // Xử lý trường hợp mật khẩu sai/hết hạn
      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      if (!response.ok) throw new Error('Network response was not ok');
      
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("Invalid JSON response:", text);
        return null; // Trả về null nếu parse lỗi để không xóa dữ liệu UI
      }
    } catch (error) {
      if (error.message === 'UNAUTHORIZED') throw error;
      
      console.error("Error fetching nodes:", error);
      // QUAN TRỌNG: Trả về null khi lỗi để không ghi đè dữ liệu cũ bằng mảng rỗng
      return null;
    }
  },

  // Lưu hoặc cập nhật (Node hoặc Bài học) vào D1
  saveNode: async (node) => {
    try {
      const payload = {
        id: node.id || Math.random().toString(36).substr(2, 9),
        parentId: node.parentId || null,
        type: node.type,
        title: node.title,
        content: node.content || '',
        createdAt: node.createdAt || Date.now(),
        orderIndex: node.orderIndex !== undefined ? node.orderIndex : 0
      };

      const response = await fetch(`${API_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Save failed');
      return await response.json();
    } catch (error) {
      console.error("Error saving node:", error);
      throw error;
    }
  },

  // Cập nhật hàng loạt (cho việc sắp xếp hoặc di chuyển)
  batchUpdateNodes: async (updates) => {
    // updates: Array of { id, orderIndex, parentId }
    try {
      const response = await fetch(`${API_URL}/api/batch-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Batch update failed');
      return true;
    } catch (error) {
      console.error("Error batch updating nodes:", error);
      return false;
    }
  },

  // Xóa dữ liệu khỏi D1
  deleteNode: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (!response.ok) throw new Error('Delete failed');
      return true;
    } catch (error) {
      console.error("Error deleting node:", error);
      return false;
    }
  },
  
  // Xác thực mật khẩu
  verifyPassword: async (password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.status === 200) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Auth error:", error);
      return false;
    }
  },

  // Đổi mật khẩu lưu trong D1
  changePassword: async (newPassword) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      
      return response.ok;
    } catch (error) {
      console.error("Change password error:", error);
      return false;
    }
  }
};
