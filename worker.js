
export default {
  async fetch(request, env) {
    // Cấu hình CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Auth-Pass", // Cho phép header tùy chỉnh
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Helper: Hàm kiểm tra mật khẩu
    async function checkPassword(pass) {
        if (!pass) return false;
        // 1. Kiểm tra biến môi trường (Secret)
        if (env.PASS && pass === env.PASS) return true;
        
        // 2. Kiểm tra DB
        try {
            const dbPass = await env.DB.prepare("SELECT value FROM config WHERE key = 'admin_password'").first();
            if (dbPass && dbPass.value === pass) return true;
            // Mặc định
            if (!dbPass && !env.PASS && pass === 'admin') return true;
        } catch(e) {
            // Fallback nếu DB chưa init
            if (pass === 'admin') return true;
        }
        return false;
    }

    try {
      // --- API: Lấy danh sách (Get All) ---
      if (url.pathname === "/api/get" && request.method === "GET") {
        
        // LOGIC BẢO MẬT MỚI:
        // Nếu Client gửi kèm mật khẩu (đang ở chế độ sửa), ta kiểm tra tính hợp lệ.
        // Nếu mật khẩu sai (đã bị đổi ở nơi khác), trả về 401 để Client tự đăng xuất.
        const authPass = request.headers.get('X-Auth-Pass');
        if (authPass) {
            const isValid = await checkPassword(authPass);
            if (!isValid) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
            }
        }

        // Đảm bảo bảng tồn tại
        try {
            await env.DB.batch([
                env.DB.prepare(`
                  CREATE TABLE IF NOT EXISTS nodes (
                    id TEXT PRIMARY KEY,
                    parentId TEXT,
                    type TEXT,
                    title TEXT,
                    content TEXT,
                    createdAt INTEGER,
                    orderIndex INTEGER DEFAULT 0
                  )
                `),
                env.DB.prepare(`
                  CREATE TABLE IF NOT EXISTS config (
                    key TEXT PRIMARY KEY,
                    value TEXT
                  )
                `)
            ]);
        } catch (e) {
            console.error("DB Init Error:", e);
        }
        
        // Migration
        try {
          await env.DB.prepare("ALTER TABLE nodes ADD COLUMN orderIndex INTEGER DEFAULT 0").run();
        } catch (e) {}

        const result = await env.DB.prepare("SELECT * FROM nodes ORDER BY orderIndex ASC, createdAt ASC").all();
        const nodes = result.results || [];
        return new Response(JSON.stringify(nodes), { headers: corsHeaders });
      }

      // --- API: Lưu (Thêm mới hoặc Cập nhật) ---
      if (url.pathname === "/api/save" && request.method === "POST") {
        const data = await request.json();
        
        let orderIndex = data.orderIndex;
        if (orderIndex === undefined || orderIndex === null) {
            if (!data.createdAt) { // Node mới
                const maxOrderResult = await env.DB.prepare("SELECT MAX(orderIndex) as maxVal FROM nodes WHERE parentId = ? OR (parentId IS NULL AND ? IS NULL)")
                    .bind(data.parentId || null, data.parentId || null)
                    .first();
                orderIndex = (maxOrderResult?.maxVal || 0) + 1;
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

      // --- API: Cập nhật hàng loạt ---
      if (url.pathname === "/api/batch-update" && request.method === "POST") {
        const updates = await request.json();
        if (!Array.isArray(updates)) {
            return new Response("Invalid data", { status: 400, headers: corsHeaders });
        }
        const stmt = env.DB.prepare(`UPDATE nodes SET orderIndex = ?, parentId = ? WHERE id = ?`);
        const batch = updates.map(u => stmt.bind(u.orderIndex, u.parentId || null, u.id));
        await env.DB.batch(batch);
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Xóa ---
      if (url.pathname === "/api/delete" && request.method === "POST") {
        const { id } = await request.json();
        if (!id) return new Response(JSON.stringify({ error: "Missing ID" }), { status: 400, headers: corsHeaders });

        await env.DB.prepare("DELETE FROM nodes WHERE id = ?").bind(id).run();
        
        const children = await env.DB.prepare("SELECT id FROM nodes WHERE parentId = ?").bind(id).all();
        if (children.results && children.results.length > 0) {
            await env.DB.prepare(`DELETE FROM nodes WHERE parentId = ?`).bind(id).run();
        }
        
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // --- API: Auth Verify ---
      if (url.pathname === "/api/auth/verify" && request.method === "POST") {
        const { password } = await request.json();
        const isValid = await checkPassword(password);
        
        if (isValid) {
            return new Response(JSON.stringify({ valid: true }), { headers: corsHeaders });
        }
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
