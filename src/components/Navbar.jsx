export default function Navbar() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#FFFFFF',
      borderBottom: '1px solid #E8E8E8',
      height: 'auto',
      minHeight: 56,
      overflow: 'hidden',
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="/logo-wisi.png" height={36} alt="WiSi logo" style={{ display: 'block' }} />
        <span style={{
          fontFamily: 'var(--font-ui)',
          fontWeight: 800,
          fontSize: 18,
          color: '#E8352A',
          textTransform: 'uppercase',
          letterSpacing: '0.01em',
        }}>
          QRcode
        </span>
      </div>
      <span style={{
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        fontSize: 11,
        color: '#AAAAAA',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        QR Generator
      </span>
    </nav>
  )
}
