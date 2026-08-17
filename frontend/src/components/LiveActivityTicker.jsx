import React, { useState, useEffect } from 'react';
import { Zap, Smartphone, CreditCard, Lightbulb, CheckCircle2 } from 'lucide-react';

const mockActivities = [
  { service: 'DIALOG', text: '077 ••• 8492 reloaded Rs. 5,000 (Saved Rs. 2,000)', location: 'Colombo', time: '1m ago' },
  { service: 'HUTCH', text: '078 ••• 3109 reloaded Rs. 5,000 (Saved Rs. 500)', location: 'Kandy', time: '3m ago' },
  { service: 'CEB', text: 'CEB Acc 012 ••• 981 paid Rs. 7,500 Bill (Saved Rs. 750)', location: 'Gampaha', time: '4m ago' },
  { service: 'EZCASH', text: '076 ••• 4410 received Rs. 5,000 EzCash (Saved Rs. 500)', location: 'Kurunegala', time: '6m ago' },
  { service: 'DIALOG', text: '074 ••• 1920 Broadband reloaded Rs. 10,000 (Saved Rs. 4,000)', location: 'Galle', time: '8m ago' }
];

export default function LiveActivityTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % mockActivities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = mockActivities[currentIndex];

  const getIcon = (s) => {
    switch (s) {
      case 'DIALOG': return <Zap size={14} color="#ff7900" />;
      case 'HUTCH': return <Smartphone size={14} color="#38bdf8" />;
      case 'EZCASH': return <CreditCard size={14} color="#fbbf24" />;
      case 'CEB': return <Lightbulb size={14} color="#10b981" />;
      default: return <CheckCircle2 size={14} color="#10b981" />;
    }
  };

  return (
    <div className="activity-ticker-bar hide-on-mobile">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span className="pulse-dot" />
        {getIcon(current.service)}
      </div>
      <div>
        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{current.text}</span>
        <span style={{ color: '#94a3b8', marginLeft: '0.5rem', fontSize: '0.75rem' }}>
          • {current.location} ({current.time})
        </span>
      </div>
    </div>
  );
}
