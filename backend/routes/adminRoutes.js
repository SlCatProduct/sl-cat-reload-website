const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');
const StorageService = require('../services/storage');
const { sendAdminGroupNotification, formatAdminGroupMessage } = require('../services/whatsappService');

/**
 * @route   POST /api/admin/login
 * @desc    Admin login and issue JWT token
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username සහ Password ඇතුළත් කරන්න (Username and password are required)'
      });
    }

    const admin = await StorageService.findAdminByUsername(username.trim());
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක් (Invalid credentials)'
      });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'වැරදි පරිශීලක නාමයක් හෝ මුරපදයක් (Invalid credentials)'
      });
    }

    // Sign JWT Token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'සාර්ථකව Login විය (Login successful)',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Login දෝෂයක් (Server error during login)',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/me
 * @desc    Get current admin profile & verify token
 * @access  Private (Admin)
 */
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    const admin = await StorageService.findAdminByUsername(req.admin.username);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    return res.json({
      success: true,
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/change-password
 * @desc    Change admin password
 * @access  Private (Admin)
 */
router.post('/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'නව මුරපදය අවම වශයෙන් අකුරු 6ක් විය යුතුය (Password min 6 chars)'
      });
    }

    const admin = await StorageService.findAdminByUsername(req.admin.username);
    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'වත්මන් මුරපදය වැරදියි (Current password incorrect)'
      });
    }

    await StorageService.changeAdminPassword(req.admin.username, newPassword);
    return res.json({
      success: true,
      message: 'මුරපදය සාර්ථකව වෙනස් කරන ලදී (Password changed successfully)'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard metrics & summary
 * @access  Private (Admin)
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const stats = await StorageService.getStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Stats ලබා ගැනීමේ දෝෂයක්',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with optional filter & search
 * @access  Private (Admin)
 */
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;
    const orders = await StorageService.getOrders({ status, search });

    return res.json({
      success: true,
      data: orders,
      count: orders.length
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Orders ලබා ගැනීමේ දෝෂයක්',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status and admin notes
 * @access  Private (Admin)
 */
router.patch('/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, proofImageUrl, proofImageBase64, estimatedTime } = req.body;

    const allowedStatuses = ['REQUESTED', 'READY_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'වලංගු නොවන Status එකක් (Invalid status)'
      });
    }

    const proofData = proofImageBase64 || proofImageUrl || null;
    const updatedOrder = await StorageService.updateOrderStatus(id, status, adminNotes, proofData, estimatedTime);
    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order එක සොයාගත නොහැක (Order not found)'
      });
    }

    // Auto-update & Edit Customer WhatsApp Receipt + Send Proof Screenshot (if provided) + Notify Group
    const { updateBaileysOrderStatus } = require('../services/baileysService');
    const settings = await StorageService.getSettings();
    updateBaileysOrderStatus(updatedOrder, updatedOrder.status, status, adminNotes, proofData, estimatedTime, settings.bankAccounts).catch(e => {
      console.warn('[Baileys Live Status Update]', e.message);
    });

    return res.json({
      success: true,
      message: `Order status ${status} ලෙස යාවත්කාලීන කරන ලදී සහ WhatsApp Receipt / Proof එක Auto-Sync කරන ලදී!`,
      data: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Status යාවත්කාලීන කිරීමේ දෝෂයක්',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/orders/:id/request-payment
 * @desc    Approve order request and send payment instructions via WhatsApp
 * @access  Private (Admin)
 */
router.post('/orders/:id/request-payment', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedTime = 'විනාඩි 5 - 15ක් ඇතුළත', adminNotes = '' } = req.body;

    const updatedOrder = await StorageService.updateOrderStatus(id, 'READY_FOR_PAYMENT', adminNotes, null, estimatedTime);
    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { updateBaileysOrderStatus } = require('../services/baileysService');
    const settings = await StorageService.getSettings();
    await updateBaileysOrderStatus(updatedOrder, 'REQUESTED', 'READY_FOR_PAYMENT', adminNotes, null, estimatedTime, settings.bankAccounts);

    return res.json({
      success: true,
      message: 'Payment Request එක Customer WhatsApp වෙත සාර්ථකව යවන ලදී!',
      data: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/packages
 * @desc    Get all packages for management
 * @access  Private (Admin)
 */
router.get('/packages', authenticateAdmin, async (req, res) => {
  try {
    const packages = await StorageService.getPackages();
    return res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/packages
 * @desc    Add a new package
 * @access  Private (Admin)
 */
router.post('/packages', authenticateAdmin, async (req, res) => {
  try {
    const { name, category, amount, description, popular, active } = req.body;
    if (!name || !amount) {
      return res.status(400).json({
        success: false,
        message: 'පැකේජයේ නම සහ මුදල ඇතුළත් කරන්න (Name & amount required)'
      });
    }

    const newPkg = await StorageService.addPackage({
      name,
      category,
      amount,
      description,
      popular,
      active
    });

    return res.status(201).json({
      success: true,
      message: 'නව පැකේජය සාර්ථකව එකතු කරන ලදී (Package added)',
      data: newPkg
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/admin/packages/:id
 * @desc    Update a package
 * @access  Private (Admin)
 */
router.put('/packages/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await StorageService.updatePackage(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.json({
      success: true,
      message: 'පැකේජය යාවත්කාලීන කරන ලදී (Package updated)',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   DELETE /api/admin/packages/:id
 * @desc    Delete a package
 * @access  Private (Admin)
 */
router.delete('/packages/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await StorageService.deletePackage(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Package not found' });
    }

    return res.json({
      success: true,
      message: 'පැකේජය ඉවත් කරන ලදී (Package deleted)'
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/settings
 * @desc    Get all store settings
 * @access  Private (Admin)
 */
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const settings = await StorageService.getSettings();
    return res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   PUT /api/admin/settings
 * @desc    Update store settings & bank accounts
 * @access  Private (Admin)
 */
router.put('/settings', authenticateAdmin, async (req, res) => {
  try {
    const updated = await StorageService.updateSettings(req.body);
    return res.json({
      success: true,
      message: 'සැකසුම් සාර්ථකව යාවත්කාලීන කරන ලදී (Settings updated)',
      data: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/whatsapp/test-group-alert
 * @desc    Send a test notification to the configured Admin WhatsApp Group
 * @access  Private (Admin)
 */
router.post('/whatsapp/test-group-alert', authenticateAdmin, async (req, res) => {
  try {
    const settings = await StorageService.getSettings();
    const mockOrder = {
      orderReference: 'TEST-GROUP-' + Math.floor(1000 + Math.random() * 9000),
      serviceType: 'DIALOG',
      dialogNumber: '0771234567',
      originalAmount: 5000,
      discountPercentage: 40,
      discountAmount: 2000,
      finalAmount: 3000,
      customerName: 'Test Admin Alert',
      customerPhone: '0771234567',
      customerWhatsApp: settings.contactWhatsApp || '0771234567',
      paymentMethod: 'Bank Transfer (Test)',
      paymentReference: 'BOC-TEST-001',
      createdAt: new Date().toISOString()
    };

    const dispatchResult = await sendAdminGroupNotification(mockOrder, settings);

    return res.json({
      success: true,
      message: 'Admin WhatsApp Group Test Notification dispatched successfully!',
      data: {
        dispatched: dispatchResult.dispatched,
        previewMessage: dispatchResult.message,
        settings: {
          webhookConfigured: !!settings.whatsappGroupWebhookUrl,
          groupId: settings.whatsappGroupId,
          autoNotify: settings.autoNotifyAdminGroup
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/whatsapp/session-status
 * @desc    Get current built-in WhatsApp QR session status (Baileys Native)
 * @access  Private (Admin)
 */
router.get('/whatsapp/session-status', authenticateAdmin, (req, res) => {
  try {
    const { getBaileysStatus } = require('../services/baileysService');
    return res.json({
      success: true,
      data: getBaileysStatus()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/whatsapp/generate-qr
 * @desc    Generate a fresh authentic WhatsApp Multi-Device QR Code via Baileys
 * @access  Private (Admin)
 */
router.post('/whatsapp/generate-qr', authenticateAdmin, async (req, res) => {
  try {
    const { startBaileys, getBaileysStatus } = require('../services/baileysService');
    await startBaileys(true);
    
    // Give Baileys 1.5s to generate the authentic socket QR
    await new Promise(r => setTimeout(r, 1500));

    return res.json({
      success: true,
      message: 'Genuine WhatsApp Multi-Device QR Code generated successfully!',
      data: getBaileysStatus()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/whatsapp/confirm-pairing
 * @desc    Check & confirm WhatsApp session linkage
 * @access  Private (Admin)
 */
router.post('/whatsapp/confirm-pairing', authenticateAdmin, (req, res) => {
  try {
    const { getBaileysStatus } = require('../services/baileysService');
    return res.json({
      success: true,
      message: 'WhatsApp Session status checked!',
      data: getBaileysStatus()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/admin/whatsapp/disconnect
 * @desc    Disconnect active WhatsApp QR session
 * @access  Private (Admin)
 */
router.post('/whatsapp/disconnect', authenticateAdmin, async (req, res) => {
  try {
    const { disconnectBaileys } = require('../services/baileysService');
    const session = await disconnectBaileys();
    return res.json({
      success: true,
      message: 'WhatsApp Session disconnected and reset.',
      data: session
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/admin/whatsapp/dispatch-log
 * @desc    Get live log of alerts sent to group
 * @access  Private (Admin)
 */
router.get('/whatsapp/dispatch-log', authenticateAdmin, (req, res) => {
  try {
    const { getDispatchedLog } = require('../services/whatsappGatewayService');
    return res.json({
      success: true,
      data: getDispatchedLog()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
