import React, { useEffect, useRef } from 'react';
import { CheckCircle2, Copy, Send, X, Clock, Printer, ShieldCheck, QrCode } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OrderSuccessModal({ order, onClose, onTrackOrder, settings }) {
  const receiptRef = useRef(null);

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  }, []);

  if (!order) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(order.orderReference);
    alert('Order Reference පිටපත් කර ගන්නා ලදී: ' + order.orderReference);
  };

  const handlePrint = () => {
    window.print();
  };

  const whatsAppNumber = settings?.contactWhatsApp || '+94720346443';
  const cleanWhatsApp = whatsAppNumber.replace(/[^0-9]/g, '') || '94720346443';

  const serviceName = order.serviceType === 'CEB' 
    ? 'CEB Electricity Bill' 
    : (order.serviceType === 'HUTCH' ? 'Hutch 4G Reload' : (order.serviceType === 'EZCASH' ? 'EzCash Top-Up' : 'Dialog Reload'));

  const waMessage = encodeURIComponent(
    `*🔥 ${serviceName} Order Confirmation*\n\n` +
    `*Order Ref:* ${order.orderReference}\n` +
    `*Service:* ${order.serviceType}\n` +
    `*Target No / Acc:* ${order.dialogNumber}\n` +
    (order.accountHolderName ? `*Holder Name:* ${order.accountHolderName}\n` : '') +
    `*Amount:* Rs. ${order.originalAmount}\n` +
    `*Discount Rate:* ${order.discountPercentage}%\n` +
    `*Paid Amount:* Rs. ${order.finalAmount}\n` +
    `*Payment Method:* ${order.paymentMethod}\n` +
    `*Payment Reference:* ${order.paymentReference || 'Slip Attached'}\n\n` +
    `කරුණාකර මගේ ඇණවුම ඉක්මනින් සම්පූර්ණ කර එවන්න. ස්තූතියි!`
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', maxWidth: '580px' }}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div style={{
          width: '68px',
          height: '68px',
          background: 'rgba(16, 185, 129, 0.15)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.15rem auto',
          border: '1px solid #10b981',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.35)'
        }}>
          <CheckCircle2 size={38} color="#10b981" />
        </div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          ඇණවුම සාර්ථකව ලැබුණා!
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '0.85rem' }}>
          ඔබගේ {serviceName} ඇණවුම පද්ධතියට ලැබී ඇති අතර Admin විසින් කාලය (Time) දැනුවත් කරනු ලැබේ.
        </p>

        {/* WhatsApp Group Auto Dispatch Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '9999px',
          padding: '0.35rem 0.9rem',
          fontSize: '0.78rem',
          color: '#34d399',
          fontWeight: 700,
          marginBottom: '1.25rem'
        }}>
          <CheckCircle2 size={14} color="#10b981" />
          <span>✓ Admin WhatsApp Group එකට ස්වයංක්‍රීයව Alert එක ලැබුණි (Auto-Notified)</span>
        </div>

        {/* SaaS Digital Invoice Card */}
        <div 
          ref={receiptRef}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-highlight)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed rgba(255,255,255,0.15)', paddingBottom: '0.85rem', marginBottom: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Digital E-Receipt</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--theme-dialog)', letterSpacing: '0.04em' }}>
                {order.orderReference}
              </div>
            </div>
            <button className="copy-btn" onClick={handleCopyRef}>
              <Copy size={13} /> Copy Ref
            </button>
          </div>

          {/* Details */}
          <div style={{ fontSize: '0.88rem' }}>
            <div className="calc-row">
              <span>Service Type:</span>
              <strong style={{ color: '#fff' }}>{order.serviceType}</strong>
            </div>

            {order.dialogConnectionType && (
              <div className="calc-row">
                <span>Connection Type:</span>
                <span style={{ color: '#ff7900', fontWeight: 700 }}>
                  {order.dialogConnectionType === 'Router' ? '📶 Home Broadband / Router' : (order.dialogConnectionType === 'DTV' ? '📺 Dialog TV (DTV)' : '📱 Dialog Mobile')}
                </span>
              </div>
            )}

            <div className="calc-row">
              <span>{order.serviceType === 'CEB' ? 'CEB Account No:' : (order.dialogConnectionType === 'DTV' ? 'DTV Account No:' : (order.dialogConnectionType === 'ROUTER' ? 'Router Account / No:' : 'Target Number:'))}</span>
              <strong style={{ color: '#fff' }}>{order.dialogNumber}</strong>
            </div>

            {order.accountHolderName && (
              <div className="calc-row">
                <span>Account Holder:</span>
                <span>{order.accountHolderName}</span>
              </div>
            )}

            <div className="calc-row">
              <span>{order.serviceType === 'CEB' ? 'Bill Amount:' : 'Reload Value:'}</span>
              <span>රු. {order.originalAmount.toFixed(2)}</span>
            </div>

            <div className="calc-row highlight-saving">
              <span>Applied Discount ({order.discountPercentage}%):</span>
              <span>- රු. {order.discountAmount.toFixed(2)}</span>
            </div>

            <div className="calc-row" style={{ borderBottom: 'none', fontSize: '1.15rem', fontWeight: 900, color: '#fff', paddingTop: '0.65rem' }}>
              <span>Total Paid:</span>
              <span style={{ color: 'var(--theme-dialog)', fontFamily: 'var(--font-display)' }}>
                රු. {order.finalAmount.toFixed(2)}
              </span>
            </div>

            <div className="calc-row" style={{ borderBottom: 'none', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>Payment: {order.paymentMethod} {order.paymentReference ? `(${order.paymentReference})` : ''}</span>
              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* SVG Barcode Stamp */}
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '22px' }}>
              {[4, 2, 5, 2, 8, 3, 2, 6, 4, 2, 7, 3, 5, 2, 8, 4, 3, 6, 2, 5, 3, 7, 2, 4].map((h, i) => (
                <span key={i} style={{ width: '2px', height: `${h * 2.4}px`, background: 'rgba(255,255,255,0.3)', borderRadius: '1px' }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#10b981' }}>
              <ShieldCheck size={14} />
              <span>Verified E-Receipt</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <a
            href={`https://wa.me/${cleanWhatsApp}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success"
            style={{ padding: '0.9rem' }}
          >
            <Send size={18} />
            <span>WhatsApp එකට රිසිට්පත යවන්න (Send via WhatsApp)</span>
          </a>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onTrackOrder(order.orderReference);
              }}
            >
              <Clock size={16} />
              <span>Track Order Status</span>
            </button>
            <button className="btn btn-secondary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
