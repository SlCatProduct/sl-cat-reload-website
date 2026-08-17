const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const AUTH_DIR = path.join(DATA_DIR, 'baileys_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const STATUS_FILE = path.join(DATA_DIR, 'whatsapp_status.json');
const FRONTEND_STATUS_FILE = path.join(__dirname, '../frontend/public/whatsapp_status.json');

const TARGET_GROUP_ID = '120363410663305077@g.us';

let sock = null;

function saveStatus(statusData) {
  try {
    const dataStr = JSON.stringify(statusData, null, 2);
    fs.writeFileSync(STATUS_FILE, dataStr);
    const pubDir = path.dirname(FRONTEND_STATUS_FILE);
    if (fs.existsSync(pubDir)) {
      fs.writeFileSync(FRONTEND_STATUS_FILE, dataStr);
    }
  } catch (e) {
    console.warn('[Status Save Warning]', e.message);
  }
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  
  let version = [2, 3000, 1015901307];
  try {
    const v = await fetchLatestBaileysVersion();
    version = v.version;
  } catch (e) {}

  console.log('\n======================================================');
  console.log('⚡ DIALOG RELOAD HUB - BAILEYS WHATSAPP AUTOMATION BOT');
  console.log(`🎯 Target WhatsApp Group: ${TARGET_GROUP_ID}`);
  console.log('======================================================\n');

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📲 PLEASE SCAN THIS QR CODE WITH WHATSAPP:');
      console.log('(WhatsApp > Settings / ⋮ 3-Dots > Linked Devices > Link a Device)\n');
      qrcode.generate(qr, { small: true });

      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, width: 320 });
        saveStatus({
          status: 'PAIRING',
          isConnected: false,
          qrCodeDataUrl: qrDataUrl,
          rawQr: qr,
          connectedPhone: null,
          targetGroupId: TARGET_GROUP_ID,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {}
    }

    if (connection === 'open') {
      const userJid = sock.user?.id || '';
      const phone = userJid.split(':')[0] || userJid.split('@')[0];
      console.log('\n======================================================');
      console.log(`🟢 CONNECTED TO WHATSAPP AS: +${phone}`);
      console.log(`⚡ Auto-Order Dispatcher is now ACTIVE and RUNNING!`);
      console.log(`🎯 All customer orders will auto-send to: ${TARGET_GROUP_ID}`);
      console.log('======================================================\n');

      saveStatus({
        status: 'CONNECTED',
        isConnected: true,
        qrCodeDataUrl: null,
        rawQr: null,
        connectedPhone: `+${phone}`,
        targetGroupId: TARGET_GROUP_ID,
        autoDispatch: true,
        updatedAt: new Date().toISOString()
      });

      // Send confirmation test message to the group
      sendGroupAlert(`🤖 *Dialog Reload Hub Bot Activated!*\n\n✅ WhatsApp Socket Connected Successfully as +${phone}.\n⚡ Live automated order dispatching is now ACTIVE.\n🎯 Group: ${TARGET_GROUP_ID}`).catch(() => {});
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(`Connection closed (code: ${statusCode}). Resetting for fresh connection...`);

      saveStatus({
        status: 'DISCONNECTED',
        isConnected: false,
        qrCodeDataUrl: null,
        connectedPhone: null,
        targetGroupId: TARGET_GROUP_ID,
        updatedAt: new Date().toISOString()
      });

      if (isLoggedOut || statusCode === 401) {
        if (fs.existsSync(AUTH_DIR)) {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        }
      }
      setTimeout(connect, 2000);
    }
  });

  return sock;
}

// Function to send formatted order directly to the group
async function sendGroupAlert(messageText) {
  if (!sock) return false;
  try {
    await sock.sendMessage(TARGET_GROUP_ID, { text: messageText });
    console.log(`[Bot] ✅ Alert dispatched successfully to group: ${TARGET_GROUP_ID}`);
    return true;
  } catch (err) {
    console.error('[Bot] ❌ Failed to dispatch alert:', err.message);
    return false;
  }
}

// Export for integration
module.exports = { connect, sendGroupAlert };

// If executed directly: start immediately
if (require.main === module) {
  connect();
}
