const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const AUTH_DIR = path.join(__dirname, '../data/baileys_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'PAIRING' | 'CONNECTED'
let currentQrDataUrl = null;
let currentQrRaw = null;
let connectedUserJid = null;
let connectedUserPhone = null;
let reconnectAttempts = 0;
let isStarting = false;

const TARGET_GROUP_ID = '120363410663305077@g.us';

/**
 * Initialize / Start Native Baileys WhatsApp Web Socket
 */
async function startBaileys(forceRestart = false) {
  if (isStarting && !forceRestart) {
    console.log('[Baileys] Socket is already starting...');
    return getBaileysStatus();
  }

  isStarting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    // Fetch latest WhatsApp Web version if possible
    let version;
    try {
      const v = await fetchLatestBaileysVersion();
      version = v.version;
    } catch (e) {
      version = [2, 3000, 1015901307];
    }

    console.log(`[Baileys Engine] Starting WhatsApp Web Socket (v${version.join('.')})...`);

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Dialog Reload Hub', 'Chrome', '122.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      retryRequestDelayMs: 250
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        currentQrRaw = qr;
        currentQrDataUrl = await QRCode.toDataURL(qr, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.95,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
          width: 320
        });
        connectionStatus = 'PAIRING';
        reconnectAttempts = 0;
        console.log('[Baileys Engine] 📲 Genuine WhatsApp Multi-Device QR Code is READY for scanning!');
      }

      if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        currentQrDataUrl = null;
        currentQrRaw = null;
        reconnectAttempts = 0;
        connectedUserJid = sock.user?.id || '';
        connectedUserPhone = connectedUserJid.split(':')[0] || connectedUserJid.split('@')[0];
        console.log(`[Baileys Engine] 🟢 WhatsApp Web Connected Successfully as +${connectedUserPhone}! Ready to auto-dispatch orders to ${TARGET_GROUP_ID}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = lastDisconnect?.error?.message || 'Connection lost';
        console.log(`[Baileys Engine] Connection closed (${reason}, code: ${statusCode})`);

        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        if (isLoggedOut) {
          console.log('[Baileys Engine] User logged out from phone. Clearing authentication keys...');
          connectionStatus = 'DISCONNECTED';
          currentQrDataUrl = null;
          connectedUserJid = null;
          connectedUserPhone = null;
          clearAuthData();
        } else {
          connectionStatus = 'DISCONNECTED';
          // Auto reconnect with backoff
          reconnectAttempts++;
          const delay = Math.min(reconnectAttempts * 3000, 20000);
          console.log(`[Baileys Engine] Reconnecting in ${delay / 1000}s (attempt ${reconnectAttempts})...`);
          setTimeout(() => {
            isStarting = false;
            startBaileys();
          }, delay);
        }
      }
    });

    isStarting = false;
    return getBaileysStatus();
  } catch (err) {
    isStarting = false;
    console.error('[Baileys Engine Error] Failed to start socket:', err.message);
    connectionStatus = 'DISCONNECTED';
    return getBaileysStatus();
  }
}

function clearAuthData() {
  try {
    if (fs.existsSync(AUTH_DIR)) {
      const files = fs.readdirSync(AUTH_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(AUTH_DIR, file));
      }
    }
  } catch (e) {
    console.warn('[Baileys] Error clearing auth folder:', e.message);
  }
}

/**
 * Disconnect and log out
 */
async function disconnectBaileys() {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}

  clearAuthData();
  connectionStatus = 'DISCONNECTED';
  currentQrDataUrl = null;
  currentQrRaw = null;
  connectedUserJid = null;
  connectedUserPhone = null;
  isStarting = false;

  console.log('[Baileys Engine] WhatsApp Session disconnected and reset.');
  return getBaileysStatus();
}

/**
 * Get current Baileys connection status
 */
function getBaileysStatus() {
  return {
    status: connectionStatus,
    qrCodeDataUrl: currentQrDataUrl,
    connectedPhone: connectedUserPhone ? `+${connectedUserPhone}` : null,
    connectedJid: connectedUserJid,
    targetGroupId: TARGET_GROUP_ID,
    autoDispatch: true,
    engine: 'Baileys Multi-Device (Native WhatsApp Socket)'
  };
}

/**
/**
 * Format phone number into clean WhatsApp JID (e.g. 0704127233 -> 94704127233@s.whatsapp.net)
 */
function formatWhatsAppCustomerJid(phone) {
  if (!phone) return null;
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '94' + clean.substring(1);
  } else if (!clean.startsWith('94') && clean.length === 9) {
    clean = '94' + clean;
  }
  if (clean.length < 9) return null;
  return `${clean}@s.whatsapp.net`;
}

/**
 * Format customer digital receipt in Sinhala & English
 */
function formatCustomerReceiptMessage(order) {
  const serviceName = order.serviceType === 'CEB'
    ? '💡 CEB Electricity Bill Pay'
    : (order.serviceType === 'HUTCH' ? '📶 Hutch 4G Reload' : (order.serviceType === 'EZCASH' ? '💳 EzCash Wallet Top-Up' : '⚡ Dialog Mega Reload'));

  let connBadge = '';
  if (order.serviceType === 'DIALOG') {
    const connType = (order.dialogConnectionType || 'Mobile').toUpperCase();
    if (connType === 'ROUTER') connBadge = '📶 4G Router';
    else if (connType === 'DTV') connBadge = '📺 Dialog TV';
    else connBadge = '📱 Dialog Mobile';
  }

  const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB');

  let statusEmoji = '⏳';
  let statusText = 'REQUESTED (Order Request එක ලැබී ඇත - Admin අනුමැතිය බලාපොරොත්තුවෙන්)';
  if (order.status === 'READY_FOR_PAYMENT') {
    statusEmoji = '💳';
    statusText = 'READY FOR PAYMENT (Admin අනුමත කර ඇත - කරුණාකර මුදල් ගෙවන්න)';
  } else if (order.status === 'PAYMENT_SUBMITTED') {
    statusEmoji = '📥';
    statusText = 'PAYMENT SUBMITTED (ගෙවීම් පත්‍රිකාව ලැබී ඇත - පරීක්ෂා කරමින් පවතී)';
  } else if (order.status === 'COMPLETED') {
    statusEmoji = '✅';
    statusText = 'COMPLETED (සාර්ථකව සම්පූර්ණ කරන ලදී)';
  } else if (order.status === 'PROCESSING') {
    statusEmoji = '🔄';
    statusText = 'PROCESSING (ක්‍රියාත්මක වෙමින් පවතී)';
  } else if (order.status === 'REJECTED' || order.status === 'CANCELLED') {
    statusEmoji = '❌';
    statusText = 'CANCELLED (අවලංගු කරන ලදී)';
  }

  const isPostPay = (parseFloat(order.originalAmount || 0) >= 5000);
  const payWorkflowText = isPostPay 
    ? '💎 Post-Pay Guarantee (5,000+): පළමුව Reload එක දමා Proof ලැබුණු පසු මුදල් ගෙවන්න.'
    : '🔒 Pre-Pay Required (< 5,000): Admin විසින් Bank Details එවූ පසු මුදල් ගෙවන්න. Slip ලැබුණු විගස Reload කරනු ලැබේ.';

  let text = `🧾 *SL RELOAD HUB - DIGITAL RECEIPT* 🧾\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👋 ආයුබෝවන් *${order.customerName || 'පාරිභෝගික භවතා'}*,\n`;
  text += `ඔබගේ ඇණවුම අපගේ පද්ධතියට සාර්ථකව ලැබී ඇත.\n\n`;
  text += `📦 *Order Ref:* #${order.orderReference}\n`;
  text += `⚡ *සේවාව (Service):* ${serviceName}\n`;
  if (connBadge) text += `📟 *සබඳතා වර්ගය:* ${connBadge}\n`;
  text += `🎯 *අංකය (Target Number):* ${order.dialogNumber}\n`;
  if (order.accountHolderName) text += `👤 *නම (Account Name):* ${order.accountHolderName}\n`;
  text += `💰 *Reload Value:* Rs. ${parseFloat(order.originalAmount || 0).toFixed(2)}\n`;
  text += `🎁 *වට්ටම (Discount):* ${order.discountPercentage}% OFF (Saved Rs. ${parseFloat(order.discountAmount || 0).toFixed(2)})\n`;
  text += `💵 *ගෙවිය යුතු මුදල (Final Amount):* Rs. ${parseFloat(order.finalAmount || 0).toFixed(2)}\n`;
  text += `📌 *ගෙවීම් ක්‍රමය:* ${payWorkflowText}\n`;
  if (order.paymentReference) text += `🔖 *Payment Ref:* ${order.paymentReference}\n`;
  if (order.estimatedTime) text += `⏳ *ඇස්තමේන්තුගත කාලය:* ${order.estimatedTime}\n`;
  text += `⏰ *දිනය සහ වේලාව:* ${timeStr} | ${dateStr}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👉 *වත්මන් තත්ත්වය:* ${statusEmoji} *${statusText}*\n`;
  if (order.adminNotes) text += `📝 *Admin Remarks:* ${order.adminNotes}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📢 *සටහන:* Admin විසින් Order එක පරීක්ෂා කර ක්‍රියාත්මක කළ සැණින් මෙම පණිවිඩය යාවත්කාලීන වේ.\n\n`;
  text += `ස්තූතියි! *SL Reload Hub Team* 🇱🇰`;

  return text;
}

