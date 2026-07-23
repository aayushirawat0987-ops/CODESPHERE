import React from 'react';

export default function PatientQRCode({ patientId = 'VIT-2026-000001', size = 120 }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(patientId)}`;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <img
        src={qrUrl}
        alt={`QR Code for ${patientId}`}
        width={size}
        height={size}
        style={{ borderRadius: '6px', display: 'block' }}
      />
      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#0f172a', marginTop: '6px', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
        {patientId}
      </span>
    </div>
  );
}
