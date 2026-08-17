import React, { useEffect, useRef } from 'react';

/**
 * Advanced Ambient Telecom & Fintech Motion Background
 * Features 60fps dynamic 4G wave ripples, telecom network constellation nodes,
 * electric data packets, and subtle glowing energy flares tailored for SL Reload Hub.
 */
export default function BackgroundVideo() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener('resize', handleResize);

    // Network Node particles
    let nodes = [];
    const nodeCount = Math.min(Math.floor((width * height) / 22000), 55);

    function initNodes() {
      nodes = [];
      for (let i = 0; i < nodeCount; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.35,
          radius: Math.random() * 2.2 + 1.2,
          color: Math.random() > 0.45 ? 'rgba(255, 121, 0, ' : (Math.random() > 0.5 ? 'rgba(56, 189, 248, ' : 'rgba(16, 185, 129, '),
          pulseSpeed: Math.random() * 0.025 + 0.01,
          pulse: Math.random() * Math.PI * 2
        });
      }
    }

    initNodes();

    // Data packets travelling along connections
    let packets = [];
    function spawnPacket(n1, n2) {
      packets.push({
        x1: n1.x,
        y1: n1.y,
        x2: n2.x,
        y2: n2.y,
        progress: 0,
        speed: Math.random() * 0.012 + 0.008,
        color: n1.color
      });
    }

    let time = 0;

    const render = () => {
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // 1. Deep ambient energy gradient backdrop
      const bgGrad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.5) * 120,
        height * 0.35 + Math.cos(time * 0.4) * 80,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.85
      );
      bgGrad.addColorStop(0, 'rgba(255, 121, 0, 0.07)'); // Dialog Orange glow
      bgGrad.addColorStop(0.35, 'rgba(14, 165, 233, 0.04)'); // Cyan network glow
      bgGrad.addColorStop(0.7, 'rgba(6, 11, 25, 0.92)');
      bgGrad.addColorStop(1, '#060a14');

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Cyber Telecom Sine Wave Ripples (4G Carrier Waves)
      ctx.lineWidth = 1.2;
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const waveColor = w === 0 ? 'rgba(255, 121, 0, 0.12)' : (w === 1 ? 'rgba(56, 189, 248, 0.09)' : 'rgba(255, 255, 255, 0.05)');
        ctx.strokeStyle = waveColor;

        const yOffset = height * (0.45 + w * 0.18);
        const freq = 0.0018 + w * 0.0006;
        const amp = 35 + w * 20;

        for (let x = 0; x < width; x += 6) {
          const y = yOffset + Math.sin(x * freq + time * (1.2 + w * 0.3)) * amp + Math.cos(x * 0.0008 - time * 0.8) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // 3. Network Constellation Connections
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            const alpha = (1 - dist / 150) * 0.16;
            ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();

            // Randomly spawn data packet pulse
            if (Math.random() < 0.0015 && packets.length < 25) {
              spawnPacket(n1, n2);
            }
          }
        }
      }

      // 4. Render and advance data packets (Telecom Signals)
      for (let p = packets.length - 1; p >= 0; p--) {
        const pkt = packets[p];
        pkt.progress += pkt.speed;

        if (pkt.progress >= 1) {
          packets.splice(p, 1);
          continue;
        }

        const currX = pkt.x1 + (pkt.x2 - pkt.x1) * pkt.progress;
        const currY = pkt.y1 + (pkt.y2 - pkt.y1) * pkt.progress;

        ctx.fillStyle = pkt.color + '0.85)';
        ctx.shadowColor = pkt.color + '1)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(currX, currY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 5. Render Network Nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += node.pulseSpeed;

        if (node.x < 0) node.x = width;
        if (node.x > width) node.x = 0;
        if (node.y < 0) node.y = height;
        if (node.y > height) node.y = 0;

        const currentOpacity = 0.25 + Math.sin(node.pulse) * 0.2;
        const glowRadius = node.radius * (1.8 + Math.sin(node.pulse) * 0.6);

        // Halo
        const haloGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius * 2.5);
        haloGrad.addColorStop(0, node.color + `${currentOpacity})`);
        haloGrad.addColorStop(1, node.color + '0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = node.color + `${currentOpacity + 0.4})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      className="ambient-bg-video-wrapper" 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: -1,
        overflow: 'hidden'
      }}
    >
      <canvas 
        ref={canvasRef} 
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      {/* Subtle vignette layer to ensure maximum legibility and glassmorphism contrast */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 30%, rgba(6, 10, 20, 0.4) 0%, rgba(6, 10, 20, 0.75) 70%, #060a14 100%)',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
}
