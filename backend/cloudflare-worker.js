/**
 * 100% Pure Cloudflare Worker Full-Stack Handler
 * Serves API endpoints + static frontend assets through Cloudflare Edge
 */

// In-Worker persistent store (Cloudflare global memory / KV fallback)
let inMemoryStore = {
  settings: {
    siteTitle: 'Dialog Reload Hub - Sri Lanka',
    contactWhatsApp: '+94720346443',
    bankAccounts: [
      { id: 'bank-1', bankName: 'Commercial Bank', accountName: 'DIALOG RELOAD HUB', accountNumber: '800912345678', branch: 'Colombo 03' },
      { id: 'bank-2', bankName: 'BOC (Bank of Ceylon)', accountName: 'DIALOG RELOAD HUB', accountNumber: '009876543210', branch: 'City Office' },
      { id: 'bank-3', bankName: 'Sampath Bank', accountName: 'DIALOG RELOAD HUB', accountNumber: '109823456789', branch: 'Kandy' }
    ],
    ezCashNumber: '-',
    discountRules: { tier1Threshold: 5000, tier1DiscountPercent: 15, tier2DiscountPercent: 40 },
    noticeBanner: '🎉 දැවැන්ත වට්ටම්: Dialog රිලෝඩ් වලට 40%ක්, Hutch / EzCash / CEB බිල්පත් (5000+) සඳහා 10%ක වට්ටමක්!',
    whatsappGroupId: '120363410663305077@g.us'
  },
  packages: [
    { id: 'pkg-dlg-1', serviceType: 'DIALOG', name: 'Dialog Quick Starter', category: 'Dialog Reload', amount: 100, description: 'Prepaid instant call & SMS reload', popular: false, badge: '15% OFF', active: true },
    { id: 'pkg-dlg-2', serviceType: 'DIALOG', name: 'Dialog Standard Max', category: 'Dialog Reload', amount: 1000, description: '🌟 Standard tier උපරිම පැකේජය (Pay Rs. 850)', popular: true, badge: '15% OFF', active: true },
    { id: 'pkg-dlg-3', serviceType: 'DIALOG', name: 'Dialog Mega Saver 5000', category: 'Dialog Bulk', amount: 5000, description: '🔥 රු. 5,000ක් ලබාගෙන රු. 3,000ක් පමණක් ගෙවන්න! (රු. 2,000ක් ඉතිරියි)', popular: true, badge: '40% MEGA OFF', active: true },
    { id: 'pkg-dlg-4', serviceType: 'DIALOG', name: 'Dialog Ultimate Saver 10000', category: 'Dialog Bulk', amount: 10000, description: '🔥 රු. 10,000ක් ලබාගෙන රු. 6,000ක් පමණක් ගෙවන්න! (රු. 4,000ක් ඉතිරියි)', popular: true, badge: '40% MEGA OFF', active: true },
    { id: 'pkg-htc-1', serviceType: 'HUTCH', name: 'Hutch 4G Super Pack 5000', category: 'Hutch Reload', amount: 5000, description: '📶 Hutch රු. 5,000 Reload සඳහා 10%ක වට්ටමක්', popular: true, badge: '10% OFF', active: true },
    { id: 'pkg-htc-2', serviceType: 'HUTCH', name: 'Hutch 4G Mega Pack 10000', category: 'Hutch Reload', amount: 10000, description: '📶 Hutch රු. 10,000 Reload සඳහා 10%ක වට්ටමක්', popular: true, badge: '10% OFF', active: true },
    { id: 'pkg-ez-1', serviceType: 'EZCASH', name: 'EzCash Top-Up 5000', category: 'EzCash Wallet', amount: 5000, description: '💳 රු. 5,000 EzCash Wallet එකට ලබාගන්න', popular: true, badge: '10% OFF', active: true },
    { id: 'pkg-ez-2', serviceType: 'EZCASH', name: 'EzCash Top-Up 10000', category: 'EzCash Wallet', amount: 10000, description: '💳 රු. 10,000 EzCash Wallet එකට ලබාගන්න', popular: true, badge: '10% OFF', active: true },
    { id: 'pkg-ceb-1', serviceType: 'CEB', name: 'CEB Electricity Bill 5000', category: 'Electricity Bill', amount: 5000, description: '💡 රු. 5,000 විදුලි බිල ගෙවන්න (10% OFF)', popular: true, badge: '10% OFF', active: true },
    { id: 'pkg-ceb-2', serviceType: 'CEB', name: 'CEB Electricity Bill 10000', category: 'Electricity Bill', amount: 10000, description: '💡 රු. 10,000 විදුලි බිල ගෙවන්න (10% OFF)', popular: true, badge: '10% OFF', active: true }
  ],
  orders: []
};

