import React, { useState } from 'react';
import { Flame, ArrowUpRight } from 'lucide-react';

export default function PackageShowcase({ packages, onSelectPackage }) {
  const [filterService, setFilterService] = useState('ALL');

  if (!packages || packages.length === 0) return null;

  const filteredPackages = filterService === 'ALL'
    ? packages
    : packages.filter(p => (p.serviceType || 'DIALOG').toUpperCase() === filterService);

  return (
    <div style={{ marginTop: '3.5rem', marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="hero-clean-pill">
          <Flame size={14} color="#ff7900" />
          <span>ජනප්‍රිය පැකේජ (Featured Packages)</span>
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0.25rem 0' }}>
          ජනප්‍රිය Reload & Utility Bill පැකේජ
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
          ඔබට වඩාත් ගැලපෙන පැකේජය තෝරා 1-Click එකෙන් ලබාගන්න.
        </p>

        {/* Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.45rem', marginTop: '1.15rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Services' },
            { id: 'DIALOG', label: 'Dialog' },
            { id: 'HUTCH', label: 'Hutch' },
            { id: 'EZCASH', label: 'EzCash' },
            { id: 'CEB', label: 'CEB Bill' }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`btn-clean btn-clean-sm ${filterService === tab.id ? 'btn-clean-primary' : 'btn-clean-secondary'}`}
              onClick={() => setFilterService(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1rem'
      }}>
        {filteredPackages.map((pkg) => {
          const sType = pkg.serviceType || 'DIALOG';
          const isMega = pkg.amount >= 5000;
          return (
            <div 
              key={pkg.id}
              className="clean-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.4rem',
                border: isMega && sType === 'DIALOG' ? '1px solid rgba(255,121,0,0.4)' : '1px solid var(--border-hairline)',
                background: isMega && sType === 'DIALOG' ? 'rgba(255,121,0,0.04)' : 'var(--bg-card)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    {pkg.category || sType}
                  </span>
                  <span className={`service-pill-badge ${sType === 'DIALOG' ? 'badge-dlg' : (sType === 'HUTCH' ? 'badge-htc' : (sType === 'EZCASH' ? 'badge-ezc' : 'badge-ceb'))}`}>
                    {pkg.badge || `${pkg.discountPercentage}% OFF`}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0.25rem 0' }}>
                  {pkg.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '1rem', minHeight: '36px' }}>
                  {pkg.description}
                </div>

                <div style={{ background: 'var(--bg-input)', padding: '0.75rem 0.9rem', borderRadius: '10px', marginBottom: '1.15rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                    <span>වටිනාකම:</span>
                    <span>රු. {pkg.amount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#10b981', fontWeight: 600, margin: '0.2rem 0' }}>
                    <span>වට්ටම ({pkg.discountPercentage}%):</span>
                    <span>- රු. {pkg.discountAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#fff', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.35rem', marginTop: '0.35rem' }}>
                    <span>අවසාන මිල:</span>
                    <span style={{ color: isMega ? '#ff7900' : '#38bdf8' }}>
                      රු. {pkg.finalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                className={`btn-clean ${isMega ? 'btn-clean-primary' : 'btn-clean-secondary'}`}
                style={{ width: '100%', padding: '0.65rem' }}
                onClick={() => onSelectPackage(pkg.amount, sType)}
              >
                <span>මිලදී ගන්න (Order)</span>
                <ArrowUpRight size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