/**
 * Format payment request message with Bank details for Customer WhatsApp
 */
function formatCustomerPaymentRequestMessage(order, estimatedTime, bankAccounts = []) {
  const serviceName = order.serviceType === 'CEB'
    ? '💡 CEB Electricity Bill Pay'
    : (order.serviceType === 'HUTCH' ? '📶 Hutch 4G Reload' : (order.serviceType === 'EZCASH' ? '💳 EzCash Wallet Top-Up' : '⚡ Dialog Mega Reload'));

  let bankListText = '';
  if (Array.isArray(bankAccounts) && bankAccounts.length > 0) {
    bankAccounts.forEach(b => {
      bankListText += `🏛️ *${b.bankName}*\n   • Account No: *${b.accountNumber}*\n   • Name: ${b.accountName}\n   • Branch: ${b.branch}\n\n`;
    });
  } else {
    bankListText = `🏛️ *Commercial Bank:* 800912345678 (DIALOG RELOAD HUB)\n🏛️ *BOC (Bank of Ceylon):* 009876543210 (DIALOG RELOAD HUB)\n🏛️ *Sampath Bank:* 109823456789 (DIALOG RELOAD HUB)\n\n`;
  }

  let text = `💳 *SL RELOAD HUB - PAYMENT REQUEST* 💳\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👋 ආයුබෝවන් *${order.customerName || 'පාරිභෝගික භවතා'}*,\n`;
  text += `ඔබගේ Order Request එක (*#${order.orderReference}*) Admin විසින් අනුමත කරන ලදී! ✅\n\n`;
  text += `📦 *Order Reference:* #${order.orderReference}\n`;
  text += `⚡ *සේවාව:* ${serviceName}\n`;
  text += `🎯 *අංකය:* ${order.dialogNumber}\n`;
  text += `💰 *Reload Value:* Rs. ${parseFloat(order.originalAmount || 0).toFixed(2)}\n`;
  text += `🎁 *වට්ටම (Discount):* ${order.discountPercentage}% OFF\n`;
  text += `💵 *ගෙවිය යුතු මුදල:* *Rs. ${parseFloat(order.finalAmount || 0).toFixed(2)}*\n`;
  text += `⏳ *ඇස්තමේන්තුගත කාලය:* ${estimatedTime || 'විනාඩි 5 - 15ක් ඇතුළත'}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `🏦 *අපගේ බැංකු ගිණුම් විස්තර (Bank Accounts):*\n\n`;
  text += `${bankListText}`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📤 *ගෙවීම සිදුකරන ආකාරය:*\n`;
  text += `1️⃣ ඉහත ගිණුමකට මුදල් තැන්පත් කරන්න.\n`;
  text += `2️⃣ Payment Slip එකේ Photo එකක් මෙම WhatsApp chat එකටම එවන්න (හෝ පහත Link එකෙන් Upload කරන්න):\n`;
  text += `🔗 http://localhost:5000 (Order Status & Upload)\n\n`;
  text += `⚡ ඔබ Slip එක එවූ විගස රීලෝඩ් එක දමා *Proof Screenshot* එකක් මෙහි WhatsApp මගින්ම ඔබ වෙත එවනු ලැබේ!\n\n`;
  text += `ස්තූතියි! *SL Reload Hub Team* 🇱🇰`;

  return text;
}