// Calculate Discount Helper
function calculateDiscount(amount, serviceType = 'DIALOG', connectionType = 'MOBILE') {
  const numericAmount = parseFloat(amount);
  const service = (serviceType || 'DIALOG').toUpperCase();
  const conn = (connectionType || 'MOBILE').toUpperCase();

  if (isNaN(numericAmount) || numericAmount <= 0) {
    return { isValid: false, error: 'වලංගු මුදලක් ඇතුළත් කරන්න' };
  }

  if (service === 'DIALOG') {
    if (numericAmount > 1000 && numericAmount < 5000) {
      return { isValid: false, error: 'Dialog රු. 5,000ට අඩු රිලෝඩ් සඳහා උපරිමය රු. 1,000 කි. රු. 5,000ක් තෝරා 40%ක වට්ටම ලබාගන්න!' };
    }
    const discountPercentage = numericAmount >= 5000 ? 40 : 15;
    const discountAmount = Math.round(numericAmount * (discountPercentage / 100) * 100) / 100;
    return {
      isValid: true,
      serviceType: service,
      originalAmount: numericAmount,
      discountPercentage,
      discountAmount,
      finalAmount: Math.round((numericAmount - discountAmount) * 100) / 100,
      savedAmount: discountAmount
    };
  }

  // Hutch, EzCash, CEB: strictly >= 5000 (10% discount)
  if (numericAmount < 5000) {
    return { isValid: false, error: `${service} සඳහා අවම මුදල රු. 5,000 කි (10% වට්ටමක් හිමිවේ).` };
  }

  const discountAmount = Math.round(numericAmount * 0.10 * 100) / 100;
  return {
    isValid: true,
    serviceType: service,
    originalAmount: numericAmount,
    discountPercentage: 10,
    discountAmount,
    finalAmount: Math.round((numericAmount - discountAmount) * 100) / 100,
    savedAmount: discountAmount
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // ==========================================
    // API ROUTES
    // ==========================================
    if (path.startsWith('/api/')) {
      try {
        // 1. Calculate
        if (path === '/api/calculate' && method === 'POST') {
          const body = await request.json();
          const res = calculateDiscount(body.amount, body.serviceType, body.connectionType);
          return jsonResponse({ success: res.isValid, data: res, message: res.error }, res.isValid ? 200 : 400);
        }

        // 2. Validate Number
        if (path === '/api/validate-number' && method === 'POST') {
          const body = await request.json();
          const clean = (body.phoneNumber || '').replace(/[^0-9]/g, '');
          const isValid = clean.length >= 9;
          return jsonResponse({
            success: isValid,
            data: { isValid, formattedNumber: clean, operator: body.serviceType || 'Dialog' }
          });
        }

        // 3. Public Settings
        if (path === '/api/settings/public' && method === 'GET') {
          return jsonResponse({ success: true, data: inMemoryStore.settings });
        }

        // 4. Packages
        if (path === '/api/packages' && method === 'GET') {
          const serviceQuery = url.searchParams.get('service') || 'ALL';
          let pkgs = inMemoryStore.packages.filter(p => p.active !== false);
          if (serviceQuery !== 'ALL') {
            pkgs = pkgs.filter(p => p.serviceType === serviceQuery);
          }
          const enriched = pkgs.map(p => {
            const calc = calculateDiscount(p.amount, p.serviceType);
            return {
              ...p,
              discountPercentage: calc.discountPercentage,
              discountAmount: calc.discountAmount,
              finalAmount: calc.finalAmount
            };
          });
          return jsonResponse({ success: true, data: enriched });
        }

        // 5. Create Order
        if (path === '/api/orders' && method === 'POST') {
          const body = await request.json();
          const calc = calculateDiscount(body.amount, body.serviceType, body.dialogConnectionType);
          if (!calc.isValid) {
            return jsonResponse({ success: false, message: calc.error }, 400);
          }

          const refNum = Math.floor(10000 + Math.random() * 90000);
          const prefix = (body.serviceType === 'CEB' ? 'CEB' : (body.serviceType === 'HUTCH' ? 'HTC' : (body.serviceType === 'EZCASH' ? 'EZC' : 'DLG')));
          const orderRef = `${prefix}-${refNum}`;

          const newOrder = {
            id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            orderReference: orderRef,
            serviceType: body.serviceType || 'DIALOG',
            dialogConnectionType: body.dialogConnectionType || 'Mobile',
            dialogNumber: body.dialogNumber,
            accountHolderName: body.accountHolderName || '',
            reloadType: body.reloadType || 'Prepaid',
            originalAmount: calc.originalAmount,
            discountPercentage: calc.discountPercentage,
            discountAmount: calc.discountAmount,
            finalAmount: calc.finalAmount,
            customerName: body.customerName || 'Valued Customer',
            customerPhone: body.customerPhone || body.dialogNumber,
            customerWhatsApp: body.customerWhatsApp || body.dialogNumber,
            paymentMethod: body.paymentMethod || 'Bank Transfer',
            paymentReference: body.paymentReference || '',
            paymentSlipUrl: body.paymentSlipUrl || '',
            status: 'REQUESTED',
            createdAt: new Date().toISOString()
          };

          inMemoryStore.orders.unshift(newOrder);

          return jsonResponse({ success: true, message: 'ඇණවුම සාර්ථකව ලැබුණි!', data: newOrder }, 201);
        }

        // 6. Track Order
        if (path.startsWith('/api/orders/track/')) {
          const ref = decodeURIComponent(path.replace('/api/orders/track/', '').replace('/upload-slip', ''));
          
          // Slip upload
          if (path.endsWith('/upload-slip') && method === 'POST') {
            const body = await request.json();
            const order = inMemoryStore.orders.find(o => o.orderReference === ref || o.id === ref);
            if (order) {
              if (body.paymentSlipUrl) order.paymentSlipUrl = body.paymentSlipUrl;
              if (body.paymentReference) order.paymentReference = body.paymentReference;
              order.status = 'PAYMENT_SUBMITTED';
              return jsonResponse({ success: true, message: 'Slip uploaded successfully', data: order });
            }
            return jsonResponse({ success: false, message: 'Order not found' }, 404);
          }

          // Search order
          const found = inMemoryStore.orders.find(o => o.orderReference.toLowerCase() === ref.toLowerCase() || o.dialogNumber === ref);
          if (found) {
            return jsonResponse({ success: true, data: found });
          }
          return jsonResponse({ success: false, message: 'මෙම අංකයට අදාළ ඇණවුමක් හමු නොවීය' }, 404);
        }

        // 7. Admin Login
        if (path === '/api/admin/login' && method === 'POST') {
          const body = await request.json();
          if (body.username === (env.ADMIN_USERNAME || 'admin') && body.password === (env.ADMIN_PASSWORD || 'admin123')) {
            return jsonResponse({
              success: true,
              token: 'cf_edge_token_' + Date.now(),
              user: { username: 'admin', role: 'admin' }
            });
          }
          return jsonResponse({ success: false, message: 'පරිශීලක නාමය හෝ මුරපදය වැරදියි' }, 401);
        }

        // 8. Admin Orders & Stats
        if (path === '/api/admin/orders' && method === 'GET') {
          return jsonResponse({
            success: true,
            data: inMemoryStore.orders,
            total: inMemoryStore.orders.length
          });
        }

        if (path === '/api/admin/stats' && method === 'GET') {
          const orders = inMemoryStore.orders;
          const completed = orders.filter(o => o.status === 'COMPLETED');
          const totalRevenue = completed.reduce((sum, o) => sum + (o.finalAmount || 0), 0);
          const totalSaved = completed.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
          return jsonResponse({
            success: true,
            data: {
              totalOrders: orders.length,
              pendingOrders: orders.filter(o => o.status === 'REQUESTED' || o.status === 'READY_FOR_PAYMENT').length,
              completedOrders: completed.length,
              totalRevenue,
              totalSavingsDelivered: totalSaved
            }
          });
        }

        // 9. Admin Status Update
        if (path.startsWith('/api/admin/orders/') && path.endsWith('/status') && method === 'PATCH') {
          const orderId = path.split('/')[4];
          const body = await request.json();
          const order = inMemoryStore.orders.find(o => o.id === orderId || o.orderReference === orderId);
          if (order) {
            if (body.status) order.status = body.status;
            if (body.adminNotes) order.adminNotes = body.adminNotes;
            if (body.proofImageUrl) order.proofImageUrl = body.proofImageUrl;
            if (body.estimatedTime) order.estimatedTime = body.estimatedTime;
            return jsonResponse({ success: true, message: 'Status updated', data: order });
          }
          return jsonResponse({ success: false, message: 'Order not found' }, 404);
        }

        // 10. Admin Settings
        if (path === '/api/admin/settings') {
          if (method === 'GET') return jsonResponse({ success: true, data: inMemoryStore.settings });
          if (method === 'PUT') {
            const body = await request.json();
            inMemoryStore.settings = { ...inMemoryStore.settings, ...body };
            return jsonResponse({ success: true, data: inMemoryStore.settings });
          }
        }

        // 11. WhatsApp status mock
        if (path.startsWith('/api/admin/whatsapp/')) {
          return jsonResponse({
            success: true,
            data: { isConnected: true, connectedPhone: '+94720346443', groupName: 'SL Reload Hub Orders' }
          });
        }

        return jsonResponse({ success: false, message: 'API Route Not Found' }, 404);
      } catch (err) {
        return jsonResponse({ success: false, message: err.message }, 500);
      }
    }

    // ==========================================
    // STATIC ASSETS (Frontend SPA)
    // ==========================================
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Frontend build assets not found.', { status: 404 });
  }
};
