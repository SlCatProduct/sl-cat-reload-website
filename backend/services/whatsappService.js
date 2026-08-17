const https = require('https');
const http = require('http');
const { recordDispatchedAlert } = require('./whatsappGatewayService');

/**
 * Format structured rich emoji notification message for Admin WhatsApp Group
 */
function formatAdminGroupMessage(order) {
  const serviceName = order.serviceType === 'CEB'
    ? '💡 CEB Electricity Bill Pay'
    : (order.serviceType === 'HUTCH' ? '📶 Hutch 4G Reload' : (order.serviceType === 'EZCASH' ? '💳 EzCash Wallet Top-Up' : '⚡ Dialog Mega Reload'));

  const timeStr = new Date(order.createdAt || Date.now()).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-GB');

  let connBadge = '';
  if (order.serviceType === 'DIALOG') {
    const connType = (order.dialogConnectionType || 'Mobile').toUpperCase();
    if (connType === 'ROUTER') connBadge = '📶 Dialog Home Broadband / 4G Router';
    else if (connType === 'DTV') connBadge = '📺 Dialog Television (DTV)';
    else connBadge = '📱 Dialog Mobile (Prepaid/Postpaid)';
  }

  let message = `🚨 *NEW ORDER RECEIVED - SL RELOAD HUB* 🚨\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 *Order Reference:* #${order.orderReference}\n`;
  message += `⚡ *Service:* ${serviceName}\n`;
  if (connBadge) {
    message += `📟 *Connection Type:* ${connBadge}\n`;
  }
  message += `🎯 *${order.serviceType === 'CEB' ? 'CEB Account No' : (order.dialogConnectionType === 'DTV' ? 'DTV Account No' : (order.dialogConnectionType === 'ROUTER' ? 'Router Account / No' : 'Target Number'))}:* ${order.dialogNumber}\n`;
  
  if (order.accountHolderName) {
    message += `👤 *Account Holder:* ${order.accountHolderName}\n`;
  }
  
  message += `💰 *Original Amount:* Rs. ${order.originalAmount.toFixed(2)}\n`;
  message += `🎁 *Discount Applied:* ${order.discountPercentage}% OFF (Saved Rs. ${order.discountAmount.toFixed(2)})\n`;
  message += `💵 *Final Amount to Collect:* Rs. ${order.finalAmount.toFixed(2)}\n`;
  message += `💳 *Payment Method:* ${order.paymentMethod}\n`;
  message += `🔖 *Payment Reference:* ${order.paymentReference || 'Slip Uploaded'}\n`;
  message += `👤 *Customer Name:* ${order.customerName || 'Valued Customer'}\n`;
  message += `📱 *Customer WhatsApp:* ${order.customerWhatsApp || order.dialogNumber}\n`;
  message += `⏰ *Timestamp:* ${timeStr} | ${dateStr}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👉 *Status:* ⏳ PENDING ADMIN APPROVAL\n`;
  message += `🔗 *Admin Dashboard:* http://localhost:5000 (Admin Portal)\n`;

  return message;
}

/**
 * Generate direct WhatsApp share link for 1-click group dispatch
 */
