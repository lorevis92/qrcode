import { useState, useRef } from 'react'

export default function EmailModal({ qrDataUrl, qrLabel, onClose }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error
  const overlayRef = useRef(null)

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  async function handleSend() {
    if (!email) return
    setStatus('sending')
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, qrDataUrl, qrLabel }),
      })
      if (!res.ok) throw new Error('Failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  const labelTruncated = qrLabel && qrLabel.length > 40 ? qrLabel.slice(0, 40) + '…' : qrLabel

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: 6,
        padding: 32,
        width: '100%',
        maxWidth: 420,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{
            fontFamily: 'var(--font-ui)',
            fontWeight: 800,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#111111',
          }}>
            Send via Email
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: '#666666',
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>

        {status === 'success' ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
              QR Code Sent!
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: '#666666', marginBottom: 24 }}>
              Check your inbox at <strong>{email}</strong>.
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#111111',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 3,
                padding: '10px 24px',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* QR Preview */}
            {qrDataUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 14px', background: '#F8F8F8', borderRadius: 4, border: '1px solid #E8E8E8' }}>
                <img src={qrDataUrl} alt="QR preview" style={{ width: 56, height: 56, display: 'block', flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA', wordBreak: 'break-all' }}>
                  {labelTruncated}
                </span>
              </div>
            )}

            {/* Email input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#111111',
                marginBottom: 6,
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  border: '1px solid #E8E8E8',
                  borderRadius: 4,
                  padding: '10px 12px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 14,
                  color: '#111111',
                  outline: 'none',
                  background: '#FFFFFF',
                }}
              />
            </div>

            {status === 'error' && (
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: '#E8352A', marginBottom: 12 }}>
                Something went wrong. Please try again.
              </div>
            )}

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={status === 'sending' || !email}
              style={{
                width: '100%',
                background: '#E8352A',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 3,
                padding: '12px 0',
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: status === 'sending' || !email ? 'not-allowed' : 'pointer',
                opacity: status === 'sending' || !email ? 0.6 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {status === 'sending' ? 'Sending…' : 'Send QR Code'}
            </button>
          </>
        )}

        {/* Modal footer */}
        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 11, color: '#AAAAAA' }}>
          Powered by WiSiVERSE
        </div>
      </div>
    </div>
  )
}
