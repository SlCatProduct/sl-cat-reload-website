import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import ReloadCalculator from './components/ReloadCalculator';
import PackageShowcase from './components/PackageShowcase';
import OrderSuccessModal from './components/OrderSuccessModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import AdminPortal from './components/AdminPortal';
import BackgroundVideo from './components/BackgroundVideo';
import { api } from './services/api';
import { Megaphone, ShieldCheck, Zap, HelpCircle, Check, Phone } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedService, setSelectedService] = useState('DIALOG');
  const [selectedAmount, setSelectedAmount] = useState(5000);
  
  // Modals
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [trackRef, setTrackRef] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    loadPublicData();
  }, []);

  const loadPublicData = async () => {
    const [settingsRes, packagesRes] = await Promise.all([
      api.getPublicSettings(),
      api.getPackages('ALL')
    ]);

    if (settingsRes.success) setSettings(settingsRes.data);
    if (packagesRes.success) setPackages(packagesRes.data);
  };

  const handleSelectService = (service, amount) => {
    setSelectedService(service);
    if (amount) setSelectedAmount(amount);
    const el = document.getElementById('checkout-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPackage = (amount, service) => {
    if (service) setSelectedService(service);
    setSelectedAmount(amount);
    const el = document.getElementById('checkout-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOrderSuccess = (order) => {
    setSuccessOrder(order);
  };

  const handleOpenTrackerWithRef = (ref) => {
    setTrackRef(ref);
    setShowTrackerModal(true);
  };

  return (
    <>
      {/* Advanced Ambient Telecom Motion Background */}
      <BackgroundVideo />

      <div className="app-wrapper">
        {/* Clean Navbar */}
        <Navbar 
          settings={settings}
          onOpenTracker={() => {
            setTrackRef('');
            setShowTrackerModal(true);
          }}
          onOpenAdmin={() => setShowAdminModal(true)}
        />

        {/* Notice Banner */}
        {settings?.noticeBanner && (
          <div className="hero-clean-pill" style={{ display: 'flex', width: 'fit-content', margin: '0 auto 1.75rem auto', color: '#ffedd5', background: 'rgba(255,121,0,0.08)', border: '1px solid rgba(255,121,0,0.25)' }}>
            <Megaphone size={14} color="#ff7900" style={{ flexShrink: 0 }} />
            <span>{settings.noticeBanner}</span>
          </div>
        )}

        {/* Minimalist Hero */}
        <HeroBanner 
          settings={settings} 
          currentService={selectedService}
          onSelectService={handleSelectService} 
        />

        {/* Clean Checkout Section */}
        <div id="checkout-section" style={{ marginTop: '2rem' }}>
          <ReloadCalculator 
            selectedService={selectedService}
            onServiceChange={(s) => setSelectedService(s)}
            initialAmount={selectedAmount}
            settings={settings}
            onOrderSuccess={handleOrderSuccess}
          />
        </div>

        {/* Minimalist Packages Grid */}
        <PackageShowcase 
          packages={packages} 
          onSelectPackage={handleSelectPackage} 
        />

        {/* FAQ & Service Terms Section */}
        <div className="clean-card" style={{ marginTop: '4rem', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>සේවා සහ වට්ටම් විස්තර (Services & Discounts)</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>ස්වයංක්‍රීය වට්ටම් ලබා ගැනීම සහ ගෙවීම් කිරීම පිළිබඳ විස්තර</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-dialog)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={15} /> 1. Dialog Reloads (40% / 15%)
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                රු. 5,000+ සඳහා <strong>40%ක දැවැන්ත වට්ටමක්</strong>. රු. 5,000ට අඩු ඒවා සඳහා උපරිම රු. 1,000 දක්වා <strong>15%ක වට්ටමක්</strong>.
              </p>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Check size={15} /> 2. Hutch / EzCash / CEB (10%)
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                Hutch 4G Reload, EzCash Wallet Top-up සහ CEB විදුලි බිල්පත් සඳහා රු. 5,000+ ඕනෑම ගෙවීමකට <strong>10%ක වට්ටමක් (රු. 5,000ට රු. 500ක ලාභයක්)</strong> හිමිවේ.
              </p>
            </div>

            <div style={{ background: 'var(--bg-input)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-hairline)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={15} /> 3. ක්ෂණික සක්‍රීය කිරීම
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#cbd5e1' }}>
                බැංකු තැන්පතු හෝ EzCash මගින් ගෙවීම් කළ හැක. ගෙවීම් ස්ලිප් එක Upload කළ පසු Admin විසින් කාලය (Time) දැනුවත් කරනු ලැබේ.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer-clean">
          <p>© {new Date().getFullYear()} SL Reload & Utility Bill Hub. All rights reserved.</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.76rem' }}>
            Fast, secure and automated platform for Dialog, Hutch, EzCash and CEB Electricity Bills.
          </p>
        </footer>
      </div>

      {/* Modals */}
      {successOrder && (
        <OrderSuccessModal
          order={successOrder}
          settings={settings}
          onClose={() => setSuccessOrder(null)}
          onTrackOrder={handleOpenTrackerWithRef}
        />
      )}

      {showTrackerModal && (
        <OrderTrackerModal
          initialRef={trackRef}
          onClose={() => setShowTrackerModal(false)}
        />
      )}

      {showAdminModal && (
        <AdminPortal
          onClose={() => {
            setShowAdminModal(false);
            loadPublicData();
          }}
        />
      )}
    </>
  );
}
