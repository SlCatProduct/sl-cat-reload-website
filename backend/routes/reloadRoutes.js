const express = require('express');
const router = express.Router();
const { calculateDiscount, validateServiceNumber } = require('../utils/calculator');
const StorageService = require('../services/storage');
const { sendAdminGroupNotification } = require('../services/whatsappService');

/**
 * @route   POST /api/calculate
 * @desc    Calculate live discount & final payable price for any service
 * @access  Public
 */
router.post('/calculate', (req, res) => {
  try {
    const { amount, serviceType, connectionType } = req.body;
    
    if (amount === undefined || amount === null || amount === '') {
      return res.status(400).json({
        success: false,
        message: 'මුදල ඇතුළත් කරන්න (Amount is required)'
      });
    }

    const result = calculateDiscount(amount, serviceType || 'DIALOG', connectionType || 'MOBILE');
    
    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        message: result.error,
        data: result
      });
    }

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ගණනය කිරීමේදී දෝෂයක් සිදු විය (Calculation error)',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/validate-number
 * @desc    Validate phone or CEB account number per service
 * @access  Public
 */
router.post('/validate-number', (req, res) => {
  try {
    const { phoneNumber, serviceType, connectionType } = req.body;
    const result = validateServiceNumber(phoneNumber, serviceType || 'DIALOG', connectionType || 'MOBILE');

    return res.json({
      success: result.isValid,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'පරීක්ෂා කිරීමේ දෝෂයක් (Validation error)',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/packages
 * @desc    Get all active reload packages with discount previews
 * @access  Public
 */
router.get('/packages', async (req, res) => {
  try {
    const { service } = req.query;
    const packages = await StorageService.getPackages();
    let activePackages = packages.filter(p => p.active !== false);

    if (service && service !== 'ALL') {
      activePackages = activePackages.filter(p => (p.serviceType || 'DIALOG').toUpperCase() === service.toUpperCase());
    }

    // Attach calculated prices to each package
    const enrichedPackages = activePackages.map(pkg => {
      const calc = calculateDiscount(pkg.amount, pkg.serviceType || 'DIALOG');
      return {
        ...pkg,
        discountPercentage: calc.discountPercentage,
        discountAmount: calc.discountAmount,
        finalAmount: calc.finalAmount,
        savings: calc.savedAmount
      };
    });

    return res.json({
      success: true,
      data: enrichedPackages
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'පැකේජ ලබා ගැනීමේ දෝෂයක් (Error fetching packages)',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/settings/public
 * @desc    Get public site settings, bank accounts and contact details
 * @access  Public
 */
router.get('/settings/public', async (req, res) => {
  try {
    const settings = await StorageService.getSettings();
    return res.json({
      success: true,
      data: {
        siteTitle: settings.siteTitle,
        contactWhatsApp: settings.contactWhatsApp,
        bankAccounts: settings.bankAccounts,
        ezCashNumber: settings.ezCashNumber,
        discountRules: settings.discountRules,
        noticeBanner: settings.noticeBanner
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'තොරතුරු ලබා ගැනීමේ දෝෂයක් (Error fetching settings)',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/orders
 * @desc    Submit a new Reload / Bill Payment order
 * @access  Public
 */
router.post('/orders', async (req, res) => {
  try {
    const {
      serviceType = 'DIALOG',
      dialogConnectionType = 'Mobile',
      dialogNumber, // Or CEB Account / EzCash number / Hutch number
      accountHolderName,
      reloadType,
      amount,
      customerName,
      customerPhone,
      customerWhatsApp,
      paymentMethod,
      bankSelected,
      paymentReference,
      paymentSlipUrl
    } = req.body;

    const selectedService = (serviceType || 'DIALOG').toUpperCase();
    const connType = (dialogConnectionType || 'Mobile').toUpperCase();

    // 1. Validate Target Number / Account Number
    const validation = validateServiceNumber(dialogNumber, selectedService, connType);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // 2. Strict backend discount calculation per service
    const calcResult = calculateDiscount(amount, selectedService, connType);
    if (!calcResult.isValid) {
      return res.status(400).json({
        success: false,
        message: calcResult.error
      });
    }

    // 3. Create and store order
    const orderPayload = {
      serviceType: selectedService,
      dialogConnectionType: selectedService === 'DIALOG' ? dialogConnectionType : undefined,
      dialogNumber: validation.formattedNumber,
      accountHolderName: accountHolderName || '',
      reloadType: reloadType || (selectedService === 'CEB' ? 'Electricity Bill' : 'Prepaid'),
      originalAmount: calcResult.originalAmount,
      discountPercentage: calcResult.discountPercentage,
      discountAmount: calcResult.discountAmount,
      finalAmount: calcResult.finalAmount,
      customerName: (customerName || '').trim() || 'Valued Customer',
      customerPhone: customerPhone || validation.formattedNumber,
      customerWhatsApp: customerWhatsApp || customerPhone || validation.formattedNumber,
      paymentMethod: paymentMethod || 'Bank Transfer',
      bankSelected: bankSelected || '',
      paymentReference: paymentReference || '',
      paymentSlipUrl: paymentSlipUrl || ''
    };

    const createdOrder = await StorageService.createOrder(orderPayload);

    // 4. Automated Async Dispatch to Admin WhatsApp Group
    try {
      const siteSettings = await StorageService.getSettings();
      sendAdminGroupNotification(createdOrder, siteSettings).catch(err => {
        console.warn('[WhatsApp Auto-Notify Error]', err.message);
      });
    } catch (notifyErr) {
      console.warn('[WhatsApp Auto-Notify Setup Error]', notifyErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'ඇණවුම සාර්ථකව යොමු කරන ලදී (Order submitted successfully)',
      data: createdOrder
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'ඇණවුම යොමු කිරීමේදී දෝෂයක් සිදු විය (Error creating order)',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/orders/track/:reference
 * @desc    Track order status by Order Reference or Target Number
 * @access  Public
 */
router.get('/orders/track/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    
    if (!reference) {
      return res.status(400).json({
        success: false,
        message: 'Order Reference අංකය හෝ ගිණුම් අංකය ඇතුළත් කරන්න'
      });
    }

    const order = await StorageService.getOrderByReference(reference);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'මෙම අංකයට අදාළ ඇණවුමක් සොයා ගැනීමට නොහැකි විය (No order found for this reference or phone)'
      });
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Order tracking දෝෂයක් (Tracking error)',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/orders/track/:reference/upload-slip
 * @desc    Customer uploads bank slip for an approved order
 * @access  Public
 */
router.post('/orders/track/:reference/upload-slip', async (req, res) => {
  try {
    const { reference } = req.params;
    const { paymentSlipUrl, paymentReference, bankSelected } = req.body;

    if (!paymentSlipUrl && !paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'ගෙවීම් පත්‍රිකාව (Slip Photo) හෝ Reference අංකය ඇතුළත් කරන්න'
      });
    }

    const updatedOrder = await StorageService.attachPaymentSlip(reference, {
      paymentSlipUrl,
      paymentReference,
      bankSelected
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Auto-update Baileys WhatsApp & notify group
    const { updateBaileysOrderStatus, sendBaileysGroupMessage, TARGET_GROUP_ID } = require('../services/baileysService');
    updateBaileysOrderStatus(updatedOrder, 'READY_FOR_PAYMENT', 'PAYMENT_SUBMITTED', 'Customer uploaded payment slip').catch(e => {
      console.warn('[Slip Upload Live Sync]', e.message);
    });

    try {
      const alertText = `📥 *NEW PAYMENT SLIP UPLOADED!*\n━━━━━━━━━━━━━━━━━━━━━\n📦 *Order Ref:* #${updatedOrder.orderReference}\n🎯 *Target:* ${updatedOrder.dialogNumber}\n💰 *Amount to Collect:* Rs. ${updatedOrder.finalAmount}\n🔖 *Slip Ref:* ${paymentReference || 'Image Attached'}\n👉 *Status:* PAYMENT_SUBMITTED (Ready for Fulfillment)\n🔗 http://localhost:5000 (Admin Portal)`;
      await sendBaileysGroupMessage(TARGET_GROUP_ID, alertText);
    } catch (e) {}

    return res.json({
      success: true,
      message: 'ගෙවීම් පත්‍රිකාව සාර්ථකව ලැබී ඇත! Admin විසින් පරීක්ෂා කර සුළු වේලාවකින් Reload කර Proof එක WhatsApp වෙත එවනු ලැබේ.',
      data: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
