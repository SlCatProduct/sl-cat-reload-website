const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default state with multi-service support
const defaultState = {
  users: [
    {
      id: 'admin-1',
      username: 'admin',
      passwordHash: '$2a$10$wE8Pq4VzPjVevzC6p47D7uE2yFh.u0qT1XN9Pfq2eLh53yKxN/9.C',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ],
  settings: {
    siteTitle: 'SL Mega Recharge & Bill Hub',
    contactWhatsApp: '+94771234567',
    bankAccounts: [
      {
        id: 'bank-1',
        bankName: 'Commercial Bank',
        accountName: 'RELOAD & BILL HUB',
        accountNumber: '800912345678',
        branch: 'Colombo 03'
      },
      {
        id: 'bank-2',
        bankName: 'BOC (Bank of Ceylon)',
        accountName: 'RELOAD & BILL HUB',
        accountNumber: '009876543210',
        branch: 'City Office'
      },
      {
        id: 'bank-3',
        bankName: 'Sampath Bank',
        accountName: 'RELOAD & BILL HUB',
        accountNumber: '109823456789',
        branch: 'Kandy'
      }
    ],
    ezCashNumber: '0771234567',
    whatsappGroupWebhookUrl: '',
    whatsappGroupId: 'admin-orders-group',
    whatsappGroupLink: 'https://chat.whatsapp.com/sample-admin-group',
    whatsappApiToken: '',
    autoNotifyAdminGroup: true,
    discountRules: {
      dialogTier1: 15,
      dialogTier2: 40,
      hutchTier2: 10,
      ezcashTier2: 10,
      cebTier2: 10
    },
    noticeBanner: '🎉 දැවැන්ත වට්ටම්: Dialog රිලෝඩ් වලට 40%ක්, Hutch / EzCash / CEB බිල්පත් (5000+) සඳහා 10%ක වට්ටමක්!'
  },
  packages: [
    // Dialog Packages
    {
      id: 'pkg-dlg-1',
      serviceType: 'DIALOG',
      name: 'Dialog Quick Starter',
      category: 'Dialog Reload',
      amount: 100,
      description: 'Prepaid instant call & SMS reload',
      popular: false,
      badge: '15% OFF',
      active: true
    },
    {
      id: 'pkg-dlg-2',
      serviceType: 'DIALOG',
      name: 'Dialog Standard Max',
      category: 'Dialog Reload',
      amount: 1000,
      description: '🌟 Standard tier උපරිම පැකේජය (Pay Rs. 850)',
      popular: true,
      badge: '15% OFF',
      active: true
    },
    {
      id: 'pkg-dlg-3',
      serviceType: 'DIALOG',
      name: 'Dialog Mega Saver 5000',
      category: 'Dialog Bulk',
      amount: 5000,
      description: '🔥 රු. 5,000ක් ලබාගෙන රු. 3,000ක් පමණක් ගෙවන්න! (රු. 2,000ක් ඉතිරියි)',
      popular: true,
      badge: '40% MEGA OFF',
      active: true
    },
    {
      id: 'pkg-dlg-4',
      serviceType: 'DIALOG',
      name: 'Dialog Ultimate Saver 10000',
      category: 'Dialog Bulk',
      amount: 10000,
      description: '🔥 රු. 10,000ක් ලබාගෙන රු. 6,000ක් පමණක් ගෙවන්න! (රු. 4,000ක් ඉතිරියි)',
      popular: true,
      badge: '40% MEGA OFF',
      active: true
    },

    // Hutch Packages
    {
      id: 'pkg-htc-1',
      serviceType: 'HUTCH',
      name: 'Hutch 4G Super Pack 5000',
      category: 'Hutch Reload',
      amount: 5000,
      description: '📶 Hutch රු. 5,000 Reload සඳහා 10%ක වට්ටමක් (ගෙවන්නේ රු. 4,500යි)',
      popular: true,
      badge: '10% OFF',
      active: true
    },
    {
      id: 'pkg-htc-2',
      serviceType: 'HUTCH',
      name: 'Hutch 4G Mega Pack 10000',
      category: 'Hutch Reload',
      amount: 10000,
      description: '📶 Hutch රු. 10,000 Reload සඳහා 10%ක වට්ටමක් (ගෙවන්නේ රු. 9,000යි)',
      popular: true,
      badge: '10% OFF',
      active: true
    },

    // EzCash Packages
    {
      id: 'pkg-ez-1',
      serviceType: 'EZCASH',
      name: 'EzCash Top-Up 5000',
      category: 'EzCash Wallet',
      amount: 5000,
      description: '💳 රු. 5,000 EzCash Wallet එකට ලබාගන්න (ගෙවන්නේ රු. 4,500යි)',
      popular: true,
      badge: '10% OFF',
      active: true
    },
    {
      id: 'pkg-ez-2',
      serviceType: 'EZCASH',
      name: 'EzCash Top-Up 10000',
      category: 'EzCash Wallet',
      amount: 10000,
      description: '💳 රු. 10,000 EzCash Wallet එකට ලබාගන්න (ගෙවන්නේ රු. 9,000යි)',
      popular: true,
      badge: '10% OFF',
      active: true
    },

    // CEB Electricity Bill Packages
    {
      id: 'pkg-ceb-1',
      serviceType: 'CEB',
      name: 'CEB Electricity Bill 5000',
      category: 'Electricity Bill',
      amount: 5000,
      description: '💡 රු. 5,000 විදුලි බිල ගෙවන්න (ගෙවන්නේ රු. 4,500යි - රු. 500ක් ලාභයි!)',
      popular: true,
      badge: '10% OFF',
      active: true
    },
    {
      id: 'pkg-ceb-2',
      serviceType: 'CEB',
      name: 'CEB Electricity Bill 10000',
      category: 'Electricity Bill',
      amount: 10000,
      description: '💡 රු. 10,000 විදුලි බිල ගෙවන්න (ගෙවන්නේ රු. 9,000යි - රු. 1,000ක් ලාභයි!)',
      popular: true,
      badge: '10% OFF',
      active: true
    }
  ],
  orders: []
};

// Helper to read data
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const salt = bcrypt.genSaltSync(10);
      defaultState.users[0].passwordHash = bcrypt.hashSync('admin123', salt);
      fs.writeFileSync(DATA_FILE, JSON.stringify(defaultState, null, 2), 'utf8');
      return defaultState;
    }
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(content);

    // If existing store doesn't have multi-service packages, upgrade it
    const hasCeb = parsed.packages?.some(p => p.serviceType === 'CEB');
    if (!hasCeb) {
      parsed.packages = defaultState.packages;
      parsed.settings.noticeBanner = defaultState.settings.noticeBanner;
      writeData(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Error reading storage JSON, resetting with default data:', err.message);
    return defaultState;
  }
}

