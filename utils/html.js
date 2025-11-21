
import React from 'react';
import htm from 'htm';

// Xử lý tương thích cho các môi trường module khác nhau (ESM/CJS)
// Một số CDN trả về React dưới dạng default export, số khác là named export
const createElement = React.createElement || (React.default && React.default.createElement);

if (!createElement) {
  console.error("React.createElement not found. Check import map.");
  throw new Error("React initialization failed");
}

let html;

// Logic khởi tạo htm an toàn
// Trường hợp 1: htm là function (default export của esm.sh)
if (typeof htm === 'function') {
  html = htm.bind(createElement);
}
// Trường hợp 2: htm là Module Namespace và có export hàm 'bind' (utility)
else if (htm && typeof htm.bind === 'function') {
  html = htm.bind(createElement);
}
// Trường hợp 3: htm là Module Namespace và có default export là function
else if (htm && htm.default && typeof htm.default === 'function') {
  html = htm.default.bind(createElement);
} else {
  console.error("htm module structure:", htm);
  throw new Error("htm initialization failed: htm is not a function or compatible module");
}

export { html };
