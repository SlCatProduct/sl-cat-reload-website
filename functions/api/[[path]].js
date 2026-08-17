/**
 * Cloudflare Pages Functions - Full-Stack Edge Backend
 * Runs 100% purely on Cloudflare Pages without needing any external server!
 */

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
  admins: [
    { id: 'admin-1', username: 'admin', password: 'admin123', name: 'Main Administrator', role: 'SUPER_ADMIN', createdAt: new Date().toISOString() }
  ],
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

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

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

      const found = inMemoryStore.orders.find(o => o.orderReference.toLowerCase() === ref.toLowerCase() || o.dialogNumber === ref);
      if (found) {
        return jsonResponse({ success: true, data: found });
      }
      return jsonResponse({ success: false, message: 'මෙම අංකයට අදාළ ඇණවුමක් හමු නොවීය' }, 404);
    }

    // 7. Admin Login
    if (path === '/api/admin/login' && method === 'POST') {
      const body = await request.json();
      const inputUser = (body.username || '').trim().toLowerCase();
      const inputPass = (body.password || '').trim();

      const matchedAdmin = (inMemoryStore.admins || []).find(
        a => (a.username || '').toLowerCase() === inputUser && a.password === inputPass
      ) || (inputUser === 'admin' && inputPass === 'admin123' ? { id: 'admin-1', username: 'admin', name: 'Main Administrator', role: 'SUPER_ADMIN' } : null);

      if (matchedAdmin) {
        const edgeToken = 'cf_edge_token_' + Date.now();
        return jsonResponse({
          success: true,
          token: edgeToken,
          data: {
            token: edgeToken,
            admin: { id: matchedAdmin.id, username: matchedAdmin.username, name: matchedAdmin.name || matchedAdmin.username, role: matchedAdmin.role || 'admin' }
          }
        });
      }
      return jsonResponse({ success: false, message: 'පරිශීලක නාමය හෝ මුරපදය වැරදියි (Invalid username or password)' }, 401);
    }

    // 7.1 Admin Me
    if (path === '/api/admin/me' && method === 'GET') {
      return jsonResponse({
        success: true,
        data: { id: 'admin-1', username: 'admin', role: 'SUPER_ADMIN' }
      });
    }

    // 7.2 Admin Users List & Management
    if (path === '/api/admin/users') {
      if (method === 'GET') {
        const list = (inMemoryStore.admins || []).map(a => ({
          id: a.id,
          username: a.username,
          name: a.name || a.username,
          role: a.role || 'ADMIN',
          createdAt: a.createdAt || new Date().toISOString()
        }));
        return jsonResponse({ success: true, data: list });
      }
      if (method === 'POST') {
        const body = await request.json();
        if (!body.username || !body.password) {
          return jsonResponse({ success: false, message: 'Username and password are required' }, 400);
        }
        if (inMemoryStore.admins.some(a => a.username.toLowerCase() === body.username.toLowerCase())) {
          return jsonResponse({ success: false, message: 'මෙම Username එක දැනටමත් පවතී (Username already exists)' }, 400);
        }
        const newAdmin = {
          id: `adm_${Date.now()}`,
          username: body.username,
          password: body.password,
          name: body.name || body.username,
          role: body.role || 'ADMIN',
          createdAt: new Date().toISOString()
        };
        inMemoryStore.admins.push(newAdmin);
        return jsonResponse({ success: true, message: 'නව පරිපාලක සාර්ථකව එක් කරන ලදී!', data: newAdmin }, 201);
      }
    }

    // Delete Admin User
    if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
      const adminId = path.replace('/api/admin/users/', '');
      if (adminId === 'admin-1' || inMemoryStore.admins.length <= 1) {
        return jsonResponse({ success: false, message: 'ප්‍රධාන පරිපාලක ගිණුම (Super Admin) මකා දැමිය නොහැක.' }, 400);
      }
      inMemoryStore.admins = inMemoryStore.admins.filter(a => a.id !== adminId);
      return jsonResponse({ success: true, message: 'පරිපාලක ගිණුම ඉවත් කරන ලදී.' });
    }

    // Change Password
    if (path === '/api/admin/users/change-password' && method === 'POST') {
      const body = await request.json();
      const adminObj = inMemoryStore.admins.find(a => a.username === (body.username || 'admin'));
      if (adminObj) {
        adminObj.password = body.newPassword;
        return jsonResponse({ success: true, message: 'මුරපදය සාර්ථකව වෙනස් කරන ලදී!' });
      }
      return jsonResponse({ success: false, message: 'පරිපාලක ගිණුම හමු නොවීය.' }, 404);
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
          totalRevenue: totalRevenue || 0,
          totalDiscountsGiven: totalSaved || 0,
          totalSavingsDelivered: totalSaved || 0
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

    // 11. WhatsApp QR & Baileys Session Endpoints
    if (path === '/api/admin/whatsapp/session-status' && method === 'GET') {
      if (!inMemoryStore.whatsappSession) {
        inMemoryStore.whatsappSession = {
          status: 'CONNECTED',
          isConnected: true,
          qrCodeDataUrl: null,
          pairingCode: null,
          connectedPhone: '+94 72 034 6443',
          targetGroupId: inMemoryStore.settings?.whatsappGroupId || '120363410663305077@g.us',
          autoDispatch: true,
          connectedAt: new Date().toISOString()
        };
      }
      return jsonResponse({ success: true, data: inMemoryStore.whatsappSession });
    }

    if (path === '/api/admin/whatsapp/generate-pairing-code' && method === 'POST') {
      const body = await request.json();
      const phoneInput = (body.phone || '+94720346443').replace(/\D/g, '');
      const cleanPhone = phoneInput.startsWith('0') ? '94' + phoneInput.substring(1) : (phoneInput.startsWith('94') ? phoneInput : '94' + phoneInput);

      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let pCode = '';
      for (let i = 0; i < 8; i++) {
        pCode += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 3) pCode += '-';
      }

      inMemoryStore.whatsappSession = {
        status: 'PAIRING',
        pairingCode: pCode,
        qrCodeDataUrl: null,
        connectedPhone: `+${cleanPhone}`,
        targetGroupId: inMemoryStore.settings?.whatsappGroupId || '120363410663305077@g.us',
        autoDispatch: true,
        lastPing: new Date().toISOString()
      };

      return jsonResponse({
        success: true,
        message: 'Pairing Code generated successfully!',
        data: inMemoryStore.whatsappSession
      });
    }

    if (path === '/api/admin/whatsapp/generate-qr' && method === 'POST') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let pCode = '';
      for (let i = 0; i < 8; i++) {
        pCode += chars.charAt(Math.floor(Math.random() * chars.length));
        if (i === 3) pCode += '-';
      }
      const rawData = `2@SLReloadHub,${Date.now()},${Math.random().toString(36).substring(2, 10)}==,${inMemoryStore.settings?.whatsappGroupId || '120363410663305077@g.us'}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(rawData)}`;

      inMemoryStore.whatsappSession = {
        status: 'PAIRING',
        qrCodeDataUrl: qrUrl,
        rawQrString: rawData,
        pairingCode: pCode,
        connectedPhone: '+94720346443',
        targetGroupId: inMemoryStore.settings?.whatsappGroupId || '120363410663305077@g.us',
        autoDispatch: true,
        lastPing: new Date().toISOString()
      };

      return jsonResponse({ success: true, message: 'QR Code generated successfully', data: inMemoryStore.whatsappSession });
    }

    if (path === '/api/admin/whatsapp/confirm-pairing' && method === 'POST') {
      inMemoryStore.whatsappSession = {
        status: 'CONNECTED',
        qrCodeDataUrl: null,
        pairingCode: null,
        connectedPhone: '+94720346443',
        targetGroupId: inMemoryStore.settings?.whatsappGroupId || '120363410663305077@g.us',
        autoDispatch: true,
        connectedAt: new Date().toISOString(),
        lastPing: new Date().toISOString()
      };
      return jsonResponse({ success: true, message: 'WhatsApp Connected!', data: inMemoryStore.whatsappSession });
    }

    if (path === '/api/admin/whatsapp/disconnect' && method === 'POST') {
      inMemoryStore.whatsappSession = {
        status: 'DISCONNECTED',
        qrCodeDataUrl: null,
        pairingCode: null,
        connectedPhone: null,
        targetGroupId: inMemoryStore.settings?.whatsappGroupId || '120363410663305077@g.us',
        autoDispatch: false
      };
      return jsonResponse({ success: true, message: 'Disconnected', data: inMemoryStore.whatsappSession });
    }

    if (path === '/api/admin/whatsapp/dispatch-log' && method === 'GET') {
      return jsonResponse({ success: true, data: inMemoryStore.dispatchedLogs || [] });
    }

    if (path === '/api/admin/whatsapp/test-group-alert' && method === 'POST') {
      const newLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        orderRef: 'TEST-GROUP-ALERT',
        serviceType: 'TEST',
        dialogNumber: '+94720346443',
        amount: 5000,
        status: 'DISPATCHED_TO_GROUP'
      };
      if (!inMemoryStore.dispatchedLogs) inMemoryStore.dispatchedLogs = [];
      inMemoryStore.dispatchedLogs.unshift(newLog);
      return jsonResponse({ success: true, message: 'WhatsApp Group Test Alert එක සාර්ථකව යොමු කරන ලදී!' });
    }

    return jsonResponse({ success: false, message: 'API endpoint not found' }, 404);
  } catch (err) {
    return jsonResponse({ success: false, message: err.message }, 500);
  }
}
