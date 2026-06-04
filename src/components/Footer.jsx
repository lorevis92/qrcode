export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid #E8E8E8',
      background: '#F8F8F8',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#666666' }}>Part of the</span>
        <img src="/logo-wisiverse.png" height={22} alt="WiSiVERSE logo" style={{ display: 'block', objectFit: 'contain', margin: '0 4px' }} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#666666' }}>ecosystem</span>
      </div>
      <a
        href="https://wisiverse.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 11,
          color: '#E8352A',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          textDecoration: 'none',
        }}
      >
        wisiverse.com →
      </a>
    </footer>
  )
}
