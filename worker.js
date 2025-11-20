
export default {
  async fetch(request, env) {
    // Cấu hình CORS để cho phép Web App gọi API
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Xử lý Preflight Request (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // --- API: Lấy danh sách (Get All) ---
      if (url.pathname === "/api/get" && request.method === "GET") {
        // 1. Tự động tạo bảng nodes nếu chưa có
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            parentId TEXT,
            type TEXT,
            title TEXT,
            content TEXT,
            createdAt INTEGER
          )
        `).run();
        
        // 2. Tự động tạo bảng config (lưu mật khẩu) nếu chưa có
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `).run();

        const result = await env.DB.prepare("SELECT * FROM nodes ORDER BY createdAt ASC").all();
        // Đảm bảo kết quả trả về luôn là một mảng, ngay cả khi DB chưa có dữ liệu hoặc truy vấn lỗi nhẹ
        const nodes = result.results || [];
        return new Response(JSON.stringify(nodes), { headers: corsHeaders });
      }

      // --- API: Lưu (Thêm mới hoặc Cập nhật) ---
      if (url.pathname === "/api/save" && request.method === "POST") {
        const data = await request.json();
        
        await env.DB.prepare(`
          INSERT OR REPLACE INTO nodes (id, parentId, type, title, content, createdAt)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          data.id, 
          data.parentId || null, 
          data.type, 
          data.title, 
          data.content || null, 
          data.createdAt || Date.now()
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Xóa ---
      if (url.pathname === "/api/delete" && request.method === "POST") {
        const { id } = await request.json();
        
        if (!id) {
           return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });
        }

        // Xóa node được chọn
        await env.DB.prepare("DELETE FROM nodes WHERE id = ?").bind(id).run();
        
        // Xóa các node con
        await env.DB.prepare("DELETE FROM nodes WHERE parentId = ?").bind(id).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Xác thực mật khẩu (Auth Verify) ---
      if (url.pathname === "/api/auth/verify" && request.method === "POST") {
        const { password } = await request.json();
        
        // Ưu tiên 1: Kiểm tra mật khẩu đặc biệt từ biến môi trường (Secret: PASS)
        if (env.PASS && password === env.PASS) {
           return new Response(JSON.stringify({ valid: true, source: 'env' }), { headers: corsHeaders });
        }

        // Ưu tiên 2: Kiểm tra mật khẩu người dùng lưu trong D1
        const dbPass = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first();
        
        if (dbPass && dbPass.value === password) {
           return new Response(JSON.stringify({ valid: true, source: 'db' }), { headers: corsHeaders });
        }

        // Fallback: Mật khẩu mặc định nếu chưa cài đặt gì
        if (!dbPass && !env.PASS && password === 'admin') {
             return new Response(JSON.stringify({ valid: true, source: 'default' }), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ valid: false }), { status: 401, headers: corsHeaders });
      }

      // --- API: Đổi mật khẩu (Lưu vào D1) ---
      if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
        const { newPassword } = await request.json();
        
        await env.DB.prepare(`
          INSERT OR REPLACE INTO config (key, value) VALUES ('admin_password', ?)
        `).bind(newPassword).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