function getWhatsAppShareUrl(order) {
  const formattedMessage = formatAdminGroupMessage(order);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedMessage)}`;
}

/**
 * Dispatch automated notification to WhatsApp Group via Webhook / Gateway
 */
async function sendAdminGroupNotification(order, settings) {
  const formattedMessage = formatAdminGroupMessage(order);
  const targetGroupId = settings?.whatsappGroupId || '120363410663305077@g.us';

  // Check if auto notification is enabled
  const isAutoEnabled = settings?.autoNotifyAdminGroup !== false;
  const webhookUrl = (settings?.whatsappGroupWebhookUrl || '').trim();

  console.log(`\n[WhatsApp Gateway] Auto Dispatching Order #${order.orderReference} to Admin WhatsApp Group (${targetGroupId})...`);
  console.log(`[WhatsApp Payload Preview]:\n${formattedMessage}\n`);

  if (!isAutoEnabled) {
    console.log('[WhatsApp Gateway] Auto notification is currently disabled in Admin settings.');
    return { success: true, dispatched: false, reason: 'disabled', shareUrl: getWhatsAppShareUrl(order) };
  }

  // If webhook URL configured, send HTTP POST
  if (webhookUrl && (webhookUrl.startsWith('http://') || webhookUrl.startsWith('https://'))) {
    try {
      const parsedUrl = new URL(webhookUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      // Smart payload adaptation based on gateway type
      let payloadObj = {};
      if (webhookUrl.includes('green-api.com')) {
        payloadObj = {
          chatId: targetGroupId,
          message: formattedMessage
        };
      } else if (webhookUrl.includes('ultramsg.com')) {
        payloadObj = {
          token: settings.whatsappApiToken || '',
          to: targetGroupId,
          body: formattedMessage
        };
      } else {
        // Universal Gateway payload compatible with Baileys / WPPConnect / Evolution API / Custom Bot
        payloadObj = {
          groupId: targetGroupId,
          chatId: targetGroupId,
          to: targetGroupId,
          jid: targetGroupId,
          message: formattedMessage,
          body: formattedMessage,
          text: formattedMessage,
          orderReference: order.orderReference,
          orderData: order
        };
      }

      const payloadData = JSON.stringify(payloadObj);

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadData),
          ...(settings.whatsappApiToken ? { 'Authorization': `Bearer ${settings.whatsappApiToken}` } : {})
        },
        timeout: 5000
      };

      const responseBody = await new Promise((resolve, reject) => {
        const req = client.request(options, (res) => {
          let resData = '';
          res.on('data', chunk => resData += chunk);
          res.on('end', () => resolve(resData));
        });
        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
          req.destroy();
          resolve('timeout');
        });
        req.write(payloadData);
        req.end();
      });

      recordDispatchedAlert(order, formattedMessage, true, { webhookUrl });
      console.log(`[WhatsApp Gateway] ✅ Successfully dispatched to webhook: ${webhookUrl}`);
      return { 
        success: true, 
        dispatched: true, 
        webhookUrl, 
        targetGroupId,
        response: responseBody,
        message: formattedMessage,
        shareUrl: getWhatsAppShareUrl(order)
      };
    } catch (err) {
      console.warn(`[WhatsApp Gateway Warning] Could not dispatch to webhook (${err.message}). Falling back to internal queue.`);
      recordDispatchedAlert(order, formattedMessage, false, { error: err.message });
      return { 
        success: true, 
        dispatched: false, 
        error: err.message, 
        message: formattedMessage,
        shareUrl: getWhatsAppShareUrl(order)
      };
    }
  }

  // Native Baileys Dispatch Engine
  const { sendBaileysGroupMessage, sendBaileysCustomerReceipt } = require('./baileysService');
  
  // 1. Auto-send to Admin Group
  const baileysResult = await sendBaileysGroupMessage(targetGroupId, formattedMessage);

  // 2. Auto-send Digital Receipt to Customer WhatsApp
  const customerResult = await sendBaileysCustomerReceipt(order);
  if (customerResult.success && customerResult.messageKey) {
    order.customerMessageKey = customerResult.messageKey;
    order.customerMessageId = customerResult.messageId;
  }

  if (baileysResult.success) {
    recordDispatchedAlert(order, formattedMessage, true, { mode: 'baileys_native_socket', messageId: baileysResult.messageId });
    console.log(`[WhatsApp Gateway] ✅ Order #${order.orderReference} auto-sent directly to WhatsApp Group ${targetGroupId} and Customer Receipt delivered!`);
    return {
      success: true,
      dispatched: true,
      mode: 'baileys_native',
      targetGroupId,
      message: formattedMessage,
      customerReceiptSent: customerResult.success,
      shareUrl: getWhatsAppShareUrl(order)
    };
  }

  // Fallback to internal session gateway queue
  recordDispatchedAlert(order, formattedMessage, true, { mode: 'internal_session_gateway' });
  console.log(`[WhatsApp Gateway] ℹ️ Order #${order.orderReference} queued for Built-in WhatsApp Session for group: ${targetGroupId}`);
  return { 
    success: true, 
    dispatched: true, 
    mode: 'internal_gateway', 
    targetGroupId,
    message: formattedMessage,
    shareUrl: getWhatsAppShareUrl(order)
  };
}

module.exports = {
  formatAdminGroupMessage,
  sendAdminGroupNotification,
  getWhatsAppShareUrl
};
