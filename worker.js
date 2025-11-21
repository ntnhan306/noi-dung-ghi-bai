
export default {
  async fetch(request, env) {
    // Cấu hình CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // --- API: Lấy danh sách (Get All) ---
      if (url.pathname === "/api/get" && request.method === "GET") {
        // 1. Tạo bảng nodes
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            parentId TEXT,
            type TEXT,
            title TEXT,
            content TEXT,
            createdAt INTEGER,
            orderIndex INTEGER DEFAULT 0
          )
        `).run();
        
        // 1.1 Migration: Thêm cột orderIndex nếu chưa có (cho DB cũ)
        try {
          await env.DB.prepare("ALTER TABLE nodes ADD COLUMN orderIndex INTEGER DEFAULT 0").run();
        } catch (e) {
          // Bỏ qua lỗi nếu cột đã tồn tại
        }
        
        // 2. Tạo bảng config
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS config (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `).run();

        // Sắp xếp theo orderIndex tăng dần, sau đó đến thời gian tạo
        const result = await env.DB.prepare("SELECT * FROM nodes ORDER BY orderIndex ASC, createdAt ASC").all();
        const nodes = result.results || [];
        return new Response(JSON.stringify(nodes), { headers: corsHeaders });
      }

      // --- API: Lưu (Thêm mới hoặc Cập nhật) ---
      if (url.pathname === "/api/save" && request.method === "POST") {
        const data = await request.json();
        
        // Nếu tạo mới và không có orderIndex, tìm max orderIndex hiện tại trong cùng parent
        let orderIndex = data.orderIndex;
        if (orderIndex === undefined) {
            if (!data.createdAt) { // Chỉ tính toán cho node mới tạo
                const maxOrder = await env.DB.prepare("SELECT MAX(orderIndex) as maxVal FROM nodes WHERE parentId = ? OR (parentId IS NULL AND ? IS NULL)")
                    .bind(data.parentId || null, data.parentId || null)
                    .first();
                orderIndex = (maxOrder?.maxVal || 0) + 1;
            } else {
                orderIndex = 0;
            }
        }

        await env.DB.prepare(`
          INSERT OR REPLACE INTO nodes (id, parentId, type, title, content, createdAt, orderIndex)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.id, 
          data.parentId || null, 
          data.type, 
          data.title, 
          data.content || null, 
          data.createdAt || Date.now(),
          orderIndex
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Cập nhật hàng loạt (Dùng cho sắp xếp lại) ---
      if (url.pathname === "/api/batch-update" && request.method === "POST") {
        const updates = await request.json(); // Array of { id, orderIndex, parentId }
        
        if (!Array.isArray(updates)) {
            return new Response("Invalid data", { status: 400, headers: corsHeaders });
        }

        const stmt = env.DB.prepare(`
            UPDATE nodes SET orderIndex = ?, parentId = ? WHERE id = ?
        `);
        
        const batch = updates.map(u => stmt.bind(u.orderIndex, u.parentId || null, u.id));
        await env.DB.batch(batch);

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Xóa ---
      if (url.pathname === "/api/delete" && request.method === "POST") {
        const { id } = await request.json();
        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });

        await env.DB.prepare("DELETE FROM nodes WHERE id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM nodes WHERE parentId = ?").bind(id).run(); // Xóa con cấp 1
        
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Auth Verify ---
      if (url.pathname === "/api/auth/verify" && request.method === "POST") {
        const { password } = await request.json();
        if (env.PASS && password === env.PASS) return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders });
        const dbPass = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first();
        if (dbPass && dbPass.value === password) return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders });
        if (!dbPass && !env.PASS && password === 'admin') return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders });
        return new Response(JSON.stringify({ valid: false }), { status: 401, headers: corsHeaders });
      }

      // --- API: Change Password ---
      if (url.pathname === "/api/auth/change-password" && request.method === "POST") {
        const { newPassword } = await request.json();
        await env.DB.prepare(`INSERT OR REPLACE INTO config (key, value) VALUES ('admin_password', ?)`).bind(newPassword).run();
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      return new Response("Not found", { status: 404, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
