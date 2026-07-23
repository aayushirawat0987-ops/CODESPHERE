import React from 'react';

export default function ProtectedComponent({
  currentUser,
  allowedRoles = [],
  children,
  onRedirectLogin
}) {
  const userRole = currentUser ? currentUser.role : 'guest';
  const isAllowed = allowedRoles.includes(userRole);

  if (!isAllowed) {
    return (
      <div style={{
        background: '#ffffff', border: '2px solid #fca5a5', borderRadius: '20px',
        padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '40px auto',
        boxShadow: '0 20px 40px rgba(220,38,38,0.1)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ margin: '0 0 10px', color: '#b91c1c', fontSize: '1.4rem', fontWeight: 900 }}>
          Access Denied: Unauthorized Page
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 20px' }}>
          You are not authorized to access this page. Your logged-in role (<strong style={{ color: '#0096c7', textTransform: 'uppercase' }}>{userRole}</strong>) does not have access permissions for this section.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={onRedirectLogin}
            className="btn btn-primary"
            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
          >
            🔑 Log In with Authorized Account
          </button>
        </div>
      </div>
    );
  }

  return children;
}
