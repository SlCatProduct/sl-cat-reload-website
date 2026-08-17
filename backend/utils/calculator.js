/**
 * Multi-Service Recharge & Utility Discount Calculator & Validator
 * 
 * Services Supported:
 * 1. DIALOG (Dialog Mobile & Broadband):
 *    - Standard Tier (<= Rs. 1,000): 15% Discount
 *    - Limit Alert (1,001 - 4,999): Suggest upgrade to 5000
 *    - Mega Saver (>= Rs. 5,000): 40% MEGA Discount
 * 
 * 2. HUTCH (Hutch 4G Reload):
 *    - >= Rs. 5,000: 10% Discount
 *    - < Rs. 5,000: 5% Discount
 * 
 * 3. EZCASH (EzCash Wallet Top-Up / Cash-in):
 *    - >= Rs. 5,000: 10% Discount
 *    - < Rs. 5,000: 2% Discount
 * 
 * 4. CEB (Ceylon Electricity Board Bill Payment):
 *    - >= Rs. 5,000: 10% Discount
 *    - < Rs. 5,000: 2% Discount
 */

function calculateDiscount(amount, serviceType = 'DIALOG', connectionType = 'MOBILE') {
  const numericAmount = parseFloat(amount);
  const service = (serviceType || 'DIALOG').toUpperCase();
  const conn = (connectionType || 'MOBILE').toUpperCase();
  
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      serviceType: service,
      error: 'වලංගු මුදලක් ඇතුළත් කරන්න (Enter a valid amount)',
      originalAmount: 0,
      discountPercentage: 0,
      discountRate: 0,
      discountAmount: 0,
      finalAmount: 0,
      savedAmount: 0,
      suggestUpgrade: false
    };
  }

  if (numericAmount < 50) {
    return {
      isValid: false,
      serviceType: service,
      error: 'අවම මුදල රු. 50 කි (Minimum amount is Rs. 50)',
      originalAmount: numericAmount,
      discountPercentage: 0,
      discountRate: 0,
      discountAmount: 0,
      finalAmount: numericAmount,
      savedAmount: 0,
      suggestUpgrade: false
    };
  }

  // Dialog Router & DTV are strictly for 5,000+ orders
  if (service === 'DIALOG' && (conn === 'ROUTER' || conn === 'DTV') && numericAmount < 5000) {
    return {
      isValid: false,
      serviceType: service,
      error: `Dialog ${conn === 'ROUTER' ? '4G Router' : 'Dialog TV (DTV)'} සඳහා ඇණවුම් කළ හැක්කේ රු. 5,000 හෝ ඊට වැඩි අගයන් පමණි (40% MEGA DISCOUNT). රු. 5,000ට අඩු අගයන් සඳහා Mobile Reload පමණක් ලබාගත හැක.`,
      originalAmount: numericAmount,
      discountPercentage: 15,
      discountRate: 0.15,
      discountAmount: Math.round((numericAmount * 0.15) * 100) / 100,
      finalAmount: Math.round((numericAmount * 0.85) * 100) / 100,
      savedAmount: Math.round((numericAmount * 0.15) * 100) / 100,
      tierLabel: 'Router/DTV Requires 5000+',
      suggestUpgrade: true,
      suggestedAmount: 5000,
      suggestedPayable: 3000,
      suggestedSavings: 2000
    };
  }

  let discountPercentage = 0;
  let tierLabel = '';
  let isValid = true;
  let error = '';
  let suggestUpgrade = false;

  switch (service) {
    case 'DIALOG':
      if (numericAmount > 1000 && numericAmount < 5000) {
        return {
          isValid: false,
          serviceType: service,
          error: 'Dialog රු. 5,000ට අඩු රිලෝඩ් සඳහා එක් අංකයකට එක් වරකට ලබාගත හැක්කේ රු. 1,000 දක්වා පමණි. රු. 5,000ක් ලබාගෙන 40%ක දැවැන්ත වට්ටම ලබාගන්න!',
          originalAmount: numericAmount,
          discountPercentage: 15,
          discountRate: 0.15,
          discountAmount: Math.round((numericAmount * 0.15) * 100) / 100,
          finalAmount: Math.round((numericAmount * 0.85) * 100) / 100,
          savedAmount: Math.round((numericAmount * 0.15) * 100) / 100,
          tierLabel: 'Dialog Limit Exceeded',
          suggestUpgrade: true,
          suggestedAmount: 5000,
          suggestedPayable: 3000,
          suggestedSavings: 2000
        };
      } else if (numericAmount >= 5000) {
        discountPercentage = 40;
        tierLabel = '🔥 Dialog Mega Saver (40% MEGA OFF)';
      } else {
        discountPercentage = 15;
        tierLabel = 'Dialog Standard Tier (15% OFF)';
      }
      break;

    case 'HUTCH':
      if (numericAmount < 5000) {
        return {
          isValid: false,
          serviceType: service,
          error: 'Hutch සඳහා අවම මුදල රු. 5,000 කි (10% වට්ටමක් හිමිවේ). කරුණාකර රු. 5,000 හෝ ඊට වැඩි අගයක් තෝරන්න.',
          originalAmount: numericAmount,
          discountPercentage: 10,
          discountRate: 0.10,
          discountAmount: Math.round((numericAmount * 0.10) * 100) / 100,
          finalAmount: Math.round((numericAmount * 0.90) * 100) / 100,
          savedAmount: Math.round((numericAmount * 0.10) * 100) / 100,
          tierLabel: 'Hutch Requires Min Rs. 5,000',
          suggestUpgrade: true,
          suggestedAmount: 5000,
          suggestedPayable: 4500,
          suggestedSavings: 500
        };
      }
      discountPercentage = 10;
      tierLabel = '📶 Hutch Mega Saver (10% OFF)';
      break;

    case 'EZCASH':
      if (numericAmount < 5000) {
        return {
          isValid: false,
          serviceType: service,
          error: 'EzCash Wallet සඳහා අවම මුදල රු. 5,000 කි (10% වට්ටමක් හිමිවේ). කරුණාකර රු. 5,000 හෝ ඊට වැඩි අගයක් තෝරන්න.',
          originalAmount: numericAmount,
          discountPercentage: 10,
          discountRate: 0.10,
          discountAmount: Math.round((numericAmount * 0.10) * 100) / 100,
          finalAmount: Math.round((numericAmount * 0.90) * 100) / 100,
          savedAmount: Math.round((numericAmount * 0.10) * 100) / 100,
          tierLabel: 'EzCash Requires Min Rs. 5,000',
          suggestUpgrade: true,
          suggestedAmount: 5000,
          suggestedPayable: 4500,
          suggestedSavings: 500
        };
      }
      discountPercentage = 10;
      tierLabel = '💳 EzCash Mega Saver (10% OFF)';
      break;

    case 'CEB':
      if (numericAmount < 5000) {
        return {
          isValid: false,
          serviceType: service,
          error: 'CEB විදුලි බිල්පත් සඳහා අවම මුදල රු. 5,000 කි (10% වට්ටමක් හිමිවේ). කරුණාකර රු. 5,000 හෝ ඊට වැඩි අගයක් තෝරන්න.',
          originalAmount: numericAmount,
          discountPercentage: 10,
          discountRate: 0.10,
          discountAmount: Math.round((numericAmount * 0.10) * 100) / 100,
          finalAmount: Math.round((numericAmount * 0.90) * 100) / 100,
          savedAmount: Math.round((numericAmount * 0.10) * 100) / 100,
          tierLabel: 'CEB Requires Min Rs. 5,000',
          suggestUpgrade: true,
          suggestedAmount: 5000,
          suggestedPayable: 4500,
          suggestedSavings: 500
        };
      }
      discountPercentage = 10;
      tierLabel = '💡 CEB Electricity Mega Saver (10% OFF)';
      break;

    default:
      if (numericAmount >= 5000) {
        discountPercentage = 10;
        tierLabel = 'Special Saver (10% OFF)';
      } else {
        discountPercentage = 5;
        tierLabel = 'Standard Tier (5% OFF)';
      }
  }

  const discountRate = discountPercentage / 100;
  const discountAmount = Math.round((numericAmount * discountRate) * 100) / 100;
  const finalAmount = Math.round((numericAmount - discountAmount) * 100) / 100;

  return {
    isValid: true,
    serviceType: service,
    originalAmount: numericAmount,
    discountPercentage,
    discountRate,
    discountAmount,
    finalAmount,
    savedAmount: discountAmount,
    tierLabel,
    suggestUpgrade: false
  };
}

