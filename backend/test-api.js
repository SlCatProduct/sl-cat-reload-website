const http = require('http');

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', err => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Multi-Service API Verification Suite ---');
  const port = 5000;

  try {
    // 1. Health
    console.log('\n[Test 1] GET /api/health');
    const health = await makeRequest({ hostname: 'localhost', port, path: '/api/health', method: 'GET' });
    console.log('Status:', health.status, 'Response:', health.data?.status);

    // 2. Dialog Mobile Order (Rs. 5000 => 40% OFF => Rs. 3000)
    console.log('\n[Test 2] POST /api/orders (Dialog Mobile 40% MEGA)');
    const orderDlg = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      serviceType: 'DIALOG',
      dialogConnectionType: 'Mobile',
      dialogNumber: '0771234567',
      amount: 5000,
      customerName: 'Dialog Mobile Customer',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'DLG-MOB-01'
    });
    console.log('Dialog Mobile Order Ref:', orderDlg.data?.data?.orderReference, 'Discount:', orderDlg.data?.data?.discountPercentage + '%', 'Paid:', orderDlg.data?.data?.finalAmount);
    if (orderDlg.data?.data?.finalAmount !== 3000) throw new Error('Dialog Mobile 5000 failed');

    // 2B. Dialog Router Order (Rs. 5000 => 40% OFF => Rs. 3000)
    console.log('\n[Test 2B] POST /api/orders (Dialog Router 40% MEGA)');
    const orderRouter = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      serviceType: 'DIALOG',
      dialogConnectionType: 'Router',
      dialogNumber: '0741234567',
      amount: 5000,
      customerName: 'Dialog Router Customer',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'DLG-RTR-02'
    });
    console.log('Dialog Router Order Ref:', orderRouter.data?.data?.orderReference, 'Discount:', orderRouter.data?.data?.discountPercentage + '%', 'Paid:', orderRouter.data?.data?.finalAmount);
    if (orderRouter.data?.data?.finalAmount !== 3000) throw new Error('Dialog Router 5000 failed');

    // 2C. Dialog TV Order (Rs. 5000 => 40% OFF => Rs. 3000)
    console.log('\n[Test 2C] POST /api/orders (Dialog TV 40% MEGA)');
    const orderDtv = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      serviceType: 'DIALOG',
      dialogConnectionType: 'DTV',
      dialogNumber: '12345678',
      amount: 5000,
      customerName: 'Dialog TV Customer',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'DLG-DTV-03'
    });
    console.log('Dialog TV Order Ref:', orderDtv.data?.data?.orderReference, 'Discount:', orderDtv.data?.data?.discountPercentage + '%', 'Paid:', orderDtv.data?.data?.finalAmount);
    if (orderDtv.data?.data?.finalAmount !== 3000) throw new Error('Dialog TV 5000 failed');

    // 3. Hutch Order (Rs. 5000 => 10% OFF => Rs. 4500)
    console.log('\n[Test 3] POST /api/orders (Hutch 10% OFF)');
    const orderHtc = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      serviceType: 'HUTCH',
      dialogNumber: '0781234567',
      amount: 5000,
      customerName: 'Hutch Customer',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'HTC-PAY-02'
    });
    console.log('Hutch Order Ref:', orderHtc.data?.data?.orderReference, 'Discount:', orderHtc.data?.data?.discountPercentage + '%', 'Paid:', orderHtc.data?.data?.finalAmount);
    if (orderHtc.data?.data?.finalAmount !== 4500) throw new Error('Hutch 5000 failed');

    // 4. EzCash Order (Rs. 5000 => 10% OFF => Rs. 4500)
    console.log('\n[Test 4] POST /api/orders (EzCash 10% OFF)');
    const orderEzc = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      serviceType: 'EZCASH',
      dialogNumber: '0779876543',
      amount: 5000,
      customerName: 'EzCash Customer',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'EZC-PAY-03'
    });
    console.log('EzCash Order Ref:', orderEzc.data?.data?.orderReference, 'Discount:', orderEzc.data?.data?.discountPercentage + '%', 'Paid:', orderEzc.data?.data?.finalAmount);
    if (orderEzc.data?.data?.finalAmount !== 4500) throw new Error('EzCash 5000 failed');

    // 5. CEB Electricity Bill Order (Rs. 5000 => 10% OFF => Rs. 4500)
    console.log('\n[Test 5] POST /api/orders (CEB Electricity Bill 10% OFF)');
    const orderCeb = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      serviceType: 'CEB',
      dialogNumber: '0123456789',
      accountHolderName: 'Perera Residence',
      amount: 5000,
      customerName: 'CEB Customer',
      paymentMethod: 'Bank Transfer',
      paymentReference: 'CEB-PAY-04'
    });
    console.log('CEB Order Ref:', orderCeb.data?.data?.orderReference, 'Discount:', orderCeb.data?.data?.discountPercentage + '%', 'Paid:', orderCeb.data?.data?.finalAmount);
    if (orderCeb.data?.data?.finalAmount !== 4500) throw new Error('CEB 5000 failed');

    console.log('\n=======================================================');
    console.log('🎉 ALL MULTI-SERVICE ENDPOINTS VERIFIED SUCCESSFULLY!');
    console.log('=======================================================');
  } catch (err) {
    console.error('API Verification error:', err);
    process.exit(1);
  }
}

runTests();
