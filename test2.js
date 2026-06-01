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
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, body: b.slice(0,100) }); }
      });
    });
    r.on('error', e => resolve({ error: e.message }));
    if (data) r.write(data);
    r.end();
  });
}

async function runTests() {
  // 1. Login to get token
  let r = await req('/api/admin/login', 'POST', { email: 'admin@sellbazar.com', password: 'Admin@1234' });
  const token = r.body.token;
  console.log('[LOGIN] status:', r.status, 'token length:', token ? token.length : 0);

  // 2. Test orders WITH valid token
  r = await req('/api/orders', 'GET', null, token);
  console.log('[ORDERS WITH TOKEN] status:', r.status, 'total:', r.body.total);

  // 3. Test orders WITHOUT any token 
  r = await req('/api/orders', 'GET', null, null);
  console.log('[ORDERS NO TOKEN] status:', r.status, 'error:', r.body.error || JSON.stringify(r.body).slice(0,80));

  // 4. Test orders with INVALID token
  r = await req('/api/orders', 'GET', null, 'invalid.jwt.token');
  console.log('[ORDERS INVALID TOKEN] status:', r.status, 'error:', r.body.error || JSON.stringify(r.body).slice(0,80));

  // 5. Test orders/stats route - should NOT be captured by /:id
  r = await req('/api/orders/stats', 'GET', null, token);
  console.log('[ORDERS/STATS] status:', r.status, 'body:', JSON.stringify(r.body).slice(0,120));

  // 6. Test order by real ID
  r = await req('/api/orders/SB-240001', 'GET', null, token);
  console.log('[ORDER BY ID] status:', r.status, 'id:', r.body.id, 'customer:', r.body.customer?.name);

  // 7. Products without auth (create)
  r = await req('/api/products', 'POST', {name:'Hack',brand:'X',category:'Y',price:1,stock:1}, null);
  console.log('[CREATE PRODUCT NO AUTH] status:', r.status, 'error:', r.body.error);

  // 8. Delete product without auth
  r = await req('/api/products/1', 'DELETE', null, null);
  console.log('[DELETE PRODUCT NO AUTH] status:', r.status, 'error:', r.body.error);

  // 9. Hardcoded secret check - decode token to see expiry
  if (token) {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('[TOKEN PAYLOAD] iat:', payload.iat, 'exp:', payload.exp, 'expires in h:', Math.round((payload.exp - Date.now()/1000)/3600));
  }

  console.log('\nDONE');
}

runTests().catch(console.error);