// Helper to write data
function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing storage JSON:', err.message);
    return false;
  }
}

// Initialize on load
readData();

class StorageService {
  static async getOrders(filters = {}) {
    const data = readData();
    let orders = data.orders || [];

    if (filters.status && filters.status !== 'ALL') {
      orders = orders.filter(o => o.status === filters.status);
    }
    if (filters.service && filters.service !== 'ALL') {
      orders = orders.filter(o => (o.serviceType || 'DIALOG').toUpperCase() === filters.service.toUpperCase());
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      orders = orders.filter(o => 
        (o.orderReference && o.orderReference.toLowerCase().includes(search)) ||
        (o.dialogNumber && o.dialogNumber.includes(search)) ||
        (o.customerName && o.customerName.toLowerCase().includes(search)) ||
        (o.customerPhone && o.customerPhone.includes(search)) ||
        (o.serviceType && o.serviceType.toLowerCase().includes(search))
      );
    }

    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return orders;
  }

  static async getOrderByReference(refOrPhone) {
    const data = readData();
    const cleanRef = refOrPhone.trim().toUpperCase();
    const cleanPhone = refOrPhone.trim();

    return (data.orders || []).find(o => 
      o.orderReference.toUpperCase() === cleanRef || 
      o.dialogNumber === cleanPhone ||
      o.customerPhone === cleanPhone
    );
  }

  static async createOrder(orderPayload) {
    const data = readData();
    
    const service = (orderPayload.serviceType || 'DIALOG').toUpperCase();
    const prefix = service === 'CEB' ? 'CEB' : (service === 'HUTCH' ? 'HTC' : (service === 'EZCASH' ? 'EZC' : 'DLG'));
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const orderReference = `${prefix}-${randomDigits}`;

    const hasSlipOrRef = Boolean(orderPayload.paymentSlipUrl || (orderPayload.paymentReference && orderPayload.paymentReference.trim().length > 0));
    const initialStatus = orderPayload.status || (hasSlipOrRef ? 'PAYMENT_SUBMITTED' : 'REQUESTED');

    const newOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      orderReference,
      serviceType: service,
      dialogNumber: orderPayload.dialogNumber, // target phone or CEB account
      dialogConnectionType: orderPayload.dialogConnectionType || 'Mobile',
      accountHolderName: orderPayload.accountHolderName || '',
      reloadType: orderPayload.reloadType || 'Prepaid',
      originalAmount: parseFloat(orderPayload.originalAmount),
      discountPercentage: parseInt(orderPayload.discountPercentage, 10),
      discountAmount: parseFloat(orderPayload.discountAmount),
      finalAmount: parseFloat(orderPayload.finalAmount),
      customerName: orderPayload.customerName || 'Customer',
      customerPhone: orderPayload.customerPhone || orderPayload.dialogNumber,
      customerWhatsApp: orderPayload.customerWhatsApp || orderPayload.customerPhone || orderPayload.dialogNumber,
      paymentMethod: orderPayload.paymentMethod || 'Bank Transfer',
      bankSelected: orderPayload.bankSelected || '',
      paymentReference: orderPayload.paymentReference || '',
      paymentSlipUrl: orderPayload.paymentSlipUrl || '',
      proofImageUrl: orderPayload.proofImageUrl || '',
      estimatedTime: orderPayload.estimatedTime || '',
      customerMessageKey: orderPayload.customerMessageKey || null,
      customerMessageId: orderPayload.customerMessageId || null,
      status: initialStatus,
      adminNotes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.orders.push(newOrder);
    writeData(data);
    return newOrder;
  }

