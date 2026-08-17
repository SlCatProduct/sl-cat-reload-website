const { calculateDiscount, validateServiceNumber } = require('./utils/calculator');

console.log('--- Testing Multi-Service Discount Rules ---');

const testCases = [
  // Dialog Mobile Tests
  { service: 'DIALOG', conn: 'MOBILE', amount: 1000, expectedPercent: 15, expectedPay: 850, expectedValid: true },
  { service: 'DIALOG', conn: 'MOBILE', amount: 2500, expectedValid: false, expectedSuggest: true },
  { service: 'DIALOG', conn: 'MOBILE', amount: 5000, expectedPercent: 40, expectedPay: 3000, expectedValid: true },
  { service: 'DIALOG', conn: 'MOBILE', amount: 10000, expectedPercent: 40, expectedPay: 6000, expectedValid: true },

  // Dialog Router & DTV (Restricted to 5000+)
  { service: 'DIALOG', conn: 'ROUTER', amount: 1000, expectedValid: false, expectedSuggest: true },
  { service: 'DIALOG', conn: 'ROUTER', amount: 5000, expectedPercent: 40, expectedPay: 3000, expectedValid: true },
  { service: 'DIALOG', conn: 'DTV', amount: 1000, expectedValid: false, expectedSuggest: true },
  { service: 'DIALOG', conn: 'DTV', amount: 5000, expectedPercent: 40, expectedPay: 3000, expectedValid: true },

  // Hutch Tests (5000+ => 10%)
  { service: 'HUTCH', conn: 'MOBILE', amount: 1000, expectedPercent: 5, expectedPay: 950, expectedValid: true },
  { service: 'HUTCH', conn: 'MOBILE', amount: 5000, expectedPercent: 10, expectedPay: 4500, expectedValid: true },
  { service: 'HUTCH', conn: 'MOBILE', amount: 10000, expectedPercent: 10, expectedPay: 9000, expectedValid: true },

  // EzCash Tests (5000+ => 10%)
  { service: 'EZCASH', conn: 'WALLET', amount: 2500, expectedPercent: 2, expectedPay: 2450, expectedValid: true },
  { service: 'EZCASH', conn: 'WALLET', amount: 5000, expectedPercent: 10, expectedPay: 4500, expectedValid: true },
  { service: 'EZCASH', conn: 'WALLET', amount: 10000, expectedPercent: 10, expectedPay: 9000, expectedValid: true },

  // CEB Electricity Tests (5000+ => 10%)
  { service: 'CEB', conn: 'BILL', amount: 2500, expectedPercent: 2, expectedPay: 2450, expectedValid: true },
  { service: 'CEB', conn: 'BILL', amount: 5000, expectedPercent: 10, expectedPay: 4500, expectedValid: true },
  { service: 'CEB', conn: 'BILL', amount: 10000, expectedPercent: 10, expectedPay: 9000, expectedValid: true }
];

let allPassed = true;

testCases.forEach(tc => {
  const result = calculateDiscount(tc.amount, tc.service, tc.conn);
  let pass = false;
  if (tc.expectedValid) {
    pass = result.isValid && result.discountPercentage === tc.expectedPercent && result.finalAmount === tc.expectedPay;
    console.log(`[${tc.service}] Amount: Rs. ${tc.amount} => Discount: ${result.discountPercentage}% | Final: Rs. ${result.finalAmount} [${pass ? '✅ PASS' : '❌ FAIL'}]`);
  } else {
    pass = !result.isValid && result.suggestUpgrade === tc.expectedSuggest;
    console.log(`[${tc.service}] Amount: Rs. ${tc.amount} => Blocked Limit | Upgrade Prompt: ${result.suggestUpgrade} [${pass ? '✅ PASS' : '❌ FAIL'}]`);
  }
  if (!pass) allPassed = false;
});

console.log('\n--- Testing Multi-Service Number & Account Validation ---');
const validationTests = [
  { input: '0771234567', service: 'DIALOG', conn: 'MOBILE', expectValid: true, expectNet: 'Dialog Axiata' },
  { input: '0741234567', service: 'DIALOG', conn: 'ROUTER', expectValid: true, expectNet: 'Dialog Home Broadband / 4G Router' },
  { input: '0112345678', service: 'DIALOG', conn: 'ROUTER', expectValid: true, expectNet: 'Dialog Home Broadband / 4G Router' },
  { input: '12345678', service: 'DIALOG', conn: 'DTV', expectValid: true, expectNet: 'Dialog Television (DTV)' },
  { input: '0789876543', service: 'HUTCH', conn: 'MOBILE', expectValid: true, expectNet: 'Hutch 4G Sri Lanka' },
  { input: '0721234567', service: 'HUTCH', conn: 'MOBILE', expectValid: true, expectNet: 'Hutch 4G Sri Lanka' },
  { input: '0775551234', service: 'EZCASH', conn: 'WALLET', expectValid: true, expectNet: 'EzCash Mobile Wallet' },
  { input: '0123456789', service: 'CEB', conn: 'BILL', expectValid: true, expectNet: 'CEB Electricity Bill' },
  { input: '12345', service: 'CEB', conn: 'BILL', expectValid: false }
];

validationTests.forEach(vt => {
  const v = validateServiceNumber(vt.input, vt.service, vt.conn);
  const pass = v.isValid === vt.expectValid;
  if (!pass) allPassed = false;
  console.log(`[${vt.service} - ${vt.conn}] Target: "${vt.input}" => Valid: ${v.isValid} | Network: ${v.network || 'N/A'} [${pass ? '✅ PASS' : '❌ FAIL'}]`);
});

if (allPassed) {
  console.log('\n🎉 ALL MULTI-SERVICE CALCULATIONS & VALIDATION TESTS PASSED!');
} else {
  console.error('\n❌ SOME TESTS FAILED');
  process.exit(1);
}
