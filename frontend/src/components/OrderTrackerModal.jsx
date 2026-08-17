import React, { useState, useEffect } from 'react';
import { Search, X, CheckCircle, Clock, AlertCircle, RefreshCw, Smartphone, Upload, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

export default function OrderTrackerModal({ initialRef, onClose }) {
  const [query, setQuery] = useState(initialRef || '');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [slipBase64, setSlipBase64] = useState('');
  const [slipRefInput, setSlipRefInput] = useState('');
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipUploadMsg, setSlipUploadMsg] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    const res = await api.trackOrder(query.trim());
    setLoading(false);

    if (res.success && res.data) {
      setOrder(res.data);
    } else {
      setOrder(null);
      setError(res.message || 'මෙම අංකයට අදාළ ඇණවුමක් සොයාගත නොහැකි විය.');
    }
  };

  useEffect(() => {
    if (initialRef) {
      handleSearch();
    }
  }, [initialRef]);

  const handleCustomerUploadSlip = async (e) => {
    e.preventDefault();
    if (!order) return;
    if (!slipBase64 && !slipRefInput) {
      alert('කරුණාකර Payment Slip Photo එකක් හෝ Reference අංකය ඇතුළත් කරන්න.');
      return;
    }

    setUploadingSlip(true);
    setSlipUploadMsg('');
    const res = await api.uploadPaymentSlip(order.orderReference, {
      paymentSlipUrl: slipBase64,
      paymentReference: slipRefInput
    });
    setUploadingSlip(false);

    if (res.success && res.data) {
      setOrder(res.data);
      setSlipUploadMsg('✓ ගෙවීම් පත්‍රිකාව සාර්ථකව යොමු විය! Admin විසින් පරික්ෂා කර රිලෝඩ් කරනු ඇත.');
      setSlipBase64('');
    } else {
      alert(res.message || 'Upload failed');
    }
  };

  const getStepStatus = (status) => {
    switch (status) {
      case 'REQUESTED':
        return { step: 1, percent: '15%', label: '1. Order Request ලැබුණා (Admin අනුමැතිය බලාපොරොත්තුවෙන්)' };
      case 'READY_FOR_PAYMENT':
        return { step: 2, percent: '40%', label: '2. Admin විසින් අනුමතයි - කරුණාකර මුදල් ගෙවන්න' };
      case 'PAYMENT_SUBMITTED':
        return { step: 3, percent: '70%', label: '3. Slip එක ලැබුණා - ගෙවීම පරීක්ෂා කරමින් පවතී' };
      case 'PROCESSING':
        return { step: 3, percent: '80%', label: '3. ගෙවීම තහවුරුයි - රිලෝඩ් කරමින් පවතී' };
      case 'COMPLETED':
        return { step: 4, percent: '100%', label: '4. Reload සාර්ථකයි! (Proof Photo සපයා ඇත)' };
      case 'REJECTED':
      case 'CANCELLED':
        return { step: 0, percent: '0%', label: 'ප්‍රතික්ෂේප විය (Cancelled / Rejected)' };
      default:
        return { step: 1, percent: '20%', label: 'Pending' };
    }
  };

  const statusInfo = order ? getStepStatus(order.status) : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="card-header" style={{ paddingBottom: '0.75rem' }}>
          <h2>
            <Clock size={22} color="#ff7900" />
            ඇණවුම පරීක්ෂා කරන්න (Track Order)
          </h2>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <div className="input-wrapper" style={{ flex: 1 }}>
            <Search size={18} className="input-icon" />
            <input
              type="text"
              className="form-control with-icon"
              placeholder="Order Reference (Ex: DLG-78291) හෝ දුරකථන අංකය"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <RefreshCw size={18} className="animate-spin" /> : 'සොයන්න'}
          </button>
        </form>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {order && statusInfo && (
          <div style={{ background: 'var(--bg-input)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border-light)' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Order Reference</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-orange)' }}>
                  {order.orderReference}
                </div>
              </div>
              <span className={`status-pill status-${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>

            {/* Stepper Visualization (4-Stage) */}
            {order.status !== 'REJECTED' && order.status !== 'CANCELLED' ? (
              <div className="stepper-wrapper" style={{ margin: '1.5rem 0' }}>
                <div className="stepper-line" />
                <div className="stepper-line-active" style={{ width: statusInfo.percent }} />

                <div className={`step-item ${statusInfo.step >= 1 ? 'done' : ''}`}>
                  <div className="step-circle">1</div>
                  <span className="step-label">Request ලැබුණා</span>
                </div>

                <div className={`step-item ${statusInfo.step >= 2 ? (statusInfo.step > 2 ? 'done' : 'active') : ''}`}>
                  <div className="step-circle">2</div>
                  <span className="step-label">ගෙවන්න සූදානම්</span>
                </div>

                <div className={`step-item ${statusInfo.step >= 3 ? (statusInfo.step > 3 ? 'done' : 'active') : ''}`}>
                  <div className="step-circle">3</div>
                  <span className="step-label">Slip ලැබුණා</span>
                </div>

                <div className={`step-item ${statusInfo.step >= 4 ? 'done' : ''}`}>
                  <div className="step-circle">4</div>
                  <span className="step-label">Reload & Proof</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#f87171' }}>
                <AlertCircle size={32} style={{ margin: '0 auto 0.5rem auto' }} />
                <strong>මෙම ඇණවුම අවලංගු / ප්‍රතික්ෂේප කර ඇත</strong>
              </div>
            )}

            {/* Current status banner */}
            <div style={{
              background: order.status === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : 'rgba(255, 121, 0, 0.08)',
              border: `1px solid ${order.status === 'COMPLETED' ? 'rgba(16,185,129,0.3)' : 'var(--border-active)'}`,
              borderRadius: '8px',
              padding: '0.75rem',
              fontSize: '0.85rem',
              textAlign: 'center',
              margin: '1rem 0'
            }}>
              <strong>Status:</strong> {statusInfo.label}
              {order.estimatedTime && (
                <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '0.25rem' }}>
                  ⏳ ඇස්තමේන්තුගත කාලය: <strong>{order.estimatedTime}</strong>
                </div>
              )}
            </div>

            {/* SECTION 1: IF READY_FOR_PAYMENT, SHOW SLIP UPLOADER */}
            {order.status === 'READY_FOR_PAYMENT' && (
              <div style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#38bdf8', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={16} /> ඔබගේ Payment Slip එක මෙතැනින් Upload කරන්න
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#bae6fd', marginBottom: '0.75rem' }}>
                  ගෙවිය යුතු මුදල: <strong>Rs. {order.finalAmount.toFixed(2)}</strong>. බැංකු ගිණුමට මුදල් තැන්පත් කර Slip පත්‍රිකාව හෝ Reference අංකය ඇතුළත් කරන්න.
                </p>

                <form onSubmit={handleCustomerUploadSlip} style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Bank Reference / Slip No (Ex: BOC-871294)"
                    value={slipRefInput}
                    onChange={(e) => setSlipRefInput(e.target.value)}
                  />

                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setSlipBase64(reader.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />

                  {slipBase64 && (
                    <div style={{ textAlign: 'center', margin: '0.25rem 0' }}>
                      <img src={slipBase64} alt="Slip" style={{ maxHeight: '90px', borderRadius: '6px', border: '1px solid #38bdf8' }} />
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-sm" disabled={uploadingSlip}>
                    {uploadingSlip ? 'යවමින්...' : '📤 Submit Payment Slip'}
                  </button>
                </form>

                {slipUploadMsg && (
                  <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {slipUploadMsg}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 2: IF COMPLETED WITH PROOF PHOTO, SHOW PROOF PHOTO */}
            {order.status === 'COMPLETED' && order.proofImageUrl && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                <h4 style={{ fontSize: '0.92rem', color: '#34d399', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={16} /> 📸 Official Reload Proof Photo (සාක්ෂි ඡායාරූපය)
                </h4>
                <p style={{ fontSize: '0.78rem', color: '#a7f3d0', marginBottom: '0.75rem' }}>
                  මෙම රිලෝඩ් ගනුදෙනුව සාර්ථකව සිදුකර ඇති බවට Admin විසින් සපයන ලද සත්‍යාපිත ඡායාරූපය:
                </p>
                <img 
                  src={order.proofImageUrl} 
                  alt="Reload Proof" 
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #10b981', objectFit: 'contain' }} 
                />
              </div>
            )}

            {/* Details table */}
            <div style={{ fontSize: '0.88rem' }}>
              <div className="calc-row">
                <span>සේවාව හා අංකය:</span>
                <strong>{order.serviceType} - {order.dialogNumber}</strong>
              </div>
              <div className="calc-row">
                <span>Reload වටිනාකම:</span>
                <span>රු. {order.originalAmount.toFixed(2)}</span>
              </div>
              <div className="calc-row highlight-saving">
                <span>වට්ටම ({order.discountPercentage}%):</span>
                <span>- රු. {order.discountAmount.toFixed(2)}</span>
              </div>
              <div className="calc-row">
                <span>ගෙවිය යුතු මුදල:</span>
                <strong style={{ color: '#fff' }}>රු. {order.finalAmount.toFixed(2)}</strong>
              </div>
              <div className="calc-row">
                <span>ගෙවීම් ක්‍රමය:</span>
                <span>{order.paymentMethod || 'Bank Transfer'}</span>
              </div>
              <div className="calc-row">
                <span>යොමු කළ දිනය:</span>
                <span>{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              {order.adminNotes && (
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', fontSize: '0.82rem', color: '#38bdf8' }}>
                  <strong>Admin සටහන:</strong> {order.adminNotes}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
