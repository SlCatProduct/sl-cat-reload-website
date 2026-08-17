import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  LogOut, 
  ShoppingBag, 
  Layers, 
  Settings, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RefreshCw,
  Eye,
  Send,
  Volume2,
  VolumeX,
  Smartphone,
  QrCode,
  Check,
  ExternalLink,
  Copy,
  Zap,
  Terminal
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../services/api';

export default function AdminPortal({ onClose }) {
  const [token, setToken] = useState(localStorage.getItem('dialog_admin_token') || '');
  const [adminUser, setAdminUser] = useState(null);
  
  // Login State
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Tabs: 'orders' | 'packages' | 'settings'
  const [activeTab, setActiveTab] = useState('orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Real-time polling & Audio Alert
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousPendingCountRef = useRef(0);

  // Status update modal & slip viewer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewSlipUrl, setViewSlipUrl] = useState(null);
  const [viewProofUrl, setViewProofUrl] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [proofImageBase64, setProofImageBase64] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('විනාඩි 5 - 15ක් ඇතුළත');

  // Quick Payment Request Modal
  const [paymentRequestModalOrder, setPaymentRequestModalOrder] = useState(null);
  const [reqEta, setReqEta] = useState('විනාඩි 5 - 10ක් ඇතුළත');
  const [reqNotes, setReqNotes] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  // Packages State
  const [packages, setPackages] = useState([]);
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgAmount, setNewPkgAmount] = useState('');
  const [newPkgCategory, setNewPkgCategory] = useState('Standard Reload');
  const [newPkgDesc, setNewPkgDesc] = useState('');

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    contactWhatsApp: '',
    ezCashNumber: '',
    noticeBanner: '',
    bankAccounts: []
  });
  const [settingsSaveMsg, setSettingsSaveMsg] = useState('');

  // Admin User Management State
  const [adminUsers, setAdminUsers] = useState([]);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [adminUserMsg, setAdminUserMsg] = useState('');
  const [newAdminLoading, setNewAdminLoading] = useState(false);
  const [changePwdVal, setChangePwdVal] = useState('');
  const [changePwdMsg, setChangePwdMsg] = useState('');

  // WhatsApp QR Web Linker State
  const [qrSession, setQrSession] = useState({
    status: 'DISCONNECTED',
    qrCodeDataUrl: null,
    pairingCode: null,
    connectedPhone: null,
    targetGroupId: '120363410663305077@g.us'
  });
  const [qrLoading, setQrLoading] = useState(false);
  const [qrPhoneInput, setQrPhoneInput] = useState('+94 77 123 4567');
  const [dispatchedLogs, setDispatchedLogs] = useState([]);
  const [copiedPairingCode, setCopiedPairingCode] = useState(false);
  const [qrViewMode, setQrViewMode] = useState('canvas'); // 'canvas' | 'terminal'
  const [asciiQrText, setAsciiQrText] = useState('');
  const qrCanvasRef = useRef(null);

  const fetchQrStatus = async () => {
    const res = await api.getWhatsAppSessionStatus();
    if (res?.success && res?.data) {
      setQrSession(res.data);
      if (res.data.rawQrString || res.data.qrCodeDataUrl) {
        generateQrFormats(res.data.rawQrString || res.data.qrCodeDataUrl);
      }
    }
  };

  const generateQrFormats = async (qrInput) => {
    if (!qrInput) return;
    try {
      // 1. Generate ASCII UTF8 Terminal Matrix
      const ascii = await QRCode.toString(qrInput, { type: 'utf8', errorCorrectionLevel: 'M', margin: 1 });
      setAsciiQrText(ascii);

      // 2. Render Native HTML5 Canvas
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, qrInput, {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      }
    } catch (e) {
      console.warn('[QR Render Error]', e);
    }
  };

  const fetchDispatchLogs = async () => {
    const res = await api.getWhatsAppDispatchLog();
    if (res?.success && res?.data) setDispatchedLogs(res.data);
  };

  const [pairingLoading, setPairingLoading] = useState(false);

  const handleGeneratePairingCode = async () => {
    setPairingLoading(true);
    const res = await api.generateWhatsAppPairingCode(qrPhoneInput || '+94720346443');
    setPairingLoading(false);
    if (res?.success && res?.data) {
      setQrSession(res.data);
    }
  };

  const handleGenerateQR = async () => {
    setQrLoading(true);
    const res = await api.generateWhatsAppQR(qrPhoneInput);
    setQrLoading(false);
    if (res?.success && res?.data) {
      setQrSession(res.data);
      generateQrFormats(res.data.rawQrString || res.data.qrCodeDataUrl);
    }
  };

  const handleConfirmPairing = async () => {
    const res = await api.confirmWhatsAppPairing(qrPhoneInput || '+94 77 123 4567');
    if (res?.success && res?.data) {
      setQrSession(res.data);
      fetchDispatchLogs();
    }
  };

  const handleDisconnectSession = async () => {
    const res = await api.disconnectWhatsAppSession();
    if (res?.success && res?.data) {
      setQrSession(res.data);
    }
  };

  // QR session live polling
  useEffect(() => {
    let qrTimer = null;
    if (token && activeTab === 'whatsapp') {
      fetchQrStatus();
      fetchDispatchLogs();
      qrTimer = setInterval(() => {
        fetchQrStatus();
        fetchDispatchLogs();
      }, 3000);
    }
    return () => {
      if (qrTimer) clearInterval(qrTimer);
    };
  }, [token, activeTab]);

  useEffect(() => {
    if (qrSession?.qrCodeDataUrl || qrSession?.rawQrString) {
      generateQrFormats(qrSession.rawQrString || qrSession.qrCodeDataUrl);
    }
  }, [qrSession, qrViewMode]);

  // Play audio notification ping
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  // Check auth session
  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  // Auto-refresh interval
  useEffect(() => {
    let interval = null;
    if (token && autoRefresh) {
      interval = setInterval(() => {
        fetchOrders(true);
        fetchStats();
      }, 10000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token, autoRefresh, orderStatusFilter, orderSearch]);

  const loadAdminData = async () => {
    try {
      const meRes = await api.getAdminMe();
      if (meRes.success && meRes.data) {
        setAdminUser(meRes.data);
      }
    } catch (e) {}
    fetchStats();
    fetchOrders();
    fetchPackages();
    fetchSettings();
    fetchAdminUsers();
    fetchQrStatus();
    fetchDispatchLogs();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const res = await api.adminLogin(username.trim(), password.trim());
      setLoginLoading(false);

      if (res.success && (res.data?.token || res.token)) {
        const tokenVal = res.data?.token || res.token;
        localStorage.setItem('dialog_admin_token', tokenVal);
        setToken(tokenVal);
        const adminObj = res.data?.admin || res.user || { username: username.trim(), role: 'admin' };
        setAdminUser(adminObj);
        
        // Immediately fetch all admin data
        fetchStats();
        fetchOrders();
        fetchPackages();
        fetchSettings();
        fetchAdminUsers();
      } else {
        setLoginError(res.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setLoginLoading(false);
      setLoginError('සම්බන්ධතා දෝෂයකි. කරුණාකර නැවත උත්සාහ කරන්න.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dialog_admin_token');
    setToken('');
    setAdminUser(null);
  };

  const fetchStats = async () => {
    const res = await api.getAdminStats();
    if (res.success) setStats(res.data);
  };

  const fetchOrders = async (isBackground = false) => {
    if (!isBackground) setOrdersLoading(true);
    const res = await api.getAdminOrders(orderStatusFilter, orderSearch);
    if (!isBackground) setOrdersLoading(false);

    if (res.success && res.data) {
      setOrders(res.data);
      const pendingCount = res.data.filter(o => o.status === 'PENDING').length;
      if (pendingCount > previousPendingCountRef.current && previousPendingCountRef.current !== 0) {
        playNotificationSound();
      }
      previousPendingCountRef.current = pendingCount;
    }
  };

  const fetchPackages = async () => {
    const res = await api.getAdminPackages();
    if (res.success) setPackages(res.data);
  };

  const fetchSettings = async () => {
    const res = await api.getAdminSettings();
    if (res.success) setSettingsForm(res.data);
  };

  const fetchAdminUsers = async () => {
    const res = await api.getAdminUsers();
    if (res.success && res.data) setAdminUsers(res.data);
  };

  const handleCreateAdminUser = async (e) => {
    e.preventDefault();
    if (!newAdminUsername || !newAdminPassword) return;
    setNewAdminLoading(true);
    setAdminUserMsg('');
    const res = await api.createAdminUser({
      username: newAdminUsername.trim(),
      password: newAdminPassword.trim(),
      name: newAdminName.trim() || newAdminUsername.trim(),
      role: 'ADMIN'
    });
    setNewAdminLoading(false);
    if (res.success) {
      setAdminUserMsg('✓ ' + (res.message || 'නව පරිපාලක සාර්ථකව එක් කරන ලදී!'));
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminName('');
      fetchAdminUsers();
    } else {
      setAdminUserMsg('❌ ' + (res.message || 'පරිපාලක එක් කිරීම අසාර්ථක විය.'));
    }
  };

  const handleDeleteAdminUser = async (id) => {
    if (!window.confirm('මෙම පරිපාලක ගිණුම ඉවත් කිරීමට ඔබට විශ්වාසද?')) return;
    const res = await api.deleteAdminUser(id);
    if (res.success) {
      fetchAdminUsers();
    } else {
      alert(res.message || 'දෝෂයක් සිදු විය.');
    }
  };

  const handleChangeMyPassword = async (e) => {
    e.preventDefault();
    if (!changePwdVal) return;
    setChangePwdMsg('');
    const res = await api.changeAdminPassword({ 
      username: adminUser?.username || 'admin', 
      newPassword: changePwdVal.trim() 
    });
    if (res.success) {
      setChangePwdMsg('✓ ' + (res.message || 'මුරපදය සාර්ථකව වෙනස් කරන ලදී!'));
      setChangePwdVal('');
    } else {
      setChangePwdMsg('❌ ' + (res.message || 'දෝෂයක් සිදු විය.'));
    }
  };

  // Status update with proof screenshot support
  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    const res = await api.updateOrderStatus(
      selectedOrder.id, 
      newStatus, 
      adminNotes, 
      proofImageBase64 || selectedOrder.proofImageUrl, 
      estimatedTime
    );
    if (res.success) {
      setSelectedOrder(null);
      setProofImageBase64('');
      fetchOrders();
      fetchStats();
    } else {
      alert(res.message || 'Status update failed');
    }
  };

  // Quick Send Payment Request with Bank Info
  const handleSendPaymentRequest = async () => {
    if (!paymentRequestModalOrder) return;
    setReqLoading(true);
    const res = await api.requestOrderPayment(paymentRequestModalOrder.id, reqEta, reqNotes);
    setReqLoading(false);
    if (res.success) {
      setPaymentRequestModalOrder(null);
      setReqNotes('');
      fetchOrders();
      fetchStats();
      alert('✅ Payment Request එක සහ Bank Details Customer WhatsApp වෙත සාර්ථකව යවන ලදී!');
    } else {
      alert(res.message || 'Payment Request failed');
    }
  };

  // WhatsApp quick notifier for customer
  const handleSendCustomerWhatsApp = (ord) => {
    const cleanPhone = (ord.customerWhatsApp || ord.dialogNumber).replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `*✅ Dialog Reload Completed*\n\n` +
      `Dear ${ord.customerName},\n` +
      `Your reload for *${ord.dialogNumber}* has been successfully completed!\n\n` +
      `*Order Ref:* ${ord.orderReference}\n` +
      `*Reload Value:* Rs. ${ord.originalAmount}\n` +
      `*You Saved:* Rs. ${ord.discountAmount} (${ord.discountPercentage}% OFF)\n` +
      `*Paid:* Rs. ${ord.finalAmount}\n` +
      `*Admin Note:* ${ord.adminNotes || 'Reload executed successfully'}\n\n` +
      `Thank you for using Dialog Reload Hub!`
    );
    window.open(`https://wa.me/${cleanPhone.startsWith('94') ? cleanPhone : '94' + cleanPhone.replace(/^0/, '')}?text=${msg}`, '_blank');
  };

  // Add Package
  const handleAddPackage = async (e) => {
    e.preventDefault();
    if (!newPkgName || !newPkgAmount) return;

    const amt = parseFloat(newPkgAmount);
    const res = await api.addPackage({
      name: newPkgName,
      amount: amt,
      category: amt >= 5000 ? 'Mega Bulk Reload' : 'Standard Reload',
      description: newPkgDesc,
      popular: amt >= 5000 || amt === 1000,
      active: true
    });

    if (res.success) {
      setNewPkgName('');
      setNewPkgAmount('');
      setNewPkgDesc('');
      fetchPackages();
    } else {
      alert(res.message || 'Failed to add package');
    }
  };

  // Delete Package
  const handleDeletePackage = async (id) => {
    if (confirm('මෙම පැකේජය ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්නද?')) {
      const res = await api.deletePackage(id);
      if (res.success) fetchPackages();
    }
  };

  // Forward single order to WhatsApp Group directly
  const handleForwardToGroup = (ord) => {
    const connBadge = ord.dialogConnectionType ? `\n📟 *Connection Type:* ${ord.dialogConnectionType === 'Router' ? '📶 Router' : (ord.dialogConnectionType === 'DTV' ? '📺 DTV' : '📱 Mobile')}` : '';
    const text = `🚨 *NEW ORDER RECEIVED - SL RELOAD HUB* 🚨
━━━━━━━━━━━━━━━━━━━━━
📦 *Order Reference:* #${ord.orderReference}
⚡ *Service:* ${ord.serviceType}${connBadge}
🎯 *Target Number / Account:* ${ord.dialogNumber}
💰 *Original Amount:* Rs. ${ord.originalAmount.toFixed(2)}
🎁 *Discount Applied:* ${ord.discountPercentage}% OFF (Saved Rs. ${ord.discountAmount.toFixed(2)})
💵 *Final Amount:* Rs. ${ord.finalAmount.toFixed(2)}
💳 *Payment Method:* ${ord.paymentMethod}
🔖 *Reference:* ${ord.paymentReference || 'None'}
👤 *Customer:* ${ord.customerName}
📱 *WhatsApp:* ${ord.customerWhatsApp || ord.dialogNumber}
⏰ *Time:* ${new Date(ord.createdAt).toLocaleTimeString()}
━━━━━━━━━━━━━━━━━━━━━
👉 *Status:* ${ord.status}
🔗 *Admin Dashboard:* http://localhost:5000`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Test WhatsApp Group Alert
  const [testGroupLoading, setTestGroupLoading] = useState(false);
  const [testGroupResult, setTestGroupResult] = useState('');

  const handleTestWhatsAppGroupAlert = async () => {
    setTestGroupLoading(true);
    setTestGroupResult('');
    const res = await api.testWhatsAppGroupAlert();
    setTestGroupLoading(false);
    fetchDispatchLogs();

    const alertText = `🚨 *TEST ALERT - DIALOG RELOAD HUB*\n━━━━━━━━━━━━━━━━━━━━━\n✅ WhatsApp Group Alert System is LIVE & CONNECTED!\n🎯 Target Group: 120363410663305077@g.us\n📱 Admin Hotline: +94720346443\n⏰ Timestamp: ${new Date().toLocaleTimeString()} | ${new Date().toLocaleDateString('en-GB')}\n━━━━━━━━━━━━━━━━━━━━━\n⚡ Order Auto-Dispatch Ready!`;
    
    // Automatically trigger WhatsApp share bridge
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(alertText)}`, '_blank');

    setTestGroupResult('✅ WhatsApp විවෘත විය! Group එක වෙත Test Alert එක Send කරන්න.');
  };

  // Save settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaveMsg('');
    const res = await api.updateAdminSettings(settingsForm);
    if (res.success) {
      setSettingsSaveMsg('සැකසුම් සාර්ථකව සුරකින ලදී! (Settings Saved)');
      setTimeout(() => setSettingsSaveMsg(''), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: token ? '1100px' : '450px', width: '95%' }}
      >
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Not Logged In */}
        {!token ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '54px',
                height: '54px',
                background: 'linear-gradient(135deg, #ff7900 0%, #e60000 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Lock size={26} color="#fff" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Admin Login</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                කළමනාකරණ පද්ධතියට පිවිසෙන්න
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {loginError && (
                <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} />
                  <span>{loginError}</span>
                </div>
              )}

              <div style={{
                background: 'rgba(255,121,0,0.06)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#fed7aa',
                marginBottom: '1.25rem',
                border: '1px solid rgba(255,121,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <ShieldCheck size={15} color="#ff7900" style={{ flexShrink: 0 }} />
                <span>අවසරලත් පරිපාලකයින් සඳහා පමණි (Authorized Admins Only)</span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loginLoading}
              >
                {loginLoading ? 'සත්‍යාපනය කරමින්...' : 'Login වන්න'}
              </button>
            </form>
          </div>
        ) : (
          /* Admin Dashboard */
          <div>
            {/* Top Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={24} color="#ff7900" />
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Admin Management Panel</h2>
                  <span style={{ fontSize: '0.78rem', color: '#10b981' }}>● Logged in as: {adminUser?.username}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Auto Refresh & Sound Toggles */}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  title={soundEnabled ? 'Disable sound alerts' : 'Enable sound alerts'}
                >
                  {soundEnabled ? <Volume2 size={14} color="#10b981" /> : <VolumeX size={14} color="#94a3b8" />}
                </button>

                <button 
                  className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('orders')}
                >
                  <ShoppingBag size={15} /> Orders
                </button>
                <button 
                  className={`btn btn-sm ${activeTab === 'packages' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('packages')}
                >
                  <Layers size={15} /> Packages
                </button>
                <button 
                  className={`btn btn-sm ${activeTab === 'whatsapp' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => {
                    setActiveTab('whatsapp');
                    fetchQrStatus();
                    fetchDispatchLogs();
                  }}
                  style={{ background: activeTab === 'whatsapp' ? 'var(--primary-orange)' : 'rgba(16, 185, 129, 0.15)', borderColor: '#10b981', color: activeTab === 'whatsapp' ? '#fff' : '#34d399' }}
                >
                  <QrCode size={15} /> WhatsApp QR Linker
                </button>
                <button 
                  className={`btn btn-sm ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings size={15} /> Settings
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout} title="Logout">
                  <LogOut size={15} />
                </button>
              </div>
            </div>

            {/* TAB 1: ORDERS & STATS */}
            {activeTab === 'orders' && (
              <div>
                {/* Metrics Cards */}
                {stats && (
                  <div className="metrics-grid">
                    <div className="metric-card">
                      <div className="metric-title">මුළු Orders (Total Orders)</div>
                      <div className="metric-value">{stats.totalOrders || 0}</div>
                    </div>
                    <div className="metric-card orange">
                      <div className="metric-title">Pending Orders</div>
                      <div className="metric-value">{stats.pendingOrders || 0}</div>
                    </div>
                    <div className="metric-card green">
                      <div className="metric-title">සම්පූර්ණ කළ ආදායම (Revenue)</div>
                      <div className="metric-value">Rs. {(stats.totalRevenue || 0).toLocaleString()}</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-title">දුන් වට්ටම් (Discounts)</div>
                      <div className="metric-value" style={{ color: '#38bdf8' }}>
                        Rs. {(stats.totalDiscountsGiven || stats.totalSavingsDelivered || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters & Search */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <div className="input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
                    <Search size={16} className="input-icon" />
                    <input
                      type="text"
                      className="form-control with-icon"
                      placeholder="Search Ref, Phone, Name..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-control"
                    style={{ width: 'auto', minWidth: '180px' }}
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                  >
                    <option value="ALL">සියලුම Orders (All)</option>
                    <option value="REQUESTED">📥 New Requests (No Pay Yet)</option>
                    <option value="READY_FOR_PAYMENT">💳 Ready For Payment</option>
                    <option value="PAYMENT_SUBMITTED">🧾 Slip Uploaded</option>
                    <option value="PROCESSING">🔄 Processing</option>
                    <option value="COMPLETED">✅ Completed with Proof</option>
                    <option value="REJECTED">❌ Rejected</option>
                  </select>

                  <button className="btn btn-secondary" onClick={() => fetchOrders()}>
                    <RefreshCw size={16} className={ordersLoading ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Orders Table */}
                <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ref & Time</th>
                        <th>Dialog Number</th>
                        <th>Amount / Type</th>
                        <th>Discount / Paid</th>
                        <th>Payment / Proof</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            කිසිදු Order එකක් හමු නොවුණි (No orders found)
                          </td>
                        </tr>
                      ) : (
                        orders.map((ord) => (
                          <tr key={ord.id}>
                            <td>
                              <strong style={{ color: 'var(--primary-orange)' }}>{ord.orderReference}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <strong>{ord.dialogNumber}</strong>
                              {ord.dialogConnectionType && (
                                <span style={{ display: 'inline-block', fontSize: '0.7rem', color: '#ff7900', fontWeight: 800, background: 'rgba(255,121,0,0.12)', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(255,121,0,0.25)', marginLeft: '0.35rem' }}>
                                  {ord.dialogConnectionType === 'Router' ? '📶 Router' : (ord.dialogConnectionType === 'DTV' ? '📺 DTV' : '📱 Mobile')}
                                </span>
                              )}
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ord.customerName}</div>
                            </td>
                            <td>
                              <div>Rs. {ord.originalAmount.toFixed(2)}</div>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ord.reloadType}</span>
                              <div>
                                {ord.originalAmount >= 5000 ? (
                                  <span style={{ display: 'inline-block', fontSize: '0.68rem', color: '#34d399', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.2rem', fontWeight: 700 }}>
                                    💎 Post-Pay (5k+)
                                  </span>
                                ) : (
                                  <span style={{ display: 'inline-block', fontSize: '0.68rem', color: '#fb923c', background: 'rgba(255,121,0,0.15)', border: '1px solid rgba(255,121,0,0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.2rem', fontWeight: 700 }}>
                                    🔒 Pre-Pay (&lt; 5k)
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ color: '#10b981', fontWeight: 600 }}>
                                -{ord.discountPercentage}% (Rs. {ord.discountAmount.toFixed(2)})
                              </div>
                              <strong>Pay: Rs. {ord.finalAmount.toFixed(2)}</strong>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.8rem' }}>{ord.paymentMethod || 'Bank Transfer'}</div>
                              {ord.paymentReference && (
                                <div style={{ fontSize: '0.75rem', color: '#fbbf24' }}>
                                  Ref: {ord.paymentReference}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                {ord.paymentSlipUrl && (
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    style={{ padding: '0.18rem 0.4rem', fontSize: '0.7rem' }}
                                    onClick={() => setViewSlipUrl(ord.paymentSlipUrl)}
                                  >
                                    <Eye size={11} /> Slip
                                  </button>
                                )}
                                {ord.proofImageUrl && (
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    style={{ padding: '0.18rem 0.4rem', fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', borderColor: '#10b981', color: '#34d399' }}
                                    onClick={() => setViewProofUrl(ord.proofImageUrl)}
                                  >
                                    📸 Proof
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>
                              <span 
                                className="status-pill" 
                                style={{
                                  background: ord.status === 'COMPLETED' ? 'rgba(16,185,129,0.2)' : 
                                              ord.status === 'READY_FOR_PAYMENT' ? 'rgba(56,189,248,0.2)' :
                                              ord.status === 'PAYMENT_SUBMITTED' ? 'rgba(168,85,247,0.2)' :
                                              ord.status === 'PROCESSING' ? 'rgba(245,158,11,0.2)' :
                                              ord.status === 'REQUESTED' ? 'rgba(255,121,0,0.2)' : 'rgba(239,68,68,0.2)',
                                  color: ord.status === 'COMPLETED' ? '#34d399' : 
                                         ord.status === 'READY_FOR_PAYMENT' ? '#38bdf8' :
                                         ord.status === 'PAYMENT_SUBMITTED' ? '#c084fc' :
                                         ord.status === 'PROCESSING' ? '#fbbf24' :
                                         ord.status === 'REQUESTED' ? '#fb923c' : '#f87171',
                                  border: '1px solid currentColor',
                                  fontSize: '0.72rem',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  fontWeight: 700
                                }}
                              >
                                {ord.status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                {ord.status === 'REQUESTED' && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: '#0284c7', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', fontWeight: 700 }}
                                    onClick={() => {
                                      setPaymentRequestModalOrder(ord);
                                      setReqEta('විනාඩි 5 - 10ක් ඇතුළත');
                                      setReqNotes('');
                                    }}
                                    title="Send Bank Details and Request Payment"
                                  >
                                    💳 Request Pay
                                  </button>
                                )}

                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setNewStatus(ord.status);
                                    setAdminNotes(ord.adminNotes || '');
                                    setProofImageBase64(ord.proofImageUrl || '');
                                    setEstimatedTime(ord.estimatedTime || 'විනාඩි 5 - 15ක් ඇතුළත');
                                  }}
                                >
                                  Manage
                                </button>

                                <button
                                  className="btn btn-sm"
                                  style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' }}
                                  onClick={() => handleForwardToGroup(ord)}
                                  title="Forward Order details to WhatsApp Group"
                                >
                                  <Smartphone size={13} /> Group
                                </button>

                                {ord.status === 'COMPLETED' && (
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleSendCustomerWhatsApp(ord)}
                                    title="Send WhatsApp confirmation to customer"
                                  >
                                    <Send size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: PACKAGES */}
            {activeTab === 'packages' && (
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Reload Packages කළමනාකරණය</h3>

                {/* Add package form */}
                <form onSubmit={handleAddPackage} style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="පැකේජ නම (Package Name)"
                      value={newPkgName}
                      onChange={(e) => setNewPkgName(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Reload Amount LKR"
                      value={newPkgAmount}
                      onChange={(e) => setNewPkgAmount(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="කාණ්ඩය (Standard / Mega)"
                      value={newPkgCategory}
                      onChange={(e) => setNewPkgCategory(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="විස්තරය (Description)"
                      value={newPkgDesc}
                      onChange={(e) => setNewPkgDesc(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                      <Plus size={16} /> පැකේජය එකතු කරන්න
                    </button>
                  </div>
                </form>

                {/* Packages list */}
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Package Name</th>
                        <th>Amount</th>
                        <th>Applied Discount</th>
                        <th>Final Price</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {packages.map((pkg) => {
                        const disc = pkg.amount >= 5000 ? 40 : 15;
                        const final = pkg.amount * (1 - disc / 100);
                        return (
                          <tr key={pkg.id}>
                            <td>
                              <strong>{pkg.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{pkg.description}</div>
                            </td>
                            <td>Rs. {pkg.amount.toLocaleString()}</td>
                            <td>
                              <span className={`rate-badge ${disc >= 40 ? 'badge-40' : 'badge-15'}`}>
                                {disc}% OFF
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: 'var(--primary-orange)' }}>
                              Rs. {final.toLocaleString()}
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm" 
                                style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}
                                onClick={() => handleDeletePackage(pkg.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: WHATSAPP DISPATCH HUB */}
            {activeTab === 'whatsapp' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Send size={20} color="#10b981" />
                      WhatsApp Automatic Order Dispatch Hub
                    </h3>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      වෙබ් අඩවියට ලැබෙන ඇණවුම් ඔබගේ WhatsApp Group එකට (120363410663305077@g.us) සහ Hotline (+94720346443) එකට Auto-Send වන පද්ධතිය
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.85rem',
                      borderRadius: '9999px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      ● 🟢 SYSTEM LIVE & DISPATCH READY
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  {/* Card 1: WhatsApp Web Live Advanced QR Scanner */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <h4 style={{ fontSize: '1.05rem', margin: 0, color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                        <QrCode size={20} /> Advanced WhatsApp QR Hub
                      </h4>
                      <span style={{
                        fontSize: '0.75rem',
                        background: qrSession.status === 'CONNECTED' ? 'rgba(16,185,129,0.2)' : 'rgba(255,121,0,0.15)',
                        color: qrSession.status === 'CONNECTED' ? '#34d399' : '#ff7900',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontWeight: 800
                      }}>
                        {qrSession.status === 'CONNECTED' ? '🟢 CONNECTED' : '🟡 SCAN QR CODE'}
                      </span>
                    </div>

                    {/* View Mode Switcher */}
                    {qrSession.status !== 'CONNECTED' && (
                      <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', padding: '0.25rem', borderRadius: '8px', marginBottom: '0.85rem', border: '1px solid var(--border-light)' }}>
                        <button
                          type="button"
                          onClick={() => setQrViewMode('canvas')}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: qrViewMode === 'canvas' ? 'var(--primary-orange)' : 'transparent',
                            color: qrViewMode === 'canvas' ? '#fff' : '#94a3b8'
                          }}
                        >
                          📸 Smart HD Canvas QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setQrViewMode('terminal')}
                          style={{
                            padding: '0.3rem 0.75rem',
                            borderRadius: '6px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: qrViewMode === 'terminal' ? '#10b981' : 'transparent',
                            color: qrViewMode === 'terminal' ? '#fff' : '#94a3b8'
                          }}
                        >
                          📟 Terminal Matrix (ASCII)
                        </button>
                      </div>
                    )}

                    {/* QR Code Container */}
                    <div style={{
                      background: qrSession.status === 'CONNECTED' ? '#ffffff' : (qrViewMode === 'canvas' ? '#ffffff' : '#090d16'),
                      padding: qrViewMode === 'terminal' && qrSession.status !== 'CONNECTED' ? '8px' : '12px',
                      borderRadius: '16px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      marginBottom: '1rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '240px',
                      minHeight: '240px',
                      position: 'relative',
                      border: qrViewMode === 'terminal' && qrSession.status !== 'CONNECTED' ? '1px solid #10b981' : 'none'
                    }}>
                      {qrSession.status === 'CONNECTED' ? (
                        <div style={{ color: '#059669', padding: '1.5rem', textAlign: 'center' }}>
                          <CheckCircle size={64} color="#10b981" style={{ margin: '0 auto 0.75rem auto' }} />
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>Connected!</div>
                          <div style={{ fontSize: '0.82rem', color: '#047857', marginTop: '0.25rem', fontWeight: 700 }}>{qrSession.connectedPhone || '+94 72 034 6443'}</div>
                        </div>
                      ) : qrViewMode === 'canvas' ? (
                        <div style={{ position: 'relative' }}>
                          <canvas ref={qrCanvasRef} width={240} height={240} style={{ display: 'block', borderRadius: '8px' }} />
                        </div>
                      ) : (
                        <div style={{ textAlign: 'left', maxWidth: '300px', overflow: 'hidden' }}>
                          <pre style={{
                            margin: 0,
                            fontSize: '6.2px',
                            lineHeight: '6.2px',
                            fontFamily: 'Consolas, monospace',
                            color: '#34d399',
                            background: '#090d16',
                            padding: '4px',
                            userSelect: 'all'
                          }}>
                            {asciiQrText || 'Generating Terminal Matrix...'}
                          </pre>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.6rem', width: '100%', maxWidth: '320px' }}>
                      {qrSession.status === 'CONNECTED' ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={handleDisconnectSession}
                          style={{ flex: 1, fontWeight: 700 }}
                        >
                          <LogOut size={14} /> Disconnect Session
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleGenerateQR}
                          disabled={qrLoading}
                          style={{ flex: 1, fontWeight: 700 }}
                        >
                          <RefreshCw size={14} className={qrLoading ? 'spin' : ''} /> {qrLoading ? 'Generating...' : '🔄 Refresh QR Code'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card 2: Mobile Instructions & Group Dispatch Details */}
                  <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-highlight)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', margin: '0 0 1rem 0', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}>
                        <Smartphone size={18} color="#ff7900" /> දුරකථනයෙන් සම්බන්ධ වන ආකාරය
                      </h4>

                      <ol style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: '1.7', paddingLeft: '1.2rem', margin: '0 0 1.25rem 0' }}>
                        <li>ඔබගේ දුරකථනයේ <strong>WhatsApp</strong> විවෘත කරන්න.</li>
                        <li>උඩ ඇති <strong>Settings (හෝ ⋮ තිත් 3) ➔ Linked Devices</strong> වෙත යන්න.</li>
                        <li><strong>"Link a Device" (උපාංගයක් සම්බන්ධ කරන්න)</strong> ඔබන්න.</li>
                        <li>තිරයේ දිස්වන <strong>QR Code එක ඔබගේ දුරකථනයෙන් Scan කරන්න!</strong></li>
                      </ol>

                      <div style={{ background: 'rgba(16,185,129,0.06)', padding: '0.85rem', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', marginBottom: '1.25rem', fontSize: '0.82rem' }}>
                        <div style={{ fontWeight: 800, color: '#34d399', marginBottom: '0.2rem' }}>
                          🎯 Auto-Target Group ID:
                        </div>
                        <code style={{ fontSize: '0.85rem', color: '#fff', wordBreak: 'break-all' }}>
                          120363410663305077@g.us
                        </code>
                        <div style={{ fontWeight: 800, color: '#ff7900', marginTop: '0.5rem', marginBottom: '0.2rem' }}>
                          📱 Admin Contact Hotline:
                        </div>
                        <code style={{ fontSize: '0.85rem', color: '#fff' }}>
                          +94 72 034 6443
                        </code>
                      </div>
                    </div>

                    {/* Action: Send Test Alert to Group */}
                    <div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleTestWhatsAppGroupAlert}
                        disabled={testGroupLoading}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', width: '100%', padding: '0.75rem', fontWeight: 800 }}
                      >
                        <Send size={16} /> {testGroupLoading ? 'Group එකට යවමින්...' : '⚡ Test Alert එකක් යවන්න (Send Test to Group)'}
                      </button>
                      {testGroupResult && (
                        <div style={{ fontSize: '0.82rem', marginTop: '0.5rem', color: testGroupResult.startsWith('✅') ? '#34d399' : '#f87171', textAlign: 'center' }}>
                          {testGroupResult}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dispatched Alerts Log Table */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Clock size={16} color="#ff7900" />
                      Live Dispatched Group Alerts Queue (120363410663305077@g.us)
                    </h4>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={fetchDispatchLogs}>
                      <RefreshCw size={13} /> Refresh Log
                    </button>
                  </div>

                  <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Order Ref</th>
                          <th>Service & Type</th>
                          <th>Target Number</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dispatchedLogs.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                              තවමත් කිසිදු Alert එකක් යොමු කර නොමැත (No alerts dispatched yet)
                            </td>
                          </tr>
                        ) : (
                          dispatchedLogs.map((log) => (
                            <tr key={log.id}>
                              <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td><strong style={{ color: 'var(--primary-orange)' }}>{log.orderReference}</strong></td>
                              <td>
                                <div>{log.serviceType}</div>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{log.dialogConnectionType}</span>
                              </td>
                              <td><strong>{log.targetNumber}</strong></td>
                              <td>Rs. {log.finalAmount?.toFixed(2)}</td>
                              <td>
                                <span className={`status-pill status-${log.status.toLowerCase()}`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SETTINGS */}
            {activeTab === 'settings' && (
              <>
                <form onSubmit={handleSaveSettings}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>වෙබ් අඩවි සැකසුම් (Store Settings)</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">WhatsApp Contact Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settingsForm.contactWhatsApp || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactWhatsApp: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">EzCash / mCash Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settingsForm.ezCashNumber || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, ezCashNumber: e.target.value })}
                    />
                  </div>
                </div>

                {/* WhatsApp Group Auto Notification Settings */}
                <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '1.25rem', margin: '1.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#34d399', fontWeight: 800 }}>
                      <Smartphone size={18} />
                      <span>WhatsApp Group Auto Order Notification Engine</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.84rem' }}>
                      <input 
                        type="checkbox"
                        checked={settingsForm.autoNotifyAdminGroup !== false}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyAdminGroup: e.target.checked })}
                      />
                      <span>Auto-Notify Group</span>
                    </label>
                  </div>

                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                    පාරිභෝගිකයෙකු Order එකක් දැමූ විගස (Dialog, Hutch, EzCash, CEB) Admin WhatsApp Group එකට සියලුම විස්තර සහිතව ස්වයංක්‍රීයව Alert එක යවයි.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>WhatsApp Group / Bot Webhook URL (Optional)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://your-whatsapp-gateway.com/api/send"
                        value={settingsForm.whatsappGroupWebhookUrl || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappGroupWebhookUrl: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>WhatsApp Group ID / Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="admin-orders-group"
                        value={settingsForm.whatsappGroupId || ''}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsappGroupId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleTestWhatsAppGroupAlert}
                      disabled={testGroupLoading}
                      style={{ background: 'rgba(16,185,129,0.15)', borderColor: '#10b981', color: '#34d399' }}
                    >
                      {testGroupLoading ? 'Alert එක යවමින් පවතී...' : '⚡ Test Group Alert එකක් යවන්න (Test Group Alert)'}
                    </button>
                    {testGroupResult && (
                      <span style={{ fontSize: '0.82rem', color: testGroupResult.startsWith('✅') ? '#34d399' : '#f87171' }}>
                        {testGroupResult}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bank Accounts */}
                <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>බැංකු ගිණුම් විස්තර (Bank Accounts for Payments)</label>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
                      const newBank = {
                        id: `bank-${Date.now()}`,
                        bankName: 'Commercial Bank',
                        accountName: 'DIALOG RELOAD HUB',
                        accountNumber: '',
                        branch: 'Colombo'
                      };
                      setSettingsForm({
                        ...settingsForm,
                        bankAccounts: [...(settingsForm.bankAccounts || []), newBank]
                      });
                    }}>
                      <Plus size={14} /> Add Bank
                    </button>
                  </div>

                  {(settingsForm.bankAccounts || []).map((bank, idx) => (
                    <div key={bank.id || idx} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1fr 40px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Bank Name"
                        value={bank.bankName}
                        onChange={(e) => {
                          const updated = [...settingsForm.bankAccounts];
                          updated[idx].bankName = e.target.value;
                          setSettingsForm({ ...settingsForm, bankAccounts: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Account Number"
                        value={bank.accountNumber}
                        onChange={(e) => {
                          const updated = [...settingsForm.bankAccounts];
                          updated[idx].accountNumber = e.target.value;
                          setSettingsForm({ ...settingsForm, bankAccounts: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Account Name"
                        value={bank.accountName}
                        onChange={(e) => {
                          const updated = [...settingsForm.bankAccounts];
                          updated[idx].accountName = e.target.value;
                          setSettingsForm({ ...settingsForm, bankAccounts: updated });
                        }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Branch"
                        value={bank.branch}
                        onChange={(e) => {
                          const updated = [...settingsForm.bankAccounts];
                          updated[idx].branch = e.target.value;
                          setSettingsForm({ ...settingsForm, bankAccounts: updated });
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.5rem' }}
                        onClick={() => {
                          setSettingsForm({
                            ...settingsForm,
                            bankAccounts: settingsForm.bankAccounts.filter(b => b.id !== bank.id)
                          });
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {settingsSaveMsg && (
                  <div style={{ color: '#10b981', fontSize: '0.88rem', margin: '1rem 0' }}>
                    ✓ {settingsSaveMsg}
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  <Save size={16} /> සැකසුම් සුරකින්න (Save Settings)
                </button>
              </form>

              {/* ADMIN USER ACCOUNTS MANAGEMENT */}
              <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <ShieldCheck size={20} color="#ff7900" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                    අවසරලත් පරිපාලකයින් කළමනාකරණය (Authorized Admins Management)
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Card 1: Change Current Admin Password */}
                  <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#fed7aa', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Lock size={15} color="#ff7900" /> මගේ මුරපදය වෙනස් කරන්න (Change My Password)
                    </h4>
                    <form onSubmit={handleChangeMyPassword}>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>නව මුරපදය (New Password)</label>
                        <input
                          type="password"
                          className="form-control"
                          placeholder="අවම අකුරු 6ක්..."
                          value={changePwdVal}
                          onChange={(e) => setChangePwdVal(e.target.value)}
                          required
                        />
                      </div>
                      {changePwdMsg && (
                        <div style={{ fontSize: '0.82rem', marginBottom: '0.75rem', color: changePwdMsg.startsWith('✓') ? '#34d399' : '#f87171' }}>
                          {changePwdMsg}
                        </div>
                      )}
                      <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        මුරපදය යාවත්කාලීන කරන්න
                      </button>
                    </form>
                  </div>

                  {/* Card 2: Add New Authorized Admin */}
                  <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Plus size={15} color="#38bdf8" /> නව පරිපාලකයෙකු එක් කරන්න (Add New Admin)
                    </h4>
                    <form onSubmit={handleCreateAdminUser}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>Username</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. manager1"
                            value={newAdminUsername}
                            onChange={(e) => setNewAdminUsername(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.74rem' }}>Password</label>
                          <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                        <label className="form-label" style={{ fontSize: '0.74rem' }}>Admin Name / Role Title</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Reload Manager"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                        />
                      </div>
                      {adminUserMsg && (
                        <div style={{ fontSize: '0.82rem', marginBottom: '0.75rem', color: adminUserMsg.startsWith('✓') ? '#34d399' : '#f87171' }}>
                          {adminUserMsg}
                        </div>
                      )}
                      <button 
                        type="submit" 
                        className="btn btn-primary btn-sm" 
                        style={{ width: '100%' }}
                        disabled={newAdminLoading}
                      >
                        {newAdminLoading ? 'එක් කරමින් පවතී...' : '+ නව පරිපාලක Save කරන්න'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Card 3: List of Current Authorized Admins */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-hairline)', overflow: 'hidden' }}>
                  <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>දැනට සිටින අවසරලත් පරිපාලකයින් ({adminUsers.length || 1})</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={fetchAdminUsers} style={{ padding: '0.25rem 0.6rem' }}>
                      <RefreshCw size={13} /> Refresh
                    </button>
                  </div>
                  <div style={{ padding: '0.5rem' }}>
                    {(adminUsers.length > 0 ? adminUsers : [{ id: 'admin-1', username: 'admin', name: 'Main Administrator', role: 'SUPER_ADMIN' }]).map((adm) => (
                      <div 
                        key={adm.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem 1rem',
                          borderRadius: '8px',
                          background: 'var(--bg-input)',
                          marginBottom: '0.4rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <ShieldCheck size={16} color={adm.role === 'SUPER_ADMIN' ? '#ff7900' : '#38bdf8'} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{adm.username} ({adm.name})</div>
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Role: {adm.role || 'ADMIN'}</span>
                          </div>
                        </div>
                        {adm.id !== 'admin-1' && adm.username !== 'admin' && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '0.35rem 0.6rem' }}
                            onClick={() => handleDeleteAdminUser(adm.id)}
                            title="Remove Admin"
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>)}

            {/* ORDER STATUS MODAL */}
            {selectedOrder && (
              <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                  <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                    <X size={18} />
                  </button>

                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                    Order Status යාවත්කාලීන කරන්න
                  </h3>

                  <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    <div>Ref: <strong>{selectedOrder.orderReference}</strong></div>
                    <div>Number: <strong>{selectedOrder.dialogNumber}</strong></div>
                    <div>Reload Amount: <strong>Rs. {selectedOrder.originalAmount}</strong></div>
                    <div>Final Paid: <strong>Rs. {selectedOrder.finalAmount}</strong></div>
                    <div style={{ marginTop: '0.35rem' }}>
                      {selectedOrder.originalAmount >= 5000 ? (
                        <span style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
                          💎 5,000+ Post-Pay Order: පළමුව Reload කර Proof එක සමඟ COMPLETED කළ හැක.
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#fb923c', fontWeight: 700 }}>
                          🔒 &lt; 5,000 Pre-Pay Order: පළමුව Payment තහවුරු වූ පසු පමණක් Reload කරන්න.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">නව Status එක තෝරන්න</label>
                    <select
                      className="form-control"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="REQUESTED">📥 REQUESTED (අලුත් Request එක - ගෙවීම් ඉල්ලීමට පෙර)</option>
                      <option value="READY_FOR_PAYMENT">💳 READY FOR PAYMENT (අනුමතයි - Bank Details යවා ඇත)</option>
                      <option value="PAYMENT_SUBMITTED">🧾 PAYMENT SUBMITTED (Slip එක ලැබී ඇත)</option>
                      <option value="PROCESSING">🔄 PROCESSING (රිලෝඩ් කරමින් පවතී)</option>
                      <option value="COMPLETED">✅ COMPLETED (රිලෝඩ් යවන ලදී - සාර්ථකයි)</option>
                      <option value="REJECTED">❌ REJECTED (ප්‍රතික්ෂේපිතයි)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Admin සටහන (Remarks / Transaction Slip ID)</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="උදා: Reloaded via Dialog Dealer App Ref: 98129..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                  </div>

                  {newStatus === 'COMPLETED' && (
                    <div className="form-group" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', padding: '0.85rem', borderRadius: '10px', marginBottom: '1rem' }}>
                      <label className="form-label" style={{ color: '#34d399', fontWeight: 700, fontSize: '0.84rem' }}>
                        📸 Reload Proof Screenshot අමුණන්න (Optional)
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="form-control"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setProofImageBase64(reader.result);
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                      {proofImageBase64 && (
                        <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                          <img src={proofImageBase64} alt="Proof Preview" style={{ maxHeight: '100px', borderRadius: '6px', border: '1px solid #10b981' }} />
                          <div style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '0.2rem' }}>
                            ✓ Proof Photo Attached - මෙම ඡායාරූපය Customer ගේ WhatsApp එකට Auto-Send වේ!
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ background: 'rgba(16,185,129,0.1)', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.78rem', color: '#34d399', marginBottom: '1rem' }}>
                    ⚡ <strong>Auto-WhatsApp Sync:</strong> Save කළ සැණින් Customer ගේ WhatsApp අංකයට (<strong>{selectedOrder.customerWhatsApp || selectedOrder.dialogNumber}</strong>) Digital Receipt / Proof එක <strong>Auto-Update</strong> වේ.
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleUpdateStatus}>
                      Save Changes & Auto-Update WhatsApp
                    </button>
                    <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* QUICK PAYMENT REQUEST MODAL */}
            {paymentRequestModalOrder && (
              <div className="modal-overlay" onClick={() => setPaymentRequestModalOrder(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
                  <button className="modal-close-btn" onClick={() => setPaymentRequestModalOrder(null)}>
                    <X size={18} />
                  </button>

                  <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    💳 Request Payment via WhatsApp
                  </h3>

                  <div style={{ background: 'var(--bg-input)', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.84rem' }}>
                    <div>Ref: <strong>{paymentRequestModalOrder.orderReference}</strong></div>
                    <div>Customer: <strong>{paymentRequestModalOrder.customerName}</strong> ({paymentRequestModalOrder.customerWhatsApp})</div>
                    <div>Target Number: <strong>{paymentRequestModalOrder.dialogNumber}</strong></div>
                    <div style={{ color: '#10b981', fontWeight: 700, marginTop: '0.25rem' }}>
                      Final Amount to Collect: Rs. {paymentRequestModalOrder.finalAmount.toFixed(2)} (Save Rs. {paymentRequestModalOrder.discountAmount})
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ඇස්තමේන්තුගත කාලය (Estimated Delivery Time)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={reqEta}
                      onChange={(e) => setReqEta(e.target.value)}
                      placeholder="උදා: විනාඩි 5 - 10ක් ඇතුළත"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">අමතර සටහන් (Optional Notes)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                      placeholder="උදා: Slip එක එවූ විගස රිලෝඩ් එක දමනු ලැබේ..."
                    />
                  </div>

                  <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: '#bae6fd', marginBottom: '1rem' }}>
                    💡 මෙය Click කළ සැණින් ඔබගේ <strong>බැංකු ගිණුම් විස්තර</strong> සහ <strong>ගෙවිය යුතු මුදල</strong> සහිත පණිවිඩයක් Customer ගේ WhatsApp එකට auto-ම යවනු ඇත!
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, background: '#0284c7', borderColor: '#0284c7' }} 
                      onClick={handleSendPaymentRequest}
                      disabled={reqLoading}
                    >
                      {reqLoading ? 'යවමින්...' : '🚀 Send Payment Request & Bank Details'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => setPaymentRequestModalOrder(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SLIP PHOTO VIEWER MODAL */}
            {viewSlipUrl && (
              <div className="modal-overlay" onClick={() => setViewSlipUrl(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', textAlign: 'center' }}>
                  <button className="modal-close-btn" onClick={() => setViewSlipUrl(null)}>
                    <X size={20} />
                  </button>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                    Customer Payment Slip Photo
                  </h3>

                  <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: '8px' }}>
                    <img 
                      src={viewSlipUrl} 
                      alt="Bank Deposit Slip" 
                      style={{ width: '100%', height: 'auto', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PROOF PHOTO VIEWER MODAL */}
            {viewProofUrl && (
              <div className="modal-overlay" onClick={() => setViewProofUrl(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', textAlign: 'center' }}>
                  <button className="modal-close-btn" onClick={() => setViewProofUrl(null)}>
                    <X size={20} />
                  </button>

                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#34d399' }}>
                    📸 Reload Proof Screenshot (Delivered to Customer)
                  </h3>

                  <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: '8px' }}>
                    <img 
                      src={viewProofUrl} 
                      alt="Reload Proof" 
                      style={{ width: '100%', height: 'auto', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
