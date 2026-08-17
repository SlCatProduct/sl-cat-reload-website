const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '../data/whatsapp_session.json');

// Initial default session state
let sessionState = {
  status: 'DISCONNECTED', // 'DISCONNECTED' | 'PAIRING' | 'CONNECTED'
  qrCodeDataUrl: null,
  rawQrString: null,
  pairingCode: null,
  connectedPhone: null,
  connectedAt: null,
  targetGroupId: '120363410663305077@g.us',
  autoDispatch: true,
  lastPing: new Date().toISOString()
};

// Dispatched history log in memory (latest 50 alerts)
let dispatchedLog = [];

// Load existing session if saved
try {
  if (fs.existsSync(SESSION_FILE)) {
    const saved = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
    sessionState = { ...sessionState, ...saved };
  }
} catch (e) {
  console.warn('[WhatsApp Gateway] Could not load saved session:', e.message);
}

function persistSession() {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({
      status: sessionState.status,
      connectedPhone: sessionState.connectedPhone,
      connectedAt: sessionState.connectedAt,
      targetGroupId: sessionState.targetGroupId,
      autoDispatch: sessionState.autoDispatch
    }, null, 2));
  } catch (e) {
    console.error('[WhatsApp Gateway] Failed to persist session:', e.message);
  }
}

/**
 * Generate a fresh WhatsApp Web QR Code and pairing session
 */
async function generateQrSession(phoneNumber = '') {
  const timestamp = Date.now();
  const rawQrString = `2@SLReloadHub,${timestamp},${Math.random().toString(36).substring(2, 15)}==,120363410663305077@g.us`;
  
  // Generate 8-character pairing code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pairingCode = '';
  for (let i = 0; i < 8; i++) {
    pairingCode += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3) pairingCode += '-';
  }

  // Generate high-resolution QR DataURL
  const qrCodeDataUrl = await QRCode.toDataURL(rawQrString, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    width: 320
  });

  sessionState.status = 'PAIRING';
  sessionState.qrCodeDataUrl = qrCodeDataUrl;
  sessionState.rawQrString = rawQrString;
  sessionState.pairingCode = pairingCode;
  sessionState.connectedPhone = phoneNumber || null;
  sessionState.lastPing = new Date().toISOString();

  console.log('[WhatsApp Gateway] Generated fresh QR Code & Pairing Code:', pairingCode);
  return sessionState;
}

/**
 * Confirm / Activate connection (simulates or completes phone linkage)
 */
function confirmPairing(phone = '+94 77 123 4567') {
  sessionState.status = 'CONNECTED';
  sessionState.connectedPhone = phone || '+94 77 123 4567';
  sessionState.connectedAt = new Date().toISOString();
  sessionState.qrCodeDataUrl = null;
  sessionState.rawQrString = null;
  sessionState.lastPing = new Date().toISOString();

  persistSession();
  console.log('[WhatsApp Gateway] ✅ WhatsApp Web Connected successfully as:', sessionState.connectedPhone);
  return sessionState;
}

/**
 * Disconnect active WhatsApp session
 */
function disconnectSession() {
  sessionState.status = 'DISCONNECTED';
  sessionState.qrCodeDataUrl = null;
  sessionState.rawQrString = null;
  sessionState.pairingCode = null;
  sessionState.connectedPhone = null;
  sessionState.connectedAt = null;
  sessionState.lastPing = new Date().toISOString();

  persistSession();
  console.log('[WhatsApp Gateway] WhatsApp Web Session disconnected.');
  return sessionState;
}

/**
 * Get current session status
 */
function getSessionStatus() {
  return {
    ...sessionState,
    dispatchedCount: dispatchedLog.length
  };
}

/**
 * Record a dispatched group alert in the live log
 */
function recordDispatchedAlert(order, message, success = true, meta = {}) {
  const entry = {
    id: `alert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    orderReference: order.orderReference,
    serviceType: order.serviceType,
    dialogConnectionType: order.dialogConnectionType || 'Mobile',
    targetNumber: order.dialogNumber,
    finalAmount: order.finalAmount,
    targetGroupId: sessionState.targetGroupId,
    messagePreview: message,
    timestamp: new Date().toISOString(),
    status: success ? 'DELIVERED' : 'QUEUED',
    meta
  };

  dispatchedLog.unshift(entry);
  if (dispatchedLog.length > 50) dispatchedLog.pop();

  return entry;
}

/**
 * Get dispatched alerts history
 */
function getDispatchedLog() {
  return dispatchedLog;
}

module.exports = {
  generateQrSession,
  confirmPairing,
  disconnectSession,
  getSessionStatus,
  recordDispatchedAlert,
  getDispatchedLog
};
