const http = require('http');

function req(path, method, body, token) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 4000, path,
      method: method || 'GET',
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const r = http.request(opts, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(b) }));
    });
    r.on('error', e => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

async function runTests() {
  console.log('=== PHASE 7: RUNTIME VALIDATION ===\n');

  // 1. Health check
  let r = await req('/api/health');
  console.log('[1] Health:', r.status, JSON.stringify(r.body));

  // 2. Admin login
  r = await req('/api/admin/login', 'POST', { email: 'admin@sellbazar.com', password: 'Admin@1234' });
  console.log('[2] Admin Login:', r.status, JSON.stringify(r.body).slice(0, 120));
  const token = r.body.token;
  const adminUser = r.body.admin;
  console.log('[2b] Token present:', !!token, '| Admin:', JSON.stringify(adminUser));

  // 3. Admin /me
  r = await req('/api/admin/me', 'GET', null, token);
  console.log('[3] Admin /me:', r.status, JSON.stringify(r.body));

  // 4. Products list (public)
  r = await req('/api/products');
  console.log('[4] Products list:', r.status, 'total=', r.body.total, 'first=', r.body.data?.[0]?.name);

  // 5. Orders list (requires auth)
  r = await req('/api/orders', 'GET', null, token);
  console.log('[5] Orders list:', r.status, 'total=', r.body.total);

  // 6. Security: no token
  r = await req('/api/orders');
  console.log('[6] Orders no-token (expect 401):', r.status, r.body.error);

  // 7. Security: bad token
  r = await req('/api/orders', 'GET', null, 'bad.token.here');
  console.log('[7] Orders bad-token (expect 401):', r.status, r.body.error);

  // 8. Create product
  r = await req('/api/products', 'POST', {
    name: 'Test Product Runtime', brand: 'TestBrand',
    category: 'Electronics', price: 5000, stock: 10
  }, token);
  console.log('[8] Create product:', r.status, 'id=', r.body.id, 'name=', r.body.name);
  const newId = r.body.id;

  // 9. Update product
  r = await req('/api/products/' + newId, 'PUT', { price: 4500, stock: 8 }, token);
  console.log('[9] Update product:', r.status, 'price=', r.body.price, 'stock=', r.body.stock);

  // 10. Delete product
  r = await req('/api/products/' + newId, 'DELETE', null, token);
  console.log('[10] Delete product:', r.status, JSON.stringify(r.body));

  // 11. Orders stats
  r = await req('/api/orders/stats', 'GET', null, token);
  console.log('[11] Order stats:', r.status, JSON.stringify(r.body));

  // 12. Create product without auth (expect 401)
  r = await req('/api/products', 'POST', { name: 'Hack', brand: 'X', category: 'Y', price: 1, stock: 1 });
  console.log('[12] Create product no-auth (expect 401):', r.status, r.body.error);

  // 13. Admin logout with wrong token
  r = await req('/api/admin/logout', 'POST', null, 'expiredtoken');
  console.log('[13] Logout bad-token (expect 401):', r.status, r.body.error);

  console.log('\n=== TESTS COMPLETE ===');
}

runTests().catch(console.error);
