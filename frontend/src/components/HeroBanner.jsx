import React from 'react';
import { Sparkles, Zap, Smartphone, CreditCard, Lightbulb } from 'lucide-react';

export default function HeroBanner({ settings, onSelectService, currentService }) {
  return (
    <div className="hero-clean">
      <div className="hero-clean-pill">
        <Sparkles size={14} color="#ff7900" />
        <span>ස්වයංක්‍රීය ක්ෂණික වට්ටම් පද්ධතිය (Live Auto Discounts)</span>
      </div>

      <h1 className="hero-clean-title">
        Reloads & විදුලි බිල්පත් සඳහා <br />
        <span className="orange">10%</span> සිට <span className="green">40% දක්වා</span> දැවැන්ත වට්ටම්!
      </h1>

      <p className="hero-clean-desc">
        Dialog (40%), Hutch (10%), EzCash (10%) සහ CEB විදුලි බිල්පත් සඳහා රු. 5,000ට වැඩි ඕනෑම ගනුදෙනුවකට ක්ෂණික මිල අඩුකිරීම්!
      </p>

      {/* 4 Clean Service Showcase Cards */}
      <div className="services-pills-row">
        {/* Dialog */}
        <div 
          className={`service-pill-card ${currentService === 'DIALOG' ? 'active' : ''}`}
          onClick={() => onSelectService('DIALOG', 5000)}
        >
          <div className="service-pill-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Zap size={16} color="#ff7900" />
              <span className="service-pill-name">Dialog Reload</span>
            </div>
            <span className="service-pill-badge badge-dlg">40% OFF</span>
          </div>
          <div className="service-pill-sub">රු. 5,000+ = 40% | රු. 1,000 දක්වා = 15%</div>
        </div>

        {/* Hutch */}
        <div 
          className={`service-pill-card ${currentService === 'HUTCH' ? 'active' : ''}`}
          onClick={() => onSelectService('HUTCH', 5000)}
        >
          <div className="service-pill-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Smartphone size={16} color="#00a8ff" />
              <span className="service-pill-name">Hutch Reload</span>
            </div>
            <span className="service-pill-badge badge-htc">10% OFF</span>
          </div>
          <div className="service-pill-sub">රු. 5,000+ සඳහා 10% වට්ටමක්</div>
        </div>

        {/* EzCash */}
        <div 
          className={`service-pill-card ${currentService === 'EZCASH' ? 'active' : ''}`}
          onClick={() => onSelectService('EZCASH', 5000)}
        >
          <div className="service-pill-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CreditCard size={16} color="#f59e0b" />
              <span className="service-pill-name">EzCash Wallet</span>
            </div>
            <span className="service-pill-badge badge-ezc">10% OFF</span>
          </div>
          <div className="service-pill-sub">රු. 5,000+ සඳහා 10% වට්ටමක්</div>
        </div>

        {/* CEB */}
        <div 
          className={`service-pill-card ${currentService === 'CEB' ? 'active' : ''}`}
          onClick={() => onSelectService('CEB', 5000)}
        >
          <div className="service-pill-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lightbulb size={16} color="#10b981" />
              <span className="service-pill-name">CEB Bill</span>
            </div>
            <span className="service-pill-badge badge-ceb">10% OFF</span>
          </div>
          <div className="service-pill-sub">රු. 5,000+ සඳහා 10% වට්ටමක්</div>
        </div>
      </div>
    </div>
  );
}
