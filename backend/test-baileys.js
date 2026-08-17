const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

console.log('Baileys Loaded successfully!');
console.log('makeWASocket is function:', typeof makeWASocket === 'function');
console.log('useMultiFileAuthState is function:', typeof useMultiFileAuthState === 'function');
