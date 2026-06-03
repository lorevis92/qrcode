import { useState, useEffect, useCallback, useRef } from 'react'
import QRCode from 'qrcode'
import EmailModal from '../components/EmailModal'

const TYPES = [
  { id: 'url', label: 'URL' },
  { id: 'text', label: 'Text' },
  { id: 'email', label: 'Email' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'vcard', label: 'vCard' },
]

function buildQrContent(type, fields) {
  switch (type) {
    case 'url':
      return fields.url || ''
    case 'text':
      return fields.text || ''
    case 'email': {
      const to = fields.emailTo || ''
      const subject = fields.emailSubject || ''
      const body = fields.emailBody || ''
      if (!to) return ''
      let mailto = `mailto:${to}`
      const params = []
      if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
      if (body) params.push(`body=${encodeURIComponent(body)}`)
      if (params.length) mailto += '?' + params.join('&')
      return mailto
    }
    case 'wifi': {
      const ssid = fields.wifiSsid || ''
      const password = fields.wifiPassword || ''
      const security = fields.wifiSecurity || 'WPA'
      if (!ssid) return ''
      return `WIFI:T:${security};S:${ssid};P:${password};;`
    }
    case 'vcard': {
      const name = fields.vcardName || ''
      const phone = fields.vcardPhone || ''
      const email = fields.vcardEmail || ''
      const org = fields.vcardOrg || ''
      const url = fields.vcardUrl || ''
      if (!name) return ''
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${name}`,
        phone ? `TEL:${phone}` : null,
        email ? `EMAIL:${email}` : null,
        org ? `ORG:${org}` : null,
        url ? `URL:${url}` : null,
        'END:VCARD',
      ].filter(Boolean).join('\n')
    }
    default:
      return ''
  }
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
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
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  border: '1px solid #E8E8E8',
  borderRadius: 4,
  padding: '10px 12px',
  fontFamily: 'var(--font-ui)',
  fontSize: 14,
  color: '#111111',
  outline: 'none',
  background: '#FFFFFF',
}

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: 80,
}

function TypeFields({ type, fields, onChange }) {
  function set(key) {
    return e => onChange({ ...fields, [key]: e.target.value })
  }

  switch (type) {
    case 'url':
      return (
        <Field label="URL">
          <input style={inputStyle} type="url" placeholder="https://example.com" value={fields.url || ''} onChange={set('url')} />
        </Field>
      )
    case 'text':
      return (
        <Field label="Text">
          <textarea style={textareaStyle} placeholder="Enter any text…" value={fields.text || ''} onChange={set('text')} />
        </Field>
      )
    case 'email':
      return (
        <>
          <Field label="To">
            <input style={inputStyle} type="email" placeholder="recipient@example.com" value={fields.emailTo || ''} onChange={set('emailTo')} />
          </Field>
          <Field label="Subject">
            <input style={inputStyle} type="text" placeholder="Subject line" value={fields.emailSubject || ''} onChange={set('emailSubject')} />
          </Field>
          <Field label="Body">
            <textarea style={textareaStyle} placeholder="Message body…" value={fields.emailBody || ''} onChange={set('emailBody')} />
          </Field>
        </>
      )
    case 'wifi':
      return (
        <>
          <Field label="Network Name (SSID)">
            <input style={inputStyle} type="text" placeholder="MyNetwork" value={fields.wifiSsid || ''} onChange={set('wifiSsid')} />
          </Field>
          <Field label="Password">
            <input style={inputStyle} type="text" placeholder="Password" value={fields.wifiPassword || ''} onChange={set('wifiPassword')} />
          </Field>
          <Field label="Security">
            <select style={inputStyle} value={fields.wifiSecurity || 'WPA'} onChange={set('wifiSecurity')}>
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">None</option>
            </select>
          </Field>
        </>
      )
    case 'vcard':
      return (
        <>
          <Field label="Full Name">
            <input style={inputStyle} type="text" placeholder="Jane Doe" value={fields.vcardName || ''} onChange={set('vcardName')} />
          </Field>
          <Field label="Phone">
            <input style={inputStyle} type="tel" placeholder="+1 555 000 0000" value={fields.vcardPhone || ''} onChange={set('vcardPhone')} />
          </Field>
          <Field label="Email">
            <input style={inputStyle} type="email" placeholder="jane@example.com" value={fields.vcardEmail || ''} onChange={set('vcardEmail')} />
          </Field>
          <Field label="Organization">
            <input style={inputStyle} type="text" placeholder="Company name" value={fields.vcardOrg || ''} onChange={set('vcardOrg')} />
          </Field>
          <Field label="Website">
            <input style={inputStyle} type="url" placeholder="https://example.com" value={fields.vcardUrl || ''} onChange={set('vcardUrl')} />
          </Field>
        </>
      )
    default:
      return null
  }
}

const card = {
  background: '#FFFFFF',
  border: '1px solid #E8E8E8',
  borderRadius: 6,
  padding: 24,
  marginBottom: 16,
}

const cardTitle = {
  fontFamily: 'var(--font-ui)',
  fontWeight: 800,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#AAAAAA',
  marginBottom: 20,
}

export default function QRGenerator() {
  const [activeType, setActiveType] = useState('url')
  const [fields, setFields] = useState({})
  const [fgColor, setFgColor] = useState('#111111')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [size, setSize] = useState(300)
  const [format, setFormat] = useState('png')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [logoFile, setLogoFile] = useState(null)
  const [logoSize, setLogoSize] = useState(25)
  const fileInputRef = useRef(null)

  const content = buildQrContent(activeType, fields)

  const generateQR = useCallback(async () => {
    if (!content) {
      setQrDataUrl('')
      return
    }
    try {
      const INTERNAL_SIZE = 1200

      const offscreen = document.createElement('canvas')
      offscreen.width = INTERNAL_SIZE
      offscreen.height = INTERNAL_SIZE

      await QRCode.toCanvas(offscreen, content, {
        width: INTERNAL_SIZE,
        margin: 2,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: 'H',
      })

      if (logoFile) {
        const ctx = offscreen.getContext('2d')
        const img = new Image()
        const objectUrl = URL.createObjectURL(logoFile)
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = objectUrl
        })
        URL.revokeObjectURL(objectUrl)

        const maxLogoSize = INTERNAL_SIZE * (logoSize / 100)
        const ratio = Math.min(maxLogoSize / img.width, maxLogoSize / img.height)
        const logoW = img.width * ratio
        const logoH = img.height * ratio
        const padding = maxLogoSize * 0.12
        const x = (INTERNAL_SIZE - logoW) / 2
        const y = (INTERNAL_SIZE - logoH) / 2

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x - padding, y - padding, logoW + padding * 2, logoH + padding * 2)
        ctx.drawImage(img, x, y, logoW, logoH)
      }

      setQrDataUrl(offscreen.toDataURL('image/png'))
    } catch {
      setQrDataUrl('')
    }
  }, [content, fgColor, bgColor, logoFile, logoSize])

  useEffect(() => { generateQR() }, [generateQR])

  function handleDownload() {
    if (!qrDataUrl) return
    const link = document.createElement('a')
    link.href = qrDataUrl
    link.download = `wisiqr-${activeType}.${format}`
    link.click()
  }

  function handleTypeChange(id) {
    setActiveType(id)
    setFields({})
    setQrDataUrl('')
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (file) setLogoFile(file)
    e.target.value = ''
  }

  function handleLogoRemove() {
    setLogoFile(null)
  }

  return (
    <div style={{
      maxWidth: 1060,
      margin: '0 auto',
      padding: '40px 24px',
      display: 'grid',
      gridTemplateColumns: '1fr 340px',
      gap: 24,
      alignItems: 'start',
    }}>

      {/* LEFT COLUMN */}
      <div>
        {/* Card 1: Type + Fields */}
        <div style={card}>
          <div style={cardTitle}>QR Type</div>

          {/* Type pills + Logo upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
            {TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTypeChange(t.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 3,
                  border: '1px solid #E8E8E8',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: activeType === t.id ? '#E8352A' : '#F8F8F8',
                  color: activeType === t.id ? '#FFFFFF' : '#666666',
                  transition: 'all 0.12s',
                }}
              >
                {t.label}
              </button>
            ))}

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              {logoFile ? (
                <>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: '#666666',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {logoFile.name}
                  </span>
                  <button
                    onClick={handleLogoRemove}
                    style={{
                      background: 'none',
                      border: '1px solid #E8E8E8',
                      borderRadius: 3,
                      padding: '5px 10px',
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 700,
                      fontSize: 11,
                      color: '#E8352A',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ✕ Remove
                  </button>
                  {/* Logo size slider — shown inline after Remove */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140, marginLeft: 8 }}>
                    <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#666666', marginBottom: 4 }}>
                      Logo Size:{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#E8352A' }}>{logoSize}</span>%
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      step={1}
                      value={logoSize}
                      onChange={e => setLogoSize(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#E8352A', cursor: 'pointer' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA' }}>10%</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA' }}>40%</span>
                    </div>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: '#F8F8F8',
                    border: '1px solid #E8E8E8',
                    borderRadius: 3,
                    padding: '6px 14px',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    fontSize: 12,
                    color: '#666666',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Upload Logo
                </button>
              )}
            </div>
          </div>

          <TypeFields type={activeType} fields={fields} onChange={setFields} />
        </div>

        {/* Card 2: Customization */}
        <div style={card}>
          <div style={cardTitle}>Customization</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* FG color */}
            <Field label="Foreground Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E8E8E8', borderRadius: 4, padding: '8px 12px' }}>
                <input
                  type="color"
                  value={fgColor}
                  onChange={e => setFgColor(e.target.value)}
                  style={{ width: 24, height: 24, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'none' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666666' }}>{fgColor.toUpperCase()}</span>
              </div>
            </Field>

            {/* BG color */}
            <Field label="Background Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E8E8E8', borderRadius: 4, padding: '8px 12px' }}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  style={{ width: 24, height: 24, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'none' }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666666' }}>{bgColor.toUpperCase()}</span>
              </div>
            </Field>
          </div>

          {/* Size slider */}
          <Field label={`Size — ${size}px`}>
            <input
              type="range"
              min={150}
              max={600}
              value={size}
              onChange={e => setSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#E8352A', cursor: 'pointer' }}
            />
          </Field>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ position: 'sticky', top: 72 }}>
        <div style={card}>
          <div style={cardTitle}>Preview</div>

          {/* QR Preview box */}
          <div style={{
            background: '#F8F8F8',
            border: '1px solid #E8E8E8',
            borderRadius: 4,
            minHeight: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            padding: 16,
          }}>
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" width={size} style={{ maxWidth: '100%', display: 'block' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#AAAAAA' }}>
                <div style={{ fontSize: 48, marginBottom: 10, opacity: 0.3 }}>▦</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, lineHeight: 1.5 }}>
                  Fill in the fields<br />to generate your QR
                </div>
              </div>
            )}
          </div>

          {/* Format selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {['png', 'svg'].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 3,
                  border: '1px solid #E8E8E8',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 700,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  background: format === f ? '#111111' : '#F8F8F8',
                  color: format === f ? '#FFFFFF' : '#666666',
                  transition: 'all 0.12s',
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={!qrDataUrl}
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
              cursor: qrDataUrl ? 'pointer' : 'not-allowed',
              opacity: qrDataUrl ? 1 : 0.4,
              marginBottom: 10,
              transition: 'opacity 0.15s',
            }}
          >
            ↓ Download {format.toUpperCase()}
          </button>

          {/* Email button */}
          <button
            onClick={() => setShowModal(true)}
            disabled={!qrDataUrl}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#666666',
              border: '1px solid #E8E8E8',
              borderRadius: 3,
              padding: '12px 0',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: qrDataUrl ? 'pointer' : 'not-allowed',
              opacity: qrDataUrl ? 1 : 0.4,
              transition: 'opacity 0.15s',
            }}
          >
            ✉ Send via Email
          </button>
        </div>
      </div>

      {showModal && (
        <EmailModal
          qrDataUrl={qrDataUrl}
          qrLabel={content}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
