import React from 'react';
import { Zap, Search, Shield, PhoneCall, ArrowUpRight } from 'lucide-react';

export default function Navbar({ onOpenTracker, onOpenAdmin, settings }) {
  const whatsAppNumber = settings?.contactWhatsApp || '+94771234567';
  const cleanWhatsApp = whatsAppNumber.replace(/[^0-9]/g, '');

  return (
    <header className="navbar-clean">
      <div className="brand-clean" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <div className="brand-clean-icon">
          <Zap size={20} color="#ffffff" />
        </div>
        <div className="brand-clean-title">
          <span>SL Reload Hub</span>
          <span className="brand-clean-badge">Auto Discounts</span>
        </div>
      </div>

      <div className="nav-actions-clean">
        <button 
          className="btn-clean btn-clean-secondary btn-clean-sm"
          onClick={onOpenTracker}
          title="Track your reload or bill payment order"
        >
          <Search size={14} />
          <span className="hide-on-mobile">Track Order</span>
        </button>

        <a 
          href={`https://wa.me/${cleanWhatsApp}?text=Hello%20SL%20Reload%20Hub,%20I%20need%20assistance`}
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-clean btn-clean-secondary btn-clean-sm"
        >
          <PhoneCall size={14} />
          <span className="hide-on-mobile">WhatsApp</span>
        </a>

        <button 
          className="btn-clean btn-clean-secondary btn-clean-sm"
          onClick={onOpenAdmin}
          title="Admin Login"
        >
          <Shield size={14} />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
}
