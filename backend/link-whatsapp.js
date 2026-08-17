const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const AUTH_DIR = path.join(__dirname, 'data/baileys_auth');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function start() {
  console.log('\n======================================================');
  console.log('🚀 DIALOG RELOAD HUB - GENUINE WHATSAPP LINKER');
  console.log('======================================================\n');

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  let version = [2, 3000, 1015901307];
  try {
    const v = await fetchLatestBaileysVersion();
    version = v.version;
  } catch (e) {}

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      const userJid = sock.user?.id || '';
      const phone = userJid.split(':')[0] || userJid.split('@')[0];
      console.log('\n======================================================');
      console.log(`🎉 WHATSAPP CONNECTED SUCCESSFULLY as +${phone}!`);
      console.log('All orders will now automatically dispatch to group: 120363410663305077@g.us');
      console.log('======================================================\n');
      process.exit(0);
    }
    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('❌ Logged out from WhatsApp. Please run again to re-link.');
        process.exit(1);
      }
    }
  });

  if (!sock.authState.creds.registered) {
    let inputPhone = '94720346443';
    console.log('Default Phone Number: +94720346443');
    const customPhone = await question('Enter Phone Number (or press ENTER for 94720346443): ');
    if (customPhone.trim()) {
      inputPhone = customPhone.trim().replace(/[^0-9]/g, '');
      if (inputPhone.startsWith('0')) inputPhone = '94' + inputPhone.substring(1);
    }

    console.log(`\n⏳ Requesting official Pairing Code from WhatsApp for +${inputPhone}...`);

    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(inputPhone);
        console.log('\n======================================================');
        console.log(`🔑 OFFICIAL WHATSAPP PAIRING CODE:  [ ${code} ]`);
        console.log('======================================================');
        console.log('\n📲 Instructions on your phone:');
        console.log('1. Open WhatsApp on your phone');
        console.log('2. Go to Settings > Linked Devices (හෝ ⋮ තිත් 3 > Linked Devices)');
        console.log('3. Tap "Link with phone number instead" (දුරකථන අංකය මගින් සම්බන්ධ කරන්න)');
        console.log(`4. Enter this 8-digit code: ${code}`);
        console.log('\n⏳ Waiting for connection on your device...\n');
      } catch (err) {
        console.error('\n❌ Error generating pairing code:', err.message);
        console.log('💡 Tip: Make sure your internet connection is active and the number is on WhatsApp.\n');
        process.exit(1);
      }
    }, 2500);
  } else {
    console.log('✅ WhatsApp is already linked and ready!');
  }
}

start();
