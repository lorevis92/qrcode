import { useState, useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
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
    case 'url': return fields.url || ''
    case 'text': return fields.text || ''
    case 'email': {
      const to = fields.emailTo || ''
      if (!to) return ''
      let mailto = `mailto:${to}`
      const params = []
      if (fields.emailSubject) params.push(`subject=${encodeURIComponent(fields.emailSubject)}`)
      if (fields.emailBody) params.push(`body=${encodeURIComponent(fields.emailBody)}`)
      if (params.length) mailto += '?' + params.join('&')
      return mailto
    }
    case 'wifi': {
      const ssid = fields.wifiSsid || ''
      if (!ssid) return ''
      return `WIFI:T:${fields.wifiSecurity || 'WPA'};S:${ssid};P:${fields.wifiPassword || ''};;`
    }
    case 'vcard': {
      const name = fields.vcardName || ''
      if (!name) return ''
      return [
        'BEGIN:VCARD', 'VERSION:3.0', `FN:${name}`,
        fields.vcardPhone ? `TEL:${fields.vcardPhone}` : null,
        fields.vcardEmail ? `EMAIL:${fields.vcardEmail}` : null,
        fields.vcardOrg ? `ORG:${fields.vcardOrg}` : null,
        fields.vcardUrl ? `URL:${fields.vcardUrl}` : null,
        'END:VCARD',
      ].filter(Boolean).join('\n')
    }
    default: return ''
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

const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 80 }

function TypeFields({ type, fields, onChange }) {
  function set(key) { return e => onChange({ ...fields, [key]: e.target.value }) }
  switch (type) {
    case 'url':
      return <Field label="URL"><input style={inputStyle} type="url" placeholder="https://example.com" value={fields.url || ''} onChange={set('url')} /></Field>
    case 'text':
      return <Field label="Text"><textarea style={textareaStyle} placeholder="Enter any text…" value={fields.text || ''} onChange={set('text')} /></Field>
    case 'email':
      return (
        <>
          <Field label="To"><input style={inputStyle} type="email" placeholder="recipient@example.com" value={fields.emailTo || ''} onChange={set('emailTo')} /></Field>
          <Field label="Subject"><input style={inputStyle} type="text" placeholder="Subject line" value={fields.emailSubject || ''} onChange={set('emailSubject')} /></Field>
          <Field label="Body"><textarea style={textareaStyle} placeholder="Message body…" value={fields.emailBody || ''} onChange={set('emailBody')} /></Field>
        </>
      )
    case 'wifi':
      return (
        <>
          <Field label="Network Name (SSID)"><input style={inputStyle} type="text" placeholder="MyNetwork" value={fields.wifiSsid || ''} onChange={set('wifiSsid')} /></Field>
          <Field label="Password"><input style={inputStyle} type="text" placeholder="Password" value={fields.wifiPassword || ''} onChange={set('wifiPassword')} /></Field>
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
          <Field label="Full Name"><input style={inputStyle} type="text" placeholder="Jane Doe" value={fields.vcardName || ''} onChange={set('vcardName')} /></Field>
          <Field label="Phone"><input style={inputStyle} type="tel" placeholder="+1 555 000 0000" value={fields.vcardPhone || ''} onChange={set('vcardPhone')} /></Field>
          <Field label="Email"><input style={inputStyle} type="email" placeholder="jane@example.com" value={fields.vcardEmail || ''} onChange={set('vcardEmail')} /></Field>
          <Field label="Organization"><input style={inputStyle} type="text" placeholder="Company name" value={fields.vcardOrg || ''} onChange={set('vcardOrg')} /></Field>
          <Field label="Website"><input style={inputStyle} type="url" placeholder="https://example.com" value={fields.vcardUrl || ''} onChange={set('vcardUrl')} /></Field>
        </>
      )
    default: return null
  }
}

const cardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E8E8E8',
  borderRadius: 6,
  padding: 24,
  marginBottom: 16,
}

