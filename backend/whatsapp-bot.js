const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const AUTH_DIR = path.join(__dirname, 'data/baileys_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const TARGET_GROUP_ID = '120363410663305077@g.us';

let sock = null;

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

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📲 PLEASE SCAN THIS QR CODE WITH WHATSAPP:');
      console.log('(WhatsApp > Settings / ⋮ 3-Dots > Linked Devices > Link a Device)\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      const userJid = sock.user?.id || '';
      const phone = userJid.split(':')[0] || userJid.split('@')[0];
      console.log('\n======================================================');
      console.log(`🟢 CONNECTED TO WHATSAPP AS: +${phone}`);
      console.log(`⚡ Auto-Order Dispatcher is now ACTIVE and RUNNING!`);
      console.log(`🎯 All customer orders will auto-send to: ${TARGET_GROUP_ID}`);
      console.log('======================================================\n');

      // Send a confirmation test message to the group
      sendGroupAlert(`🤖 *Dialog Reload Hub Bot Activated!*\n\n✅ WhatsApp Socket Connected Successfully.\n⚡ Live automated order dispatching is now ACTIVE.`).catch(() => {});
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(`Connection closed (code: ${statusCode}). Resetting for fresh connection...`);

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
