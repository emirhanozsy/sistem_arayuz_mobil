import { useState } from 'react'
import './MemberCard.css'

export default function MemberCard({ member, onUpdateMember }) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  // Active inline form: null | 'belge' | 'referans' | 'not'
  const [activeForm, setActiveForm] = useState(null)

  const currentStatus = member.DURUM || member['ZİYARET DURUMU'] || ''
  const currentRecipient = member['BELGEYİ ALAN'] || member.belgeyi_alan || ''
  const currentReferans = member['REFERANS'] || member.referans || ''
  const currentNotlar = member['NOTLAR'] || member.notlar || ''

  // Form states
  const [recipientInput, setRecipientInput] = useState(currentRecipient)
  const [referansInput, setReferansInput] = useState(currentReferans)
  const [notlarInput, setNotlarInput] = useState(currentNotlar)

  const statusOptions = [
    { label: 'Ziyarete Gidildi', value: 'Ziyarete Gidildi', color: 'success' },
    { label: 'Belge Alındı', value: 'Belge Alındı', color: 'info' },
    { label: 'Karşı Tarafta', value: 'Karşı Tarafta', color: 'warning' },
  ]

  const handleStatusClick = async (statusValue) => {
    if (statusValue === 'Belge Alındı') {
      setRecipientInput(currentRecipient)
      setActiveForm(activeForm === 'belge' ? null : 'belge')
      return
    }

    setActiveForm(null)
    const newStatus = currentStatus === statusValue ? '' : statusValue
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: newStatus,
        belgeyiAlan: newStatus === '' ? '' : currentRecipient,
        referans: currentReferans,
        notlar: currentNotlar
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveRecipient = async (e) => {
    if (e) e.preventDefault()
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: 'Belge Alındı',
        belgeyiAlan: recipientInput.trim(),
        referans: currentReferans,
        notlar: currentNotlar
      })
      setActiveForm(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveReferans = async (e) => {
    if (e) e.preventDefault()
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: currentStatus,
        belgeyiAlan: currentRecipient,
        referans: referansInput.trim(),
        notlar: currentNotlar
      })
      setActiveForm(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSaveNotlar = async (e) => {
    if (e) e.preventDefault()
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: currentStatus,
        belgeyiAlan: currentRecipient,
        referans: currentReferans,
        notlar: notlarInput.trim()
      })
      setActiveForm(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearStatus = async () => {
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: '',
        belgeyiAlan: '',
        referans: currentReferans,
        notlar: currentNotlar
      })
      setRecipientInput('')
      setActiveForm(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearReferans = async () => {
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: currentStatus,
        belgeyiAlan: currentRecipient,
        referans: '',
        notlar: currentNotlar
      })
      setReferansInput('')
      setActiveForm(null)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleClearNotlar = async () => {
    setIsUpdating(true)
    try {
      await onUpdateMember({
        rowIndex: member.__originalRowIndex,
        durum: currentStatus,
        belgeyiAlan: currentRecipient,
        referans: currentReferans,
        notlar: ''
      })
      setNotlarInput('')
      setActiveForm(null)
    } finally {
      setIsUpdating(false)
    }
  }

  // Clean phone number for tel: link
  const rawPhone = member['CEP TELEFONU (GSM) '] || member['CEP TELEFONU (GSM)'] || member['TELEFON'] || ''
  const cleanPhone = rawPhone.toString().replace(/[^0-9]/g, '')
  const formattedPhone = rawPhone ? rawPhone.toString().replace(/\(GSM\)/gi, '').trim() : ''

  const address = member['ADRES'] || ''
  const ilce = member['İLÇE'] || member['ILCE'] || ''
  const yetkili = member['YETKİLİ ADI SOYADI/UNVAN'] || member['YETKILI ADI SOYADI/UNVAN'] || ''
  const unvan = member['UNVAN'] || ''
  const uyeSicil = member['UYE SICIL NO'] || member['ÜYE SİCİL NO'] || ''
  const ticaretSicil = member['TİCARET SİCİL NO'] || member['TICARET SICIL NO'] || ''
  const meslekGrubu = member['MESLEK GRUBU'] || ''

  return (
    <div className={`member-card ${currentStatus ? 'has-status' : ''}`}>
      {/* Top badges & Title */}
      <div className="card-top">
        <div className="card-badges">
          {uyeSicil && (
            <span className="badge badge-subtle">
              Sicil: <strong>{uyeSicil}</strong>
            </span>
          )}
          {ticaretSicil && (
            <span className="badge badge-subtle">
              Tic. Sicil: <strong>{ticaretSicil}</strong>
            </span>
          )}
          {ilce && (
            <span className="badge badge-ilce">
              {ilce}
            </span>
          )}
        </div>

        {currentStatus && (
          <div className="current-status-badge">
            <span className="status-indicator-dot" />
            {currentStatus}
          </div>
        )}
      </div>

      <h3 className="company-title" onClick={() => setExpanded(!expanded)}>
        {unvan}
      </h3>

      {/* Recipient banner if Belge Alındı */}
      {currentStatus === 'Belge Alındı' && currentRecipient && (
        <div className="card-banner banner-info" onClick={() => { setRecipientInput(currentRecipient); setActiveForm('belge'); }}>
          <div className="banner-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div className="banner-content">
            <span className="banner-label">Belgeyi Alan:</span>
            <span className="banner-val">{currentRecipient}</span>
          </div>
          <span className="banner-edit-hint">Düzenle</span>
        </div>
      )}

      {/* Referans banner if set */}
      {currentReferans && (
        <div className="card-banner banner-referans" onClick={() => { setReferansInput(currentReferans); setActiveForm('referans'); }}>
          <div className="banner-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="banner-content">
            <span className="banner-label">Referans:</span>
            <span className="banner-val">{currentReferans}</span>
          </div>
          <span className="banner-edit-hint">Düzenle</span>
        </div>
      )}

      {/* Notlar banner if set */}
      {currentNotlar && (
        <div className="card-banner banner-note" onClick={() => { setNotlarInput(currentNotlar); setActiveForm('not'); }}>
          <div className="banner-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div className="banner-content">
            <span className="banner-label">Not:</span>
            <span className="banner-val">{currentNotlar}</span>
          </div>
          <span className="banner-edit-hint">Düzenle</span>
        </div>
      )}

      {yetkili && (
        <div className="card-field authority">
          <svg className="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="field-value">{yetkili}</span>
        </div>
      )}

      {/* Address preview / full */}
      {address && (
        <div className="card-field address">
          <svg className="field-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span className={`field-value ${expanded ? 'full-text' : 'truncate-2'}`}>
            {address}
          </span>
        </div>
      )}

      {/* Quick Action Buttons for Phone & Maps */}
      <div className="quick-contact-actions">
        {cleanPhone && (
          <a href={`tel:${cleanPhone}`} className="contact-action-btn btn-call">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{formattedPhone || 'Ara'}</span>
          </a>
        )}

        {address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(address + ' ' + ilce)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contact-action-btn btn-map"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
            <span>Haritada Aç</span>
          </a>
        )}

        <button
          type="button"
          className="contact-action-btn btn-details"
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? 'Daralt' : 'Detaylar'}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="expanded-details">
          {meslekGrubu && (
            <div className="detail-row">
              <span className="detail-label">Meslek Grubu:</span>
              <span className="detail-val">{meslekGrubu}</span>
            </div>
          )}
          {member['YETKİ BELGESİ DURUM'] && (
            <div className="detail-row">
              <span className="detail-label">Yetki Belgesi:</span>
              <span className="detail-val">{member['YETKİ BELGESİ DURUM']}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Excel Satır No:</span>
            <span className="detail-val">#{member.__originalRowIndex + 1}</span>
          </div>
        </div>
      )}

      {/* Status Action Buttons Group */}
      <div className="status-action-group">
        <div className="status-header-row">
          <span className="status-action-title">Durum Güncelle:</span>
          {currentStatus && (
            <button
              type="button"
              className="clear-status-btn"
              onClick={handleClearStatus}
              disabled={isUpdating}
            >
              Durumu Temizle
            </button>
          )}
        </div>

        <div className="status-buttons-container">
          {statusOptions.map((opt) => {
            const isSelected = currentStatus === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isUpdating}
                onClick={() => handleStatusClick(opt.value)}
                className={`status-btn status-btn-${opt.color} ${isSelected ? 'active' : ''}`}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Secondary Toolbar: Referans & Notlar */}
        <div className="secondary-action-toolbar">
          <button
            type="button"
            className={`secondary-btn ${currentReferans ? 'has-value' : ''} ${activeForm === 'referans' ? 'active' : ''}`}
            onClick={() => { setReferansInput(currentReferans); setActiveForm(activeForm === 'referans' ? null : 'referans'); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>{currentReferans ? `Ref: ${currentReferans}` : '+ Referans'}</span>
          </button>

          <button
            type="button"
            className={`secondary-btn ${currentNotlar ? 'has-value' : ''} ${activeForm === 'not' ? 'active' : ''}`}
            onClick={() => { setNotlarInput(currentNotlar); setActiveForm(activeForm === 'not' ? null : 'not'); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>{currentNotlar ? 'Notu Gör / Düzenle' : '+ Not Ekle'}</span>
          </button>
        </div>

        {/* Form 1: Belgeyi Alan */}
        {activeForm === 'belge' && (
          <form className="inline-action-card border-info" onSubmit={handleSaveRecipient}>
            <div className="inline-card-header text-info">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span>Belgeyi Alan Kişi:</span>
            </div>

            <input
              type="text"
              autoFocus
              className="inline-input-field"
              placeholder="Adı Soyadı veya unvan yazın..."
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
            />

            <div className="quick-tags-container">
              {['Serhat Akyıldız', 'Ofis', 'Kurye', 'Avukat'].map(name => (
                <button
                  key={name}
                  type="button"
                  className="quick-chip"
                  onClick={() => setRecipientInput(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <div className="inline-actions-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setActiveForm(null)}
                disabled={isUpdating}
              >
                İptal
              </button>
              <button
                type="submit"
                className="btn-save btn-save-info"
                disabled={isUpdating}
              >
                {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}

        {/* Form 2: Referans */}
        {activeForm === 'referans' && (
          <form className="inline-action-card border-referans" onSubmit={handleSaveReferans}>
            <div className="inline-card-header text-referans">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
              <span>Referans Bilgisi:</span>
            </div>

            <input
              type="text"
              autoFocus
              className="inline-input-field"
              placeholder="Referans olan kişinin adı / kurumu..."
              value={referansInput}
              onChange={(e) => setReferansInput(e.target.value)}
            />

            <div className="inline-actions-footer">
              {currentReferans && (
                <button
                  type="button"
                  className="btn-danger-link"
                  onClick={handleClearReferans}
                  disabled={isUpdating}
                >
                  Referansı Sil
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveForm(null)}
                  disabled={isUpdating}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-save btn-save-referans"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Form 3: Not Ekle / Düzenle */}
        {activeForm === 'not' && (
          <form className="inline-action-card border-not" onSubmit={handleSaveNotlar}>
            <div className="inline-card-header text-not">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Üye Hakkında Not:</span>
            </div>

            <textarea
              autoFocus
              rows={3}
              className="inline-textarea-field"
              placeholder="Görüşme notu, randevu tarihi veya özel açıklama yazın..."
              value={notlarInput}
              onChange={(e) => setNotlarInput(e.target.value)}
            />

            <div className="inline-actions-footer">
              {currentNotlar && (
                <button
                  type="button"
                  className="btn-danger-link"
                  onClick={handleClearNotlar}
                  disabled={isUpdating}
                >
                  Notu Sil
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setActiveForm(null)}
                  disabled={isUpdating}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-save btn-save-not"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