  static async updateOrderStatus(id, status, adminNotes = '', proofImageUrl = null, estimatedTime = null) {
    const data = readData();
    const index = data.orders.findIndex(o => o.id === id || o.orderReference === id);
    
    if (index === -1) {
      return null;
    }

    data.orders[index].status = status;
    if (adminNotes !== undefined && adminNotes !== null) {
      data.orders[index].adminNotes = adminNotes;
    }
    if (proofImageUrl !== undefined && proofImageUrl !== null) {
      data.orders[index].proofImageUrl = proofImageUrl;
    }
    if (estimatedTime !== undefined && estimatedTime !== null) {
      data.orders[index].estimatedTime = estimatedTime;
    }
    data.orders[index].updatedAt = new Date().toISOString();

    writeData(data);
    return data.orders[index];
  }

  static async attachPaymentSlip(idOrRef, { paymentSlipUrl, paymentReference, bankSelected }) {
    const data = readData();
    const index = data.orders.findIndex(o => o.id === idOrRef || o.orderReference === idOrRef);
    
    if (index === -1) {
      return null;
    }

    if (paymentSlipUrl) data.orders[index].paymentSlipUrl = paymentSlipUrl;
    if (paymentReference) data.orders[index].paymentReference = paymentReference;
    if (bankSelected) data.orders[index].bankSelected = bankSelected;
    data.orders[index].status = 'PAYMENT_SUBMITTED';
    data.orders[index].updatedAt = new Date().toISOString();

    writeData(data);
    return data.orders[index];
  }

  static async getPackages() {
    const data = readData();
    return data.packages || [];
  }

  static async addPackage(pkg) {
    const data = readData();
    const amount = parseFloat(pkg.amount);
    const serviceType = (pkg.serviceType || 'DIALOG').toUpperCase();
    
    let badge = '15% OFF';
    if (serviceType === 'DIALOG') {
      badge = amount >= 5000 ? '40% MEGA OFF' : '15% OFF';
    } else {
      badge = amount >= 5000 ? '10% OFF' : '5% OFF';
    }

    const newPkg = {
      id: `pkg-${Date.now()}`,
      serviceType,
      name: pkg.name,
      category: pkg.category || `${serviceType} Pack`,
      amount,
      description: pkg.description || '',
      popular: Boolean(pkg.popular),
      badge,
      active: pkg.active !== undefined ? Boolean(pkg.active) : true
    };
    data.packages.push(newPkg);
    writeData(data);
    return newPkg;
  }

  static async updatePackage(id, updates) {
    const data = readData();
    const index = data.packages.findIndex(p => p.id === id);
    if (index === -1) return null;

    const newAmount = updates.amount ? parseFloat(updates.amount) : data.packages[index].amount;
    const serviceType = updates.serviceType || data.packages[index].serviceType || 'DIALOG';
    
    let badge = '15% OFF';
    if (serviceType === 'DIALOG') {
      badge = newAmount >= 5000 ? '40% MEGA OFF' : '15% OFF';
    } else {
      badge = newAmount >= 5000 ? '10% OFF' : '5% OFF';
    }

    data.packages[index] = {
      ...data.packages[index],
      ...updates,
      serviceType,
      amount: newAmount,
      badge
    };

    writeData(data);
    return data.packages[index];
  }

  static async deletePackage(id) {
    const data = readData();
    const initialLen = data.packages.length;
    data.packages = data.packages.filter(p => p.id !== id);
    writeData(data);
    return data.packages.length < initialLen;
  }

  static async getSettings() {
    const data = readData();
    return data.settings || defaultState.settings;
  }

  static async updateSettings(updates) {
    const data = readData();
    data.settings = {
      ...data.settings,
      ...updates
    };
    writeData(data);
    return data.settings;
  }

  static async findAdminByUsername(username) {
    const data = readData();
    return data.users.find(u => u.username === username);
  }

  static async changeAdminPassword(username, newPassword) {
    const data = readData();
    const user = data.users.find(u => u.username === username);
    if (!user) return false;

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    writeData(data);
    return true;
  }

  static async getStats() {
    const data = readData();
    const orders = data.orders || [];

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
    const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
    const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
    const rejectedOrders = orders.filter(o => o.status === 'REJECTED').length;

    const totalRevenue = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.finalAmount || 0), 0);

    const totalOriginalSales = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.originalAmount || 0), 0);

    const totalDiscountsGiven = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + (o.discountAmount || 0), 0);

    return {
      totalOrders,
      pendingOrders,
      processingOrders,
      completedOrders,
      rejectedOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOriginalSales: Math.round(totalOriginalSales * 100) / 100,
      totalDiscountsGiven: Math.round(totalDiscountsGiven * 100) / 100,
      recentOrders: orders.slice(0, 10)
    };
  }
}

module.exports = StorageService;