const cardTitleStyle = {
  fontFamily: 'var(--font-ui)',
  fontWeight: 800,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#AAAAAA',
  marginBottom: 20,
}

const CARD_TEMPLATES = {
  minimal: { label: 'Minimal', bg: '#FFFFFF', textColor: '#111111', qrFg: null, qrBg: null, border: false },
  dark:    { label: 'Dark',    bg: '#111111', textColor: '#FFFFFF', qrFg: '#FFFFFF', qrBg: '#111111', border: false },
  brand:   { label: 'Brand',   bg: '#E8352A', textColor: '#FFFFFF', qrFg: '#FFFFFF', qrBg: '#E8352A', border: false },
  soft:    { label: 'Soft',    bg: '#F8F8F8', textColor: '#111111', qrFg: null,      qrBg: null,      border: true  },
}

const DOT_STYLE_OPTIONS = [
  {
    id: 'square', label: 'Square',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect x="1" y="1" width="13" height="13" fill="#111"/>
        <rect x="18" y="1" width="13" height="13" fill="#111"/>
        <rect x="1" y="18" width="13" height="13" fill="#111"/>
        <rect x="18" y="18" width="13" height="13" fill="#111"/>
      </svg>
    ),
  },
  {
    id: 'dots', label: 'Dots',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="8"  cy="8"  r="6" fill="#111"/>
        <circle cx="24" cy="8"  r="6" fill="#111"/>
        <circle cx="8"  cy="24" r="6" fill="#111"/>
        <circle cx="24" cy="24" r="6" fill="#111"/>
      </svg>
    ),
  },
  {
    id: 'rounded', label: 'Rounded',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect x="1" y="1" width="13" height="13" rx="4" fill="#111"/>
        <rect x="18" y="1" width="13" height="13" rx="4" fill="#111"/>
        <rect x="1" y="18" width="13" height="13" rx="4" fill="#111"/>
        <rect x="18" y="18" width="13" height="13" rx="4" fill="#111"/>
      </svg>
    ),
  },
  {
    id: 'classy', label: 'Classy',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <path d="M1,1 L14,1 L14,8 L8,14 L1,14 Z" fill="#111"/>
        <path d="M18,1 L31,1 L31,8 L25,14 L18,14 Z" fill="#111"/>
        <path d="M1,18 L14,18 L14,25 L8,31 L1,31 Z" fill="#111"/>
        <path d="M18,18 L31,18 L31,25 L25,31 L18,31 Z" fill="#111"/>
      </svg>
    ),
  },
  {
    id: 'classy-rounded', label: 'Classy-R',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <path d="M5,1 Q1,1 1,5 L1,14 L8,14 Q14,12 14,8 L14,5 Q14,1 10,1 Z" fill="#111"/>
        <path d="M22,1 Q18,1 18,5 L18,8 Q18,12 24,14 L31,14 L31,5 Q31,1 27,1 Z" fill="#111"/>
        <path d="M5,18 Q1,18 1,22 L1,31 L8,31 Q14,29 14,25 L14,22 Q14,18 10,18 Z" fill="#111"/>
        <path d="M22,18 Q18,18 18,22 L18,25 Q18,29 24,31 L31,31 L31,22 Q31,18 27,18 Z" fill="#111"/>
      </svg>
    ),
  },
]

const EYE_STYLE_OPTIONS = [
  {
    id: 'square', label: 'Square',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect x="1" y="1" width="30" height="30" fill="none" stroke="#111" strokeWidth="4"/>
        <rect x="9" y="9" width="14" height="14" fill="#111"/>
      </svg>
    ),
  },
  {
    id: 'dot', label: 'Dot',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="15" fill="none" stroke="#111" strokeWidth="4"/>
        <circle cx="16" cy="16" r="6" fill="#111"/>
      </svg>
    ),
  },
  {
    id: 'extra-rounded', label: 'Extra-R',
    svg: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect x="1" y="1" width="30" height="30" rx="9" fill="none" stroke="#111" strokeWidth="4"/>
        <circle cx="16" cy="16" r="6" fill="#111"/>
      </svg>
    ),
  },
]