/**
 * Format status change update notification for customer
 */
function formatCustomerStatusUpdateMessage(order, newStatus, adminNotes) {
  const isDone = newStatus === 'COMPLETED';
  const isRejected = newStatus === 'REJECTED' || newStatus === 'CANCELLED';
  const isProcessing = newStatus === 'PROCESSING';

  let title = isDone ? '🎉 *RELOAD COMPLETED SUCCESSFULLY!*' : (isRejected ? '⚠️ *ORDER UPDATE - CANCELLED*' : (isProcessing ? '🔄 *ORDER UPDATE - PROCESSING*' : '🔔 *ORDER STATUS UPDATE*'));
  let statusEmoji = isDone ? '✅' : (isRejected ? '❌' : (isProcessing ? '🔄' : '🔔'));

  let text = `${title}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👋 ආයුබෝවන් *${order.customerName || 'පාරිභෝගික භවතා'}*,\n\n`;
  text += `ඔබගේ ඇණවුම *#${order.orderReference}* යාවත්කාලීන විය.\n\n`;
  text += `📦 *Order Reference:* #${order.orderReference}\n`;
  text += `🎯 *අංකය:* ${order.dialogNumber}\n`;
  text += `💰 *Reload Value:* Rs. ${parseFloat(order.originalAmount || 0).toFixed(2)}\n`;
  text += `👉 *නව තත්ත්වය (Status):* ${statusEmoji} *${newStatus}*\n`;
  if (adminNotes) {
    text += `📝 *විස්තරය (Remarks/Slip ID):* ${adminNotes}\n`;
  }
  text += `⏰ *යාවත්කාලීන වූ වේලාව:* ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (isDone) {
    text += `🌟 ඔබගේ Reload / Bill Payment එක සාර්ථකව සිදුකර අවසන්! අපගේ සේවාව ලබාගැනීම ගැන ස්තූතියි.\n\n`;
  } else if (isRejected) {
    text += `⚠️ ඔබගේ ගෙවීම් පත්‍රිකාවේ (Slip) ගැටලුවක් ඇත්නම් කරුණාකර Admin සම්බන්ධ කරගන්න.\n\n`;
  }
  text += `ස්තූතියි! *SL Reload Hub Team* 🇱🇰`;

  return text;
}

/**
 * Send Automated Notification Message directly to WhatsApp Group
 */
async function sendBaileysGroupMessage(groupId, text) {
  const targetJid = (groupId || TARGET_GROUP_ID).includes('@g.us') 
    ? (groupId || TARGET_GROUP_ID) 
    : `${groupId || TARGET_GROUP_ID}@g.us`;

  if (!sock || connectionStatus !== 'CONNECTED') {
    console.warn(`[Baileys Engine] ⚠️ Not connected. WhatsApp Group alert queued for ${targetJid}.`);
    return {
      success: false,
      reason: 'not_connected',
      targetJid,
      message: text
    };
  }

  try {
    console.log(`[Baileys Engine] 🚀 Auto-Dispatching message directly to WhatsApp Group: ${targetJid}...`);
    const sent = await sock.sendMessage(targetJid, { text });
    console.log(`[Baileys Engine] ✅ Message successfully delivered to ${targetJid}! Message ID:`, sent?.key?.id);
    return {
      success: true,
      messageId: sent?.key?.id,
      messageKey: sent?.key,
      targetJid,
      dispatched: true
    };
  } catch (err) {
    console.error(`[Baileys Engine] ❌ Error sending message to ${targetJid}:`, err.message);
    return {
      success: false,
      error: err.message,
      targetJid,
      dispatched: false
    };
  }
}

/**
 * Send Automated Digital Receipt directly to Customer's WhatsApp
 */
async function sendBaileysCustomerReceipt(order) {
  const customerPhone = order.customerWhatsApp || order.customerPhone || order.dialogNumber;
  const customerJid = formatWhatsAppCustomerJid(customerPhone);

  if (!customerJid) {
    console.log(`[Baileys Engine] No valid customer WhatsApp number for Order #${order.orderReference} (${customerPhone})`);
    return { success: false, reason: 'invalid_phone' };
  }

  if (!sock || connectionStatus !== 'CONNECTED') {
    console.warn(`[Baileys Engine] ⚠️ Not connected. Customer digital receipt queued for ${customerJid}.`);
    return { success: false, reason: 'not_connected', customerJid };
  }

  try {
    const text = formatCustomerReceiptMessage(order);
    console.log(`[Baileys Engine] 📲 Auto-Sending Digital Receipt directly to Customer WhatsApp: ${customerJid}...`);
    const sent = await sock.sendMessage(customerJid, { text });
    console.log(`[Baileys Engine] ✅ Digital Receipt successfully delivered to customer: ${customerJid}! Message ID:`, sent?.key?.id);
    return {
      success: true,
      messageKey: sent?.key,
      messageId: sent?.key?.id,
      customerJid
    };
  } catch (err) {
    console.error(`[Baileys Engine] ❌ Error sending receipt to customer ${customerJid}:`, err.message);
    return {
      success: false,
      error: err.message,
      customerJid
    };
  }
}

