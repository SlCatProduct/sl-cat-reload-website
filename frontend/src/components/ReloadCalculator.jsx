import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  Send, 
  Smartphone, 
  ShieldCheck, 
  Upload, 
  Image as ImageIcon, 
  X, 
  History, 
  Flame, 
  Zap, 
  Lightbulb, 
  FileText,
  Sliders,
  TrendingDown,
  Tv,
  Wifi
} from 'lucide-react';
import { api } from '../services/api';

export default function ReloadCalculator({ 
  selectedService = 'DIALOG', 
  onServiceChange, 
  initialAmount, 
  settings, 
  onOrderSuccess 
}) {
  const [service, setService] = useState(selectedService || 'DIALOG');
  const [dialogConnectionType, setDialogConnectionType] = useState('Mobile'); // 'Mobile' | 'Router' | 'DTV'
  const [reloadType, setReloadType] = useState('Prepaid');
  const [targetNumber, setTargetNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [amount, setAmount] = useState(initialAmount || 5000);
  const [customAmount, setCustomAmount] = useState('');
  
  // Customer Info
  const [customerName, setCustomerName] = useState('');
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  
  // Payment Info
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [selectedBankId, setSelectedBankId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [slipImageBase64, setSlipImageBase64] = useState('');
  
  // Memory
  const [recentNumbers, setRecentNumbers] = useState([]);
  
  // State
  const [calcData, setCalcData] = useState({
    isValid: true,
    serviceType: 'DIALOG',
    originalAmount: 5000,
    discountPercentage: 40,
    discountAmount: 2000,
    finalAmount: 3000,
    savedAmount: 2000,
    tierLabel: '🔥 Dialog Mega Saver (40% MEGA OFF)',
    suggestUpgrade: false
  });
  const [targetStatus, setTargetStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedBankId, setCopiedBankId] = useState(null);

  // Sync service from parent
  useEffect(() => {
    if (selectedService) {
      setService(selectedService);
      setTargetStatus(null);
    }
  }, [selectedService]);

  // Load recent
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`recent_${service}`) || '[]');
      setRecentNumbers(saved);
    } catch (e) {}
  }, [service]);

  // Sync initialAmount
  useEffect(() => {
    if (initialAmount) {
      setAmount(initialAmount);
      setCustomAmount('');
    }
  }, [initialAmount]);

  // Handle live calculation
  useEffect(() => {
    const currentAmt = customAmount !== '' ? parseFloat(customAmount) : amount;
    if (!isNaN(currentAmt) && currentAmt > 0) {
      let discPercent = 0;
      let tierLabel = '';
      let isVal = true;
      let suggestUp = false;

      if (service === 'DIALOG') {
        if (currentAmt < 5000 && dialogConnectionType !== 'Mobile') {
          setDialogConnectionType('Mobile');
        }

        if (currentAmt > 1000 && currentAmt < 5000) {
          isVal = false;
          discPercent = 15;
          tierLabel = 'Dialog Standard Limit Exceeded (Max Rs. 1,000)';
          suggestUp = true;
        } else if (currentAmt >= 5000) {
          discPercent = 40;
          tierLabel = '🔥 Dialog Mega Saver (40% MEGA OFF)';
        } else {
          discPercent = 15;
          tierLabel = 'Dialog Standard Tier (15% OFF)';
        }
      } else if (service === 'HUTCH') {
        if (currentAmt >= 5000) {
          discPercent = 10;
          tierLabel = '📶 Hutch Mega Saver (10% OFF)';
        } else {
          isVal = false;
          discPercent = 10;
          tierLabel = 'Hutch අවම මුදල රු. 5,000 කි (10% OFF)';
          suggestUp = true;
        }
      } else if (service === 'EZCASH') {
        if (currentAmt >= 5000) {
          discPercent = 10;
          tierLabel = '💳 EzCash Mega Saver (10% OFF)';
        } else {
          isVal = false;
          discPercent = 10;
          tierLabel = 'EzCash අවම මුදල රු. 5,000 කි (10% OFF)';
          suggestUp = true;
        }
      } else if (service === 'CEB') {
        if (currentAmt >= 5000) {
          discPercent = 10;
          tierLabel = '💡 CEB Electricity Mega Saver (10% OFF)';
        } else {
          isVal = false;
          discPercent = 10;
          tierLabel = 'CEB අවම මුදල රු. 5,000 කි (10% OFF)';
          suggestUp = true;
        }
      }

      const discountRate = discPercent / 100;
      const discountAmount = Math.round((currentAmt * discountRate) * 100) / 100;
      const finalAmount = Math.round((currentAmt - discountAmount) * 100) / 100;

      setCalcData({
        isValid: isVal,
        serviceType: service,
        originalAmount: currentAmt,
        discountPercentage: discPercent,
        discountRate,
        discountAmount,
        finalAmount,
        savedAmount: discountAmount,
        tierLabel,
        suggestUpgrade: suggestUp,
        suggestedAmount: 5000,
        suggestedPayable: 3000,
        suggestedSavings: 2000
      });
    }
  }, [amount, customAmount, service]);

  const handleTargetChange = async (e, conn = dialogConnectionType) => {
    const rawVal = e.target.value;
    setTargetNumber(rawVal);
    
    if (rawVal.length >= 6) {
      const res = await api.validateNumber(rawVal, service, conn);
      if (res && res.data) {
        setTargetStatus(res.data);
      }
    } else {
      setTargetStatus(null);
    }
  };

  const handleSlipUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('කරුණාකර Image ගොනුවක් පමණක් තෝරන්න (JPG, PNG)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyAccount = (bank) => {
    const textToCopy = `${bank.bankName}\nAccount Name: ${bank.accountName}\nAccount No: ${bank.accountNumber}\nBranch: ${bank.branch}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBankId(bank.id);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setFormError('');

    const targetAmount = customAmount !== '' ? parseFloat(customAmount) : amount;

    if (!targetNumber || targetNumber.length < 6) {
      setFormError(service === 'CEB' 
        ? 'කරුණාකර වලංගු 10-ඉලක්කම් CEB විදුලි බිල්පත් ගිණුම් අංකය ඇතුළත් කරන්න' 
        : (dialogConnectionType === 'DTV' 
            ? 'කරුණාකර වලංගු Dialog TV ගිණුම් අංකය ඇතුළත් කරන්න' 
            : (dialogConnectionType === 'ROUTER' ? 'කරුණාකර වලංගු Dialog Router / Broadband අංකය ඇතුළත් කරන්න' : 'කරුණාකර වලංගු දුරකථන අංකයක් ඇතුළත් කරන්න')));
      return;
    }

    if (service === 'DIALOG' && targetAmount > 1000 && targetAmount < 5000) {
      setFormError('Dialog රු. 5,000ට අඩු රිලෝඩ් සඳහා එක් අංකයකට එක් වරකට ලබාගත හැක්කේ රු. 1,000 දක්වා පමණි. කරුණාකර රු. 1,000 හෝ රු. 5,000 තෝරන්න.');
      return;
    }

    if (service !== 'DIALOG' && targetAmount < 5000) {
      setFormError(`${service} සඳහා අවම ඇණවුම් මුදල රු. 5,000 කි (10% වට්ටමක් හිමිවේ). කරුණාකර රු. 5,000 හෝ ඊට වැඩි අගයක් තෝරන්න.`);
      return;
    }

    if (!customerWhatsApp.trim()) {
      setFormError('කරුණාකර ඔබගේ WhatsApp අංකය ඇතුළත් කරන්න (Order විස්තර හා Proof එවීමට අවශ්‍ය වේ)');
      return;
    }

    setSubmitting(true);

    const bankObj = settings?.bankAccounts?.find(b => b.id === selectedBankId);
    const bankDetails = bankObj ? `${bankObj.bankName} - ${bankObj.accountNumber}` : 'Direct';

    const orderPayload = {
      serviceType: service,
      dialogConnectionType: service === 'DIALOG' ? dialogConnectionType : undefined,
      dialogNumber: targetNumber.trim(),
      accountHolderName: accountHolderName.trim(),
      reloadType: service === 'CEB' ? 'Electricity Bill' : reloadType,
      amount: targetAmount,
      customerName: customerName.trim() || 'Valued Customer',
      customerPhone: targetNumber.trim(),
      customerWhatsApp: customerWhatsApp.trim() || targetNumber.trim(),
      paymentMethod,
      bankSelected: bankDetails,
      paymentReference: paymentReference.trim(),
      paymentSlipUrl: slipImageBase64
    };

    const res = await api.createOrder(orderPayload);
    setSubmitting(false);

    if (res.success && res.data) {
      try {
        const clean = targetNumber.trim();
        const updated = [clean, ...recentNumbers.filter(n => n !== clean)].slice(0, 5);
        localStorage.setItem(`recent_${service}`, JSON.stringify(updated));
        setRecentNumbers(updated);
      } catch (e) {}

      onOrderSuccess(res.data);
    } else {
      setFormError(res.message || 'ඇණවුම යොමු කිරීම අසාර්ථක විය. නැවත උත්සාහ කරන්න.');
    }
  };

  const getPresets = () => {
    switch (service) {
      case 'DIALOG':
        return [
          { value: 100, label: 'Rs. 100', discount: '15% OFF', isMega: false },
          { value: 500, label: 'Rs. 500', discount: '15% OFF', isMega: false },
          { value: 1000, label: 'Rs. 1,000 (Max)', discount: '15% OFF', isMega: false },
          { value: 5000, label: 'Rs. 5,000', discount: '40% MEGA', isMega: true },
          { value: 10000, label: 'Rs. 10,000', discount: '40% MEGA', isMega: true },
          { value: 20000, label: 'Rs. 20,000', discount: '40% MEGA', isMega: true }
        ];
      case 'HUTCH':
        return [
          { value: 5000, label: 'Rs. 5,000', discount: '10% OFF', isMega: true },
          { value: 10000, label: 'Rs. 10,000', discount: '10% OFF', isMega: true },
          { value: 15000, label: 'Rs. 15,000', discount: '10% OFF', isMega: true },
          { value: 20000, label: 'Rs. 20,000', discount: '10% OFF', isMega: true }
        ];
      case 'EZCASH':
        return [
          { value: 5000, label: 'Rs. 5,000', discount: '10% OFF', isMega: true },
          { value: 10000, label: 'Rs. 10,000', discount: '10% OFF', isMega: true },
          { value: 15000, label: 'Rs. 15,000', discount: '10% OFF', isMega: true },
          { value: 20000, label: 'Rs. 20,000', discount: '10% OFF', isMega: true }
        ];
      case 'CEB':
        return [
          { value: 5000, label: 'Rs. 5,000 Bill', discount: '10% OFF', isMega: true },
          { value: 7500, label: 'Rs. 7,500 Bill', discount: '10% OFF', isMega: true },
          { value: 10000, label: 'Rs. 10,000 Bill', discount: '10% OFF', isMega: true },
          { value: 20000, label: 'Rs. 20,000 Bill', discount: '10% OFF', isMega: true }
        ];
      default:
        return [];
    }
  };

  const presets = getPresets();
  const currentAmount = customAmount !== '' ? (parseFloat(customAmount) || 0) : (parseFloat(amount) || 0);

  return (
    <div className="checkout-clean-grid">
      {/* Left Column: Form Controls */}
      <div className="clean-card">
        <div className="clean-card-header">
          <h2>
            <Sparkles size={20} color="#ff7900" />
            1. සේවාව සහ විස්තර (Order Checkout)
          </h2>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.2rem 0.6rem', borderRadius: '9999px', border: '1px solid rgba(16,185,129,0.25)' }}>
            ● Instant Automation
          </span>
        </div>

        {/* Clean Service Switcher Tabs */}
        <div className="clean-tabs">
          <button
            type="button"
            className={`clean-tab-btn ${service === 'DIALOG' ? 'active tab-dialog' : ''}`}
            onClick={() => {
              setService('DIALOG');
              if (onServiceChange) onServiceChange('DIALOG');
            }}
          >
            <Zap size={16} color={service === 'DIALOG' ? '#ff7900' : '#94a3b8'} />
            <span>Dialog</span>
            <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800 }}>40% OFF</span>
          </button>

          <button
            type="button"
            className={`clean-tab-btn ${service === 'HUTCH' ? 'active tab-hutch' : ''}`}
            onClick={() => {
              setService('HUTCH');
              setAmount(5000);
              setCustomAmount('');
              if (onServiceChange) onServiceChange('HUTCH');
            }}
          >
            <Smartphone size={16} color={service === 'HUTCH' ? '#00a8ff' : '#94a3b8'} />
            <span>Hutch</span>
            <span style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800 }}>10% OFF</span>
          </button>

          <button
            type="button"
            className={`clean-tab-btn ${service === 'EZCASH' ? 'active tab-ezcash' : ''}`}
            onClick={() => {
              setService('EZCASH');
              setAmount(5000);
              setCustomAmount('');
              if (onServiceChange) onServiceChange('EZCASH');
            }}
          >
            <CreditCard size={16} color={service === 'EZCASH' ? '#f59e0b' : '#94a3b8'} />
            <span>EzCash</span>
            <span style={{ fontSize: '0.68rem', color: '#fbbf24', fontWeight: 800 }}>10% OFF</span>
          </button>

          <button
            type="button"
            className={`clean-tab-btn ${service === 'CEB' ? 'active' : ''}`}
            onClick={() => {
              setService('CEB');
              setAmount(5000);
              setCustomAmount('');
              if (onServiceChange) onServiceChange('CEB');
            }}
          >
            <Lightbulb size={16} color={service === 'CEB' ? '#10b981' : '#94a3b8'} />
            <span>CEB Bill</span>
            <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 800 }}>10% OFF</span>
          </button>
        </div>

        <form onSubmit={handleSubmitOrder}>
          {/* Dialog Connection Type Selector (Only 5,000+ shows Mobile/Router/DTV; < 5,000 shows Mobile only) */}
          {service === 'DIALOG' && currentAmount >= 5000 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="clean-label" style={{ marginBottom: '0.4rem' }}>
                Dialog සබඳතා වර්ගය තෝරන්න (Select Connection Type):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', background: 'var(--bg-input)', padding: '0.3rem', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
                <button
                  type="button"
                  className={`clean-tab-btn ${dialogConnectionType === 'Mobile' ? 'active tab-dialog' : ''}`}
                  onClick={() => {
                    setDialogConnectionType('Mobile');
                    setTargetStatus(null);
                    if (targetNumber) {
                      api.validateNumber(targetNumber, 'DIALOG', 'MOBILE').then(res => {
                        if (res?.data) setTargetStatus(res.data);
                      });
                    }
                  }}
                >
                  <Phone size={15} />
                  <span>Mobile</span>
                  <span style={{ fontSize: '0.66rem', color: '#10b981' }}>Pre/Post</span>
                </button>

                <button
                  type="button"
                  className={`clean-tab-btn ${dialogConnectionType === 'Router' ? 'active tab-dialog' : ''}`}
                  onClick={() => {
                    setDialogConnectionType('Router');
                    setTargetStatus(null);
                    if (targetNumber) {
                      api.validateNumber(targetNumber, 'DIALOG', 'ROUTER').then(res => {
                        if (res?.data) setTargetStatus(res.data);
                      });
                    }
                  }}
                >
                  <Wifi size={15} />
                  <span>4G Router</span>
                  <span style={{ fontSize: '0.66rem', color: '#10b981' }}>Broadband</span>
                </button>

                <button
                  type="button"
                  className={`clean-tab-btn ${dialogConnectionType === 'DTV' ? 'active tab-dialog' : ''}`}
                  onClick={() => {
                    setDialogConnectionType('DTV');
                    setTargetStatus(null);
                    if (targetNumber) {
                      api.validateNumber(targetNumber, 'DIALOG', 'DTV').then(res => {
                        if (res?.data) setTargetStatus(res.data);
                      });
                    }
                  }}
                >
                  <Tv size={15} />
                  <span>Dialog TV</span>
                  <span style={{ fontSize: '0.66rem', color: '#10b981' }}>DTV Pay</span>
                </button>
              </div>
            </div>
          )}

          {/* Dialog < 5000: Shows only Mobile notice */}
          {service === 'DIALOG' && currentAmount < 5000 && (
            <div style={{
              marginBottom: '1.15rem',
              padding: '0.65rem 0.95rem',
              background: 'rgba(255, 121, 0, 0.06)',
              border: '1px solid rgba(255, 121, 0, 0.2)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--primary-orange)' }}>
                <Phone size={15} />
                <span>📱 Dialog Mobile Reload (15% OFF)</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                💡 Router / DTV සඳහා රු. 5,000 තෝරන්න (40% OFF)
              </span>
            </div>
          )}

          {/* Target Identifier */}
          <div className="clean-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="clean-label" style={{ margin: 0 }}>
                {service === 'CEB' 
                  ? 'CEB විදුලි බිල්පත් ගිණුම් අංකය (10-Digit CEB Account No) *' 
                  : (service === 'HUTCH' 
                      ? 'Hutch දුරකථන අංකය (078 / 072) *' 
                      : (service === 'EZCASH' 
                          ? 'EzCash Wallet අංකය *' 
                          : (dialogConnectionType === 'DTV' 
                              ? 'Dialog TV (DTV) 8-ඉලක්කම් ගිණුම් අංකය (Smartcard No) *' 
                              : (dialogConnectionType === 'ROUTER' 
                                  ? 'Dialog Home Broadband / 4G Router අංකය හෝ ගිණුම් අංකය *' 
                                  : 'Dialog ජංගම දුරකථන අංකය (077/076/074/070) *'))))}
              </label>
              {recentNumbers.length > 0 && (
                <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Recent Numbers</span>
              )}
            </div>

            <div className="clean-input-wrap">
              {service === 'CEB' 
                ? <FileText size={17} className="clean-input-icon" /> 
                : (dialogConnectionType === 'DTV' && service === 'DIALOG' 
                    ? <Tv size={17} className="clean-input-icon" /> 
                    : (dialogConnectionType === 'ROUTER' && service === 'DIALOG' 
                        ? <Wifi size={17} className="clean-input-icon" /> 
                        : <Phone size={17} className="clean-input-icon" />))}
              <input
                type="text"
                className="clean-input with-icon"
                placeholder={service === 'CEB' 
                  ? '0123456789 (10-Digit Account Number)' 
                  : (service === 'HUTCH' 
                      ? '078 123 4567' 
                      : (service === 'EZCASH' 
                          ? '077 123 4567' 
                          : (dialogConnectionType === 'DTV' 
                              ? '8-Digit DTV Account No (Ex: 12345678)' 
                              : (dialogConnectionType === 'ROUTER' 
                                  ? 'Router No (074XXXXXXX) හෝ Account No' 
                                  : '077 123 4567'))))}
                value={targetNumber}
                onChange={handleTargetChange}
                required
              />
              {targetStatus?.isValid && (
                <span style={{ position: 'absolute', right: '0.75rem', fontSize: '0.74rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                  ✓ {targetStatus.network}
                </span>
              )}
            </div>

            {/* Recent chips */}
            {recentNumbers.length > 0 && (
              <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {recentNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className="btn-clean btn-clean-secondary btn-clean-sm"
                    style={{ fontSize: '0.74rem', padding: '0.2rem 0.6rem' }}
                    onClick={() => {
                      setTargetNumber(num);
                      api.validateNumber(num, service).then(res => {
                        if (res?.data) setTargetStatus(res.data);
                      });
                    }}
                  >
                    <History size={11} /> {num}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CEB Account Holder Name */}
          {service === 'CEB' && (
            <div className="clean-form-group">
              <label className="clean-label">
                බිල්පත් හිමියාගේ නම (CEB Account Holder / Premises Name)
              </label>
              <input
                type="text"
                className="clean-input"
                placeholder="Ex: K. A. Perera / Colombo Residence"
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
              />
            </div>
          )}

          {/* Amount Selection */}
          <div className="clean-form-group" style={{ marginTop: '1.15rem' }}>
            <label className="clean-label">
              අවශ්‍ය මුදල (Select Preset Amount)
            </label>

            <div className="clean-amounts-grid">
              {presets.map((p) => {
                const isSelected = customAmount === '' && amount === p.value;
                return (
                  <button
                    type="button"
                    key={p.value}
                    className={`clean-amt-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setAmount(p.value);
                      setCustomAmount('');
                    }}
                  >
                    <div className="chip-title">{p.label}</div>
                    <span className="chip-discount" style={{ color: p.isMega ? '#fbbf24' : '#38bdf8' }}>
                      {p.discount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Amount Input */}
            <div className="clean-input-wrap" style={{ marginTop: '0.5rem' }}>
              <input
                type="number"
                min="50"
                max="100000"
                step="10"
                className="clean-input"
                placeholder={`වෙනත් මුදලක් ඇතුළත් කරන්න (Custom Amount LKR: Ex 5000, 10000)`}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Dialog Upgrade Prompt Banner */}
          {service === 'DIALOG' && calcData.suggestUpgrade && (
            <div style={{
              background: 'rgba(255, 121, 0, 0.08)',
              border: '1px solid rgba(255, 121, 0, 0.35)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#fbbf24', fontWeight: 800, fontSize: '0.88rem' }}>
                <Flame size={16} />
                <span>Dialog Standard Limit (උපරිම රු. 1,000)</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#ffedd5', margin: '0.35rem 0 0.75rem 0' }}>
                Dialog රු. 5,000ට අඩු රිලෝඩ් සඳහා එක් අංකයකට එක් වරකට ලබාගත හැක්කේ <strong>රු. 1,000 දක්වා</strong> පමණි. 
                <br />
                <strong>💡 රු. 5,000ක් ලබාගෙන 40%ක දැවැන්ත වට්ටමක් සහිතව රු. 3,000ක් පමණක් ගෙවන්න!</strong>
              </p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-clean btn-clean-primary btn-clean-sm"
                  onClick={() => {
                    setAmount(5000);
                    setCustomAmount('');
                  }}
                >
                  🔥 Upgrade to Rs. 5,000 (Pay Rs. 3,000)
                </button>
                <button
                  type="button"
                  className="btn-clean btn-clean-secondary btn-clean-sm"
                  onClick={() => {
                    setAmount(1000);
                    setCustomAmount('');
                  }}
                >
                  Set to Rs. 1,000
                </button>
              </div>
            </div>
          )}

          {/* Customer Name & WhatsApp */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginTop: '0.85rem' }}>
            <div className="clean-form-group">
              <label className="clean-label">
                ඔබගේ නම <span className="opt">(විකල්ප)</span>
              </label>
              <input
                type="text"
                className="clean-input"
                placeholder="Kasun Perera"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            <div className="clean-form-group">
              <label className="clean-label">
                WhatsApp අංකය <span className="opt">(Order Alerts & Proof සඳහා)</span>
              </label>
              <input
                type="tel"
                className="clean-input"
                placeholder="07XXXXXXXX"
                value={customerWhatsApp}
                onChange={(e) => setCustomerWhatsApp(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Dynamic Trust & Payment Flow Card: Pre-Pay (< 5000) vs Post-Pay (>= 5000) */}
          {currentAmount < 5000 ? (
            <div style={{
              background: 'rgba(255, 121, 0, 0.08)',
              border: '1px solid rgba(255, 121, 0, 0.3)',
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              margin: '1.25rem 0',
              fontSize: '0.82rem',
              color: '#ffedd5',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'center'
            }}>
              <ShieldCheck size={24} color="#ff7900" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#fed7aa', display: 'block', marginBottom: '0.15rem' }}>
                  🔒 සාමාන්‍ය රිලෝඩ් (&lt; රු. 5,000) ගෙවීම් පටිපාටිය (Pre-Pay):
                </strong>
                <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>
                  Order Request එක යොමු කළ පසු Admin විසින් WhatsApp මගින් ගෙවීම් විස්තර (Bank details) සහ වේලාව එවනු ඇත. ගෙවීම සිදුකළ විගස රිලෝඩ් එක දමනු ලැබේ.
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '0.9rem 1.1rem',
              margin: '1.25rem 0',
              fontSize: '0.82rem',
              color: '#a7f3d0',
              display: 'flex',
              gap: '0.65rem',
              alignItems: 'center'
            }}>
              <ShieldCheck size={24} color="#10b981" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: '#6ee7b7', display: 'block', marginBottom: '0.15rem' }}>
                  💎 රු. 5,000+ විශේෂ Post-Pay වරප්‍රසාදය (Reload First, Pay After):
                </strong>
                <div style={{ fontSize: '0.78rem', opacity: 0.95 }}>
                  පළමුව ඔබගේ අංකයට Reload එක දමා <strong>Proof Screenshot</strong> එක WhatsApp වෙත ලැබුණු පසු මුදල් ගෙවිය හැක! (100% ආරක්ෂිතයි).
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              fontSize: '0.84rem',
              marginBottom: '1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}>
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-clean btn-clean-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem' }}
            disabled={submitting || !calcData.isValid}
          >
            {submitting ? (
              <span>සකසමින් පවතී... (Processing...)</span>
            ) : (
              <>
                <span>ඇණවුම් ඉල්ලීම යොමු කරන්න (Place Order Request)</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Clean Apple/Stripe-Style Receipt Breakdown Card */}
      <div className="receipt-clean-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-hairline)', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={18} color="#ff7900" />
            මිල ගණනය (Summary)
          </h2>
          <span style={{ fontSize: '0.74rem', color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.55rem', borderRadius: '9999px' }}>
            {service}
          </span>
        </div>

        {/* Highlight Badge */}
        <div className={`receipt-badge-highlight ${calcData.discountPercentage >= 40 ? 'tier-40' : 'tier-15'}`}>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.85 }}>
              Applied Discount Rate
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{calcData.tierLabel}</div>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 900, color: calcData.discountPercentage >= 40 ? 'var(--color-dialog)' : '#38bdf8' }}>
            {calcData.discountPercentage}%
          </div>
        </div>

        {/* Calculation Lines */}
        <div className="clean-row">
          <span>{service === 'CEB' ? 'විදුලි බිල්පත් වටිනාකම:' : 'Reload Value:'}</span>
          <span style={{ fontWeight: 600, color: '#fff' }}>රු. {calcData.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="clean-row">
          <span>වට්ටම් ප්‍රතිශතය:</span>
          <span style={{ fontWeight: 700, color: calcData.discountPercentage >= 40 ? '#ff7900' : '#38bdf8' }}>
            {calcData.discountPercentage}%
          </span>
        </div>

        <div className="clean-row saving">
          <span>ඔබට ලැබෙන ලාභය (You Save):</span>
          <span>- රු. {calcData.savedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Final Amount */}
        <div className="clean-total-row">
          <div className="clean-total-label">
            ගෙවිය යුතු අවසාන මුදල
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 400 }}>Final Payable Amount</div>
          </div>
          <div className="clean-total-amount">
            <span>LKR</span>
            {calcData.finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Rules Reminder */}
        <div style={{ margin: '1rem 0', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.78rem', color: '#94a3b8', border: '1px solid var(--border-hairline)' }}>
          📌 <strong>වට්ටම් නීති (Rules):</strong>
          <br />• <strong>Dialog:</strong> රු. 5,000+ = <strong>40% MEGA</strong> | රු. 1,000 දක්වා = <strong>15%</strong>
          <br />• <strong>Hutch / EzCash / CEB:</strong> රු. 5,000+ = <strong>10% OFF</strong>
        </div>

        {/* Benefits checklist */}
        <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-hairline)', display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.84rem', color: '#cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>ඇණවුම ලැබුණු පසු Admin විසින් කාලය (Time) දැනුවත් කරනු ලැබේ</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <CheckCircle2 size={15} color="#10b981" />
            <span>100% ක්ෂණික සහ විශ්වාසනීය සේවාව</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <ShieldCheck size={15} color="#10b981" />
            <span>Reference අංකයෙන් Live status බලන්න</span>
          </div>
        </div>
      </div>
    </div>
  );
}