function getEyeTypeOptions(eyeStyle) {
  const cornersSquare = eyeStyle === 'dot' ? 'dot' : eyeStyle === 'extra-rounded' ? 'extra-rounded' : 'square'
  const cornersDot = eyeStyle === 'dot' ? 'dot' : 'square'
  return { cornersSquare, cornersDot }
}

async function blobToDataUrl(blob) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function drawCardCanvas(canvas, qrSrc, template, topText, bottomText, cardFont, cardTextColor, cardQrSize) {
  const W = 1200, H = 630
  const ctx = canvas.getContext('2d')
  const tmpl = CARD_TEMPLATES[template]

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = tmpl.bg
  ctx.fillRect(0, 0, W, H)

  if (tmpl.border) {
    ctx.strokeStyle = '#DDDDDD'
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3)
  }

  const qrPx = Math.round(H * (cardQrSize / 100))
  const qrX = Math.round((W - qrPx) / 2)
  const qrY = Math.round((H - qrPx) / 2)

  if (qrSrc) {
    await new Promise(resolve => {
      const img = new Image()
      img.onload = () => { ctx.drawImage(img, qrX, qrY, qrPx, qrPx); resolve() }
      img.onerror = resolve
      img.src = qrSrc
    })
  }

  await document.fonts.ready

  ctx.textAlign = 'center'
  ctx.fillStyle = cardTextColor

  if (topText) {
    ctx.font = `700 48px "${cardFont}", sans-serif`
    ctx.fillText(topText, W / 2, 80)
  }
  if (bottomText) {
    ctx.font = `700 36px "${cardFont}", sans-serif`
    ctx.fillText(bottomText, W / 2, H - 44)
  }
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
  const [logoObjectUrl, setLogoObjectUrl] = useState(null)
  const [logoSize, setLogoSize] = useState(25)

  // Design Studio
  const [mainTab, setMainTab] = useState('generator')
  const [activeDesignSection, setActiveDesignSection] = useState('qr')
  const [dotStyle, setDotStyle] = useState('square')
  const [eyeStyle, setEyeStyle] = useState('square')
  const [eyeColor, setEyeColor] = useState('#111111')
  const [cardTemplate, setCardTemplate] = useState('minimal')
  const [topText, setTopText] = useState('')
  const [bottomText, setBottomText] = useState('')
  const [cardFont, setCardFont] = useState('Syne')
  const [cardTextColor, setCardTextColor] = useState('#111111')
  const [cardQrSize, setCardQrSize] = useState(60)
  const [cardPreviewUrl, setCardPreviewUrl] = useState('')

  const qrCodeRef = useRef(null)
  const qrContainerRef = useRef(null)
  const fileInputRef = useRef(null)

  const content = buildQrContent(activeType, fields)

  // Manage logo object URL lifecycle
  useEffect(() => {
    if (!logoFile) { setLogoObjectUrl(null); return }
    const url = URL.createObjectURL(logoFile)
    setLogoObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  // Initialize QR instances once on mount
  useEffect(() => {
    const baseOpts = {
      width: 1200, height: 1200,
      data: 'https://wisiqr.com',
      image: '',
      dotsOptions: { color: '#111111', type: 'square' },
      backgroundOptions: { color: '#FFFFFF' },
      cornersSquareOptions: { color: '#111111', type: 'square' },
      cornersDotOptions: { color: '#111111', type: 'square' },
      qrOptions: { errorCorrectionLevel: 'H' },
    }

    qrCodeRef.current = new QRCodeStyling(baseOpts)
    if (qrContainerRef.current) {
      qrCodeRef.current.append(qrContainerRef.current)
    }

  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update main QR when any relevant param changes
  useEffect(() => {
    if (!qrCodeRef.current) return
    const { cornersSquare, cornersDot } = getEyeTypeOptions(eyeStyle)

    // qr-code-styling handles only visual style; logo is never passed here
    qrCodeRef.current.update({
      width: 1200, height: 1200,
      data: content || 'https://wisiqr.com',
      image: '',
      dotsOptions: { color: fgColor, type: dotStyle },
      backgroundOptions: { color: bgColor },
      cornersSquareOptions: { color: eyeColor, type: cornersSquare },
      cornersDotOptions: { color: eyeColor, type: cornersDot },
      qrOptions: { errorCorrectionLevel: 'H' },
    })

    if (!content) { setQrDataUrl(''); return }

    let cancelled = false
    ;(async () => {
      try {
        const blob = await qrCodeRef.current.getRawData('png')
        if (cancelled || !blob) return

        const qrImg = await loadImage(await blobToDataUrl(blob))
        const canvas = document.createElement('canvas')
        canvas.width = 1200; canvas.height = 1200
        const ctx = canvas.getContext('2d')
        ctx.drawImage(qrImg, 0, 0, 1200, 1200)

        if (logoObjectUrl) {
          const logoImg = await loadImage(logoObjectUrl)
          const maxLogoSize = 1200 * (logoSize / 100)
          const ratio = Math.min(maxLogoSize / logoImg.width, maxLogoSize / logoImg.height)
          const lW = Math.round(logoImg.width * ratio)
          const lH = Math.round(logoImg.height * ratio)
          const padding = Math.round(maxLogoSize * 0.12)
          const lX = Math.round((1200 - lW) / 2)
          const lY = Math.round((1200 - lH) / 2)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(lX - padding, lY - padding, lW + padding * 2, lH + padding * 2)
          ctx.drawImage(logoImg, lX, lY, lW, lH)
        }

        if (!cancelled) setQrDataUrl(canvas.toDataURL('image/png'))
      } catch { /* ignore */ }
    })()

    return () => { cancelled = true }
  }, [content, fgColor, bgColor, logoObjectUrl, logoSize, dotStyle, eyeStyle, eyeColor])

  // Regenerate card preview whenever the QR or card settings change
  useEffect(() => {
    if (!qrDataUrl) { setCardPreviewUrl(''); return }

    let cancelled = false
    ;(async () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1200
        canvas.height = 630
        await drawCardCanvas(canvas, qrDataUrl, cardTemplate, topText, bottomText, cardFont, cardTextColor, cardQrSize)
        if (!cancelled) setCardPreviewUrl(canvas.toDataURL('image/png'))
      } catch { /* ignore */ }
    })()

    return () => { cancelled = true }
  }, [qrDataUrl, cardTemplate, topText, bottomText, cardFont, cardTextColor, cardQrSize])

  function handleDownload() {
    if (!content) return
    if (format === 'svg') {
      qrCodeRef.current.download({ name: `wisiqr-${activeType}`, extension: 'svg' })
    } else {
      if (!qrDataUrl) return
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `wisiqr-${activeType}.png`
      link.click()
    }
  }

  function handleCardDownload() {
    if (!cardPreviewUrl) return
    const link = document.createElement('a')
    link.href = cardPreviewUrl
    link.download = 'wisiqr-card.png'
    link.click()
  }

  function handleTypeChange(id) {
    setActiveType(id)
    setFields({})
  }

  function handleLogoChange(e) {
    const file = e.target.files[0]
    if (file) setLogoFile(file)
    e.target.value = ''
  }

  const pillBtn = (isActive) => ({
    padding: '6px 14px',
    borderRadius: 3,
    border: '1px solid #E8E8E8',
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    background: isActive ? '#E8352A' : '#F8F8F8',
    color: isActive ? '#FFFFFF' : '#666666',
    transition: 'all 0.12s',
  })

  const mainTabBtn = (isActive) => ({
    padding: '8px 24px',
    borderRadius: 3,
    border: '1px solid #E8E8E8',
    fontFamily: 'var(--font-ui)',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    background: isActive ? '#E8352A' : '#F8F8F8',
    color: isActive ? '#FFFFFF' : '#666666',
    transition: 'all 0.12s',
  })

  const styleIconBtn = (isActive) => ({
    width: 60, height: 60,
    border: isActive ? '2px solid #E8352A' : '1px solid #E8E8E8',
    borderRadius: 6,
    background: isActive ? '#FFFFFF' : '#F8F8F8',
    cursor: 'pointer',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
    padding: 4,
  })

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', padding: '40px 24px' }}>

      {/* Hidden QR container — always mounted regardless of active tab */}
      <div ref={qrContainerRef} style={{ display: 'none' }} />

      {/* ── Main tab pills ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <button onClick={() => setMainTab('generator')} style={mainTabBtn(mainTab === 'generator')}>
          Generator
        </button>
        <button onClick={() => setMainTab('design')} style={mainTabBtn(mainTab === 'design')}>
          Design Studio
        </button>
      </div>

      {/* ── GENERATOR TAB ── */}
      {mainTab === 'generator' && (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

        {/* Left column */}
        <div>

          {/* QR Type + Fields */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>QR Type</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              {TYPES.map(t => (
                <button key={t.id} onClick={() => handleTypeChange(t.id)} style={pillBtn(activeType === t.id)}>
                  {t.label}
                </button>
              ))}

              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                {logoFile ? (
                  <>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#666666', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {logoFile.name}
                    </span>
                    <button
                      onClick={() => setLogoFile(null)}
                      style={{ background: 'none', border: '1px solid #E8E8E8', borderRadius: 3, padding: '5px 10px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, color: '#E8352A', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                    >
                      ✕ Remove
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 140, marginLeft: 8 }}>
                      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#666666', marginBottom: 4 }}>
                        Logo Size: <span style={{ fontFamily: 'var(--font-mono)', color: '#E8352A' }}>{logoSize}</span>%
                      </div>
                      <input type="range" min={10} max={40} step={1} value={logoSize} onChange={e => setLogoSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#E8352A', cursor: 'pointer' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA' }}>10%</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA' }}>40%</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#F8F8F8', border: '1px solid #E8E8E8', borderRadius: 3, padding: '6px 14px', fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, color: '#666666', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                  >
                    Upload Logo
                  </button>
                )}
              </div>
            </div>

            <TypeFields type={activeType} fields={fields} onChange={setFields} />
          </div>

          {/* Customization */}
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Customization</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <Field label="Foreground Color">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E8E8E8', borderRadius: 4, padding: '8px 12px' }}>
                  <input type="color" value={fgColor} onChange={e => setFgColor(e.target.value)} style={{ width: 24, height: 24, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'none' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666666' }}>{fgColor.toUpperCase()}</span>
                </div>
              </Field>
              <Field label="Background Color">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E8E8E8', borderRadius: 4, padding: '8px 12px' }}>
                  <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} style={{ width: 24, height: 24, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'none' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666666' }}>{bgColor.toUpperCase()}</span>
                </div>
              </Field>
            </div>

            <Field label={`Size — ${size}px`}>
              <input type="range" min={150} max={600} value={size} onChange={e => setSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#E8352A', cursor: 'pointer' }} />
            </Field>
          </div>
        </div>

        {/* Right column — QR preview */}
        <div style={{ position: 'sticky', top: 76, alignSelf: 'start' }}>
          <div style={cardStyle}>
            <div style={cardTitleStyle}>Preview</div>

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
              overflow: 'hidden',
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

            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {['png', 'svg'].map(f => (
                <button key={f} onClick={() => setFormat(f)} style={{
                  flex: 1, padding: '8px 0', borderRadius: 3, border: '1px solid #E8E8E8',
                  fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer', background: format === f ? '#111111' : '#F8F8F8', color: format === f ? '#FFFFFF' : '#666666', transition: 'all 0.12s',
                }}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>

            <button
              onClick={handleDownload}
              disabled={!content}
              style={{
                width: '100%', background: '#E8352A', color: '#FFFFFF', border: 'none', borderRadius: 3, padding: '12px 0',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
                cursor: content ? 'pointer' : 'not-allowed', opacity: content ? 1 : 0.4, marginBottom: 10, transition: 'opacity 0.15s',
              }}
            >
              ↓ Download {format.toUpperCase()}
            </button>

            <button
              onClick={() => setShowModal(true)}
              disabled={!qrDataUrl}
              style={{
                width: '100%', background: 'transparent', color: '#666666', border: '1px solid #E8E8E8', borderRadius: 3, padding: '12px 0',
                fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
                cursor: qrDataUrl ? 'pointer' : 'not-allowed', opacity: qrDataUrl ? 1 : 0.4, transition: 'opacity 0.15s',
              }}
            >
              ✉ Send via Email
            </button>
          </div>
        </div>
      </div>
      )}

      {/* ── DESIGN STUDIO TAB ── */}
      {mainTab === 'design' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* Left column — tabs + content */}
          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              <button onClick={() => setActiveDesignSection('qr')} style={pillBtn(activeDesignSection === 'qr')}>
                QR Style
              </button>
              <button onClick={() => setActiveDesignSection('card')} style={pillBtn(activeDesignSection === 'card')}>
                QR Card
              </button>
            </div>

            {activeDesignSection === 'qr' ? (
              <div style={cardStyle}>
                <Field label="Dot Style">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DOT_STYLE_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setDotStyle(opt.id)} title={opt.label} style={styleIconBtn(dotStyle === opt.id)}>
                        {opt.svg}
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, color: '#666', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Eye Style">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EYE_STYLE_OPTIONS.map(opt => (
                      <button key={opt.id} onClick={() => setEyeStyle(opt.id)} title={opt.label} style={styleIconBtn(eyeStyle === opt.id)}>
                        {opt.svg}
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, color: '#666', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Eye Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E8E8E8', borderRadius: 4, padding: '8px 12px' }}>
                    <input type="color" value={eyeColor} onChange={e => setEyeColor(e.target.value)} style={{ width: 24, height: 24, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'none' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666666' }}>{eyeColor.toUpperCase()}</span>
                  </div>
                </Field>
              </div>
            ) : (
              <div style={cardStyle}>
                <Field label="Template">
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {Object.entries(CARD_TEMPLATES).map(([id, tmpl]) => (
                      <button
                        key={id}
                        onClick={() => { setCardTemplate(id); setCardTextColor(tmpl.textColor) }}
                        style={{
                          width: 80, height: 50,
                          border: cardTemplate === id ? '2px solid #E8352A' : '1px solid #E8E8E8',
                          borderRadius: 4, background: tmpl.bg, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 3,
                          padding: 4,
                          outline: tmpl.border ? '1px solid #DDDDDD' : 'none', outlineOffset: -1,
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 22 22">
                          <rect x="0" y="0" width="9" height="9" rx="1" fill={tmpl.qrFg || '#111'} opacity="0.6"/>
                          <rect x="13" y="0" width="9" height="9" rx="1" fill={tmpl.qrFg || '#111'} opacity="0.6"/>
                          <rect x="0" y="13" width="9" height="9" rx="1" fill={tmpl.qrFg || '#111'} opacity="0.6"/>
                          <rect x="11" y="11" width="4" height="4" fill={tmpl.qrFg || '#111'} opacity="0.4"/>
                          <rect x="17" y="13" width="4" height="4" fill={tmpl.qrFg || '#111'} opacity="0.4"/>
                          <rect x="11" y="17" width="4" height="4" fill={tmpl.qrFg || '#111'} opacity="0.4"/>
                        </svg>
                        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 8, color: tmpl.textColor, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{tmpl.label}</span>
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Top Text">
                  <input style={inputStyle} type="text" placeholder="Your name or brand" value={topText} onChange={e => setTopText(e.target.value)} />
                </Field>

                <Field label="Bottom Text">
                  <input style={inputStyle} type="text" placeholder="Scan to visit" value={bottomText} onChange={e => setBottomText(e.target.value)} />
                </Field>

                <Field label="Font">
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['Syne', 'DM Mono', 'Georgia', 'Arial'].map(f => (
                      <button
                        key={f}
                        onClick={() => setCardFont(f)}
                        style={{
                          padding: '5px 12px', borderRadius: 20,
                          border: cardFont === f ? '2px solid #E8352A' : '1px solid #E8E8E8',
                          background: cardFont === f ? '#FFFFFF' : '#F8F8F8',
                          fontFamily: f === 'DM Mono' ? 'var(--font-mono)' : f === 'Syne' ? 'var(--font-ui)' : f,
                          fontSize: 12, color: '#111111', cursor: 'pointer',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Text Color">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E8E8E8', borderRadius: 4, padding: '8px 12px' }}>
                    <input type="color" value={cardTextColor} onChange={e => setCardTextColor(e.target.value)} style={{ width: 24, height: 24, border: 'none', borderRadius: 3, cursor: 'pointer', padding: 0, background: 'none' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666666' }}>{cardTextColor.toUpperCase()}</span>
                  </div>
                </Field>

                <Field label={`QR Size in Card — ${cardQrSize}%`}>
                  <input type="range" min={40} max={80} value={cardQrSize} onChange={e => setCardQrSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#E8352A', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA' }}>40%</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#AAAAAA' }}>80%</span>
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* Right column — contextual preview */}
          <div style={{ position: 'sticky', top: 76, alignSelf: 'start' }}>
            {activeDesignSection === 'qr' ? (
              <div style={cardStyle}>
                <div style={cardTitleStyle}>Preview</div>

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
                  overflow: 'hidden',
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

                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {['png', 'svg'].map(f => (
                    <button key={f} onClick={() => setFormat(f)} style={{
                      flex: 1, padding: '8px 0', borderRadius: 3, border: '1px solid #E8E8E8',
                      fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em',
                      cursor: 'pointer', background: format === f ? '#111111' : '#F8F8F8', color: format === f ? '#FFFFFF' : '#666666', transition: 'all 0.12s',
                    }}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDownload}
                  disabled={!content}
                  style={{
                    width: '100%', background: '#E8352A', color: '#FFFFFF', border: 'none', borderRadius: 3, padding: '12px 0',
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: content ? 'pointer' : 'not-allowed', opacity: content ? 1 : 0.4, marginBottom: 10, transition: 'opacity 0.15s',
                  }}
                >
                  ↓ Download {format.toUpperCase()}
                </button>

                <button
                  onClick={() => setShowModal(true)}
                  disabled={!qrDataUrl}
                  style={{
                    width: '100%', background: 'transparent', color: '#666666', border: '1px solid #E8E8E8', borderRadius: 3, padding: '12px 0',
                    fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: qrDataUrl ? 'pointer' : 'not-allowed', opacity: qrDataUrl ? 1 : 0.4, transition: 'opacity 0.15s',
                  }}
                >
                  ✉ Send via Email
                </button>
              </div>
            ) : (
              <div style={cardStyle}>
                <div style={cardTitleStyle}>Card Preview</div>

                {cardPreviewUrl ? (
                  <>
                    <div style={{ margin: '0 -24px 16px', overflow: 'hidden', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
                      <img src={cardPreviewUrl} alt="Card preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                    <button
                      onClick={handleCardDownload}
                      style={{
                        width: '100%', background: '#111111', color: '#FFFFFF', border: 'none', borderRadius: 3, padding: '12px 0',
                        fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
                      }}
                    >
                      ↓ Download Card PNG
                    </button>
                  </>
                ) : (
                  <div style={{
                    margin: '0 -24px',
                    background: '#F8F8F8',
                    borderTop: '1px solid #E8E8E8',
                    borderBottom: '1px solid #E8E8E8',
                    height: 178,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: '#AAAAAA' }}>Fill in the fields to preview</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <EmailModal qrDataUrl={qrDataUrl} qrLabel={content} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