/**
 * Send Payment Request directly to Customer's WhatsApp
 */
async function sendBaileysCustomerPaymentRequest(order, estimatedTime, bankAccounts) {
  const customerPhone = order.customerWhatsApp || order.customerPhone || order.dialogNumber;
  const customerJid = formatWhatsAppCustomerJid(customerPhone);

  if (!customerJid || !sock || connectionStatus !== 'CONNECTED') {
    return { success: false, reason: 'not_connected_or_invalid_phone' };
  }

  try {
    const text = formatCustomerPaymentRequestMessage(order, estimatedTime, bankAccounts);
    console.log(`[Baileys Engine] 💳 Auto-Sending Payment Request to Customer: ${customerJid}...`);
    const sent = await sock.sendMessage(customerJid, { text });
    return { success: true, messageId: sent?.key?.id };
  } catch (err) {
    console.error(`[Baileys Engine] ❌ Error sending payment request:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Real-time WhatsApp Message Edit & Status Update Dispatcher with Proof Photo Support
 */
async function updateBaileysOrderStatus(order, oldStatus, newStatus, adminNotes, proofImageBase64 = null, estimatedTime = null, bankAccounts = []) {
  const customerPhone = order.customerWhatsApp || order.customerPhone || order.dialogNumber;
  const customerJid = formatWhatsAppCustomerJid(customerPhone);
  const updatedOrder = { 
    ...order, 
    status: newStatus, 
    adminNotes: adminNotes || order.adminNotes,
    proofImageUrl: proofImageBase64 || order.proofImageUrl,
    estimatedTime: estimatedTime || order.estimatedTime
  };

  if (!sock || connectionStatus !== 'CONNECTED') {
    console.warn('[Baileys Engine] ⚠️ Socket not connected. Cannot edit/send live WhatsApp status update.');
    return { success: false, reason: 'not_connected' };
  }

  // 1. If Status is READY_FOR_PAYMENT, send Payment Request message to customer
  if (newStatus === 'READY_FOR_PAYMENT') {
    await sendBaileysCustomerPaymentRequest(updatedOrder, estimatedTime, bankAccounts);
  }

  // 2. If Status is COMPLETED and proofImageBase64 is provided, SEND PROOF IMAGE DIRECTLY TO CUSTOMER!
  if (customerJid && newStatus === 'COMPLETED' && proofImageBase64 && proofImageBase64.startsWith('data:image')) {
    try {
      console.log(`[Baileys Engine] 📷 Sending RELOAD PROOF PHOTO directly to Customer WhatsApp: ${customerJid}...`);
      const base64Data = proofImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      const captionText = `📸 *RELOAD TRANSACTION PROOF PHOTO*\n━━━━━━━━━━━━━━━━━━━━━\n✅ *Order Ref:* #${order.orderReference}\n🎯 *Target:* ${order.dialogNumber}\n💰 *Amount:* Rs. ${parseFloat(order.originalAmount || 0).toFixed(2)}\n${adminNotes ? `📝 *Transaction Slip / Remarks:* ${adminNotes}\n` : ''}⏰ *Delivered At:* ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\n━━━━━━━━━━━━━━━━━━━━━\n🌟 ඔබගේ ගිණුමට Reload එක සාර්ථකව බැර කරන ලදී! SL Reload Hub වෙතින්.\nස්තූතියි! 🇱🇰`;

      await sock.sendMessage(customerJid, {
        image: imageBuffer,
        caption: captionText
      });
      console.log(`[Baileys Engine] ✅ Reload Proof Photo successfully delivered to customer ${customerJid}!`);
    } catch (proofErr) {
      console.error(`[Baileys Engine] ❌ Error sending proof image to customer:`, proofErr.message);
    }
  }

  // 3. Try to Edit the previous receipt message on Customer WhatsApp if messageKey exists
  if (customerJid) {
    const updatedReceiptText = formatCustomerReceiptMessage(updatedOrder);

    if (order.customerMessageKey) {
      try {
        console.log(`[Baileys Engine] ✏️ Attempting to EDIT WhatsApp receipt for customer ${customerJid}...`);
        await sock.sendMessage(customerJid, {
          text: updatedReceiptText,
          edit: order.customerMessageKey
        });
        console.log(`[Baileys Engine] ✅ Customer WhatsApp receipt edited successfully in-place!`);
      } catch (e) {
        console.log(`[Baileys Engine] In-place edit fallback (${e.message}).`);
      }
    }

    // Also send instant status update alert message if not already sent with proof photo
    if (newStatus !== 'COMPLETED' || !proofImageBase64 || !proofImageBase64.startsWith('data:image')) {
      if (newStatus !== 'READY_FOR_PAYMENT') {
        try {
          const updateAlertText = formatCustomerStatusUpdateMessage(updatedOrder, newStatus, adminNotes);
          await sock.sendMessage(customerJid, { text: updateAlertText });
          console.log(`[Baileys Engine] 🔔 Sent status update notification to customer: ${customerJid}`);
        } catch (e) {
          console.warn(`[Baileys Engine] Could not send customer status alert:`, e.message);
        }
      }
    }
  }

  // 4. Notify / Update Admin WhatsApp Group
  try {
    const groupStatusText = `🔔 *ORDER STATUS UPDATED BY ADMIN*\n━━━━━━━━━━━━━━━━━━━━━\n📦 *Order Ref:* #${order.orderReference}\n🎯 *Target:* ${order.dialogNumber}\n👉 *New Status:* *${newStatus}*\n${adminNotes ? `📝 *Remarks:* ${adminNotes}\n` : ''}${estimatedTime ? `⏳ *ETA:* ${estimatedTime}\n` : ''}⏰ *Time:* ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}\n━━━━━━━━━━━━━━━━━━━━━\n🔗 http://localhost:5000`;
    await sendBaileysGroupMessage(TARGET_GROUP_ID, groupStatusText);
  } catch (e) {}

  return { success: true, newStatus };
}

module.exports = {
  startBaileys,
  disconnectBaileys,
  getBaileysStatus,
  sendBaileysGroupMessage,
  sendBaileysCustomerReceipt,
  sendBaileysCustomerPaymentRequest,
  updateBaileysOrderStatus,
  formatWhatsAppCustomerJid,
  formatCustomerReceiptMessage,
  formatCustomerPaymentRequestMessage,
  formatCustomerStatusUpdateMessage,
  TARGET_GROUP_ID
};