/**
 * Validates identifier per service:
 * - DIALOG: 077, 076, 074, 070
 * - HUTCH: 078, 072
 * - EZCASH: 07X XXX XXXX
 * - CEB: 10-digit Electricity Account Number (Ex: 0123456789 or 1234567890)
 */
function validateServiceNumber(identifier, serviceType = 'DIALOG', connectionType = 'MOBILE') {
  if (!identifier) {
    return { 
      isValid: false, 
      message: serviceType === 'CEB' 
        ? 'CEB 10-ඉලක්කම් ගිණුම් අංකය ඇතුළත් කරන්න (Enter 10-digit CEB Account Number)' 
        : (connectionType === 'DTV' 
            ? 'Dialog TV 8-ඉලක්කම් ගිණුම් අංකය ඇතුළත් කරන්න' 
            : (connectionType === 'ROUTER' ? 'Dialog Router / Broadband අංකය ඇතුළත් කරන්න' : 'දුරකථන අංකය ඇතුළත් කරන්න')) 
    };
  }

  const cleaned = identifier.toString().replace(/[\s\-\(\)]/g, '');
  const service = (serviceType || 'DIALOG').toUpperCase();
  const connType = (connectionType || 'MOBILE').toUpperCase();

  // CEB Electricity Account Validation (10 digits)
  if (service === 'CEB') {
    const isCebAccount = /^[0-9]{10}$/.test(cleaned);
    if (!isCebAccount) {
      return {
        isValid: false,
        message: 'වලංගු 10-ඉලක්කම් CEB විදුලි බිල්පත් ගිණුම් අංකයක් ඇතුළත් කරන්න (Ex: 0123456789)'
      };
    }
    return {
      isValid: true,
      formattedNumber: cleaned,
      serviceType: 'CEB',
      connectionType: 'BILL',
      network: 'CEB Electricity Bill',
      subType: '10-Digit Account Verified',
      message: 'CEB Account Verified'
    };
  }

  // Dialog DTV Validation (8 digits account / smartcard or phone)
  if (service === 'DIALOG' && connType === 'DTV') {
    const isDtvAcc = /^[0-9]{8,12}$/.test(cleaned);
    if (!isDtvAcc) {
      return {
        isValid: false,
        message: 'වලංගු 8-ඉලක්කම් Dialog TV (DTV) ගිණුම් අංකය හෝ Smartcard අංකය ඇතුළත් කරන්න'
      };
    }
    return {
      isValid: true,
      formattedNumber: cleaned,
      serviceType: 'DIALOG',
      connectionType: 'DTV',
      network: 'Dialog Television (DTV)',
      subType: 'DTV Account Verified',
      message: 'Dialog TV Account Verified'
    };
  }

  // Dialog Router / Home Broadband Validation (10-digit landline / account or 074/077 SIM)
  if (service === 'DIALOG' && connType === 'ROUTER') {
    const isRouterAcc = /^[0-9]{8,12}$/.test(cleaned);
    if (!isRouterAcc) {
      return {
        isValid: false,
        message: 'වලංගු Dialog Home Broadband / 4G Router අංකය හෝ ගිණුම් අංකය ඇතුළත් කරන්න'
      };
    }
    return {
      isValid: true,
      formattedNumber: cleaned,
      serviceType: 'DIALOG',
      connectionType: 'ROUTER',
      network: 'Dialog Home Broadband / 4G Router',
      subType: cleaned.startsWith('074') ? '074 Router SIM' : 'Broadband Account Verified',
      message: 'Dialog Broadband Router Verified'
    };
  }

  // Mobile number validation (Dialog Mobile, Hutch, EzCash)
  const localRegex = /^0(7[0-8])[0-9]{7}$/;
  const intlRegex = /^(\+94|94)(7[0-8])[0-9]{7}$/;

  let formattedNumber = cleaned;

  if (localRegex.test(cleaned)) {
    formattedNumber = cleaned;
  } else if (intlRegex.test(cleaned)) {
    formattedNumber = '0' + cleaned.replace(/^(\+94|94)/, '');
  } else {
    return {
      isValid: false,
      message: 'වලංගු ශ්‍රී ලංකා ජංගම දුරකථන අංකයක් ඇතුළත් කරන්න (Ex: 07XXXXXXXX)'
    };
  }

  // Dialog Mobile classification
  if (service === 'DIALOG') {
    const isDialog = /^0(77|76|74|70)/.test(formattedNumber);
    let subType = 'Dialog Mobile';
    if (formattedNumber.startsWith('077')) subType = '077 Flagship Mobile';
    else if (formattedNumber.startsWith('076')) subType = '076 4G Mobile';
    else if (formattedNumber.startsWith('074')) subType = '074 Broadband SIM';
    else if (formattedNumber.startsWith('070')) subType = '070 VoLTE Mobile';

    return {
      isValid: true,
      formattedNumber,
      serviceType: 'DIALOG',
      connectionType: 'MOBILE',
      isDialogPrefix: isDialog,
      network: isDialog ? 'Dialog Axiata' : 'Other Network (Dialog Compatible)',
      subType,
      message: isDialog ? `Dialog Mobile Verified (${subType})` : 'Mobile Number Verified'
    };
  }

  // Hutch classification
  if (service === 'HUTCH') {
    const isHutch = /^0(78|72)/.test(formattedNumber);
    return {
      isValid: true,
      formattedNumber,
      serviceType: 'HUTCH',
      connectionType: 'MOBILE',
      isHutchPrefix: isHutch,
      network: isHutch ? 'Hutch 4G Sri Lanka' : 'SL Mobile Network',
      subType: isHutch ? (formattedNumber.startsWith('078') ? '078 Hutch 4G' : '072 Hutch') : 'Mobile',
      message: isHutch ? 'Hutch Number Verified' : 'Mobile Number Verified'
    };
  }

  // EzCash classification
  return {
    isValid: true,
    formattedNumber,
    serviceType: 'EZCASH',
    connectionType: 'WALLET',
    network: 'EzCash Mobile Wallet',
    subType: 'Wallet Active',
    message: 'EzCash Wallet Verified'
  };
}

module.exports = {
  calculateDiscount,
  validateServiceNumber
};
