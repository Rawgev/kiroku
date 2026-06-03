import { useState, useEffect } from 'react';

interface HealthCheckLoaderProps {
  onComplete: () => void;
}

export function HealthCheckLoader({ onComplete }: HealthCheckLoaderProps) {
  const [isFading, setIsFading] = useState(false);
  const [dots, setDots] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    'Initializing connection to Kiroku API...',
    'Waking up the server (this may take 30-50 seconds on Render free tier)...',
    'Starting database connection pool...',
    'Optimizing cache and system configurations...',
    'Almost there! Preparing your anime tracking vault...',
    'Still waking up the server... Thanks for your patience!',
  ];

  // Animate the loading dots (...)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Cycle through helpful messages every 7 seconds if the server is taking long
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev < messages.length - 1 ? prev + 1 : prev));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Poll the backend health check
  useEffect(() => {
    let active = true;
    let retryTimeout: any;

    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json().catch(() => ({ status: '' }));
          if (data.status === 'ok' && active) {
            // Success! Fade out the loader and mount the main app
            setIsFading(true);
            setTimeout(() => {
              onComplete();
            }, 600); // match CSS fade-out transition
            return;
          }
        }
      } catch (err) {
        console.warn('API health check pending (backend is likely starting up)...');
      }

      // Retry in 3 seconds if not successful
      if (active) {
        retryTimeout = setTimeout(checkHealth, 3000);
      }
    };

    checkHealth();

    return () => {
      active = false;
      clearTimeout(retryTimeout);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at center, #0F172A 0%, #020617 100%)',
        color: '#FFFFFF',
        fontFamily: "'Outfit', -apple-system, sans-serif",
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.6s',
        opacity: isFading ? 0 : 1,
        visibility: isFading ? 'hidden' : 'visible',
        overflow: 'hidden',
      }}
    >
      {/* CSS Keyframes */}
      <style>{`
        @keyframes spin-neon {
          0% { transform: rotate(0deg); box-shadow: 0 0 15px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(139, 92, 246, 0.2); }
          50% { transform: rotate(180deg); box-shadow: 0 0 30px rgba(6, 182, 212, 0.6), inset 0 0 15px rgba(6, 182, 212, 0.3); }
          100% { transform: rotate(360deg); box-shadow: 0 0 15px rgba(139, 92, 246, 0.4), inset 0 0 10px rgba(139, 92, 246, 0.2); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(0.98); filter: drop-shadow(0 0 10px rgba(139, 92, 246, 0.3)); }
          50% { opacity: 1; transform: scale(1.02); filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.6)); }
        }
        @keyframes indeterminate-progress {
          0% { left: -35%; right: 100%; }
          60% { left: 100%; right: -90%; }
          100% { left: 100%; right: -90%; }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* Decorative background grid and glowing orbs */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '30%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '30%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Glassmorphic Container */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '90%',
          maxWidth: '460px',
          padding: '40px 30px',
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          border: '1px solid rgba(139, 92, 246, 0.22)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          animation: 'floating 6s ease-in-out infinite',
          textAlign: 'center',
        }}
      >
        {/* Animated Double-Ring Spinner */}
        <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '32px' }}>
          {/* Outer Rotating Glowing Ring */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor: '#8B5CF6',
              borderBottomColor: '#06B6D4',
              animation: 'spin-neon 2.5s linear infinite',
            }}
          />
          {/* Inner Pulsing Core */}
          <div
            style={{
              position: 'absolute',
              inset: '18px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))',
              border: '1px dashed rgba(139, 92, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.3))',
            }}
          >
            ⛩️
          </div>
        </div>

        {/* Pulsing Brand Logo */}
        <h1
          style={{
            fontSize: '30px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            margin: '0 0 12px',
            animation: 'pulse-glow 2.5s ease-in-out infinite',
            color: '#FFFFFF',
          }}
        >
          Kiroku<span style={{ color: '#8B5CF6' }}>Vault</span>
        </h1>

        {/* Indeterminate Gradient Loading Bar */}
        <div
          style={{
            position: 'relative',
            width: '180px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, #8B5CF6, #06B6D4)',
              borderRadius: '10px',
              animation: 'indeterminate-progress 1.8s ease-in-out infinite',
            }}
          />
        </div>

        {/* Dynamic Helpful Status Message */}
        <div style={{ minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p
            style={{
              fontSize: '13px',
              color: '#A0AEC0',
              lineHeight: '1.6',
              fontWeight: 500,
              maxWidth: '320px',
              transition: 'opacity 0.3s ease',
            }}
          >
            {messages[messageIndex]}
            <span style={{ display: 'inline-block', width: '20px', textAlign: 'left' }}>{dots}</span>
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          fontSize: '11px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'rgba(255, 255, 255, 0.25)',
          fontWeight: 600,
        }}
      >
        Anime & Manga Database
      </div>
    </div>
  );
}
