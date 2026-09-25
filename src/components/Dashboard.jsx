import { useState, useCallback, useRef, useEffect } from 'react'
import MemberCard from './MemberCard.jsx'
import { loadData, searchMembers, updateMember, getStats } from '../data-service.js'
import './Dashboard.css'

export default function Dashboard({ onLogout, showToast, theme, toggleTheme }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [filterIlce, setFilterIlce] = useState('')
  const [filterDurum, setFilterDurum] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [stats, setStats] = useState({ total: 0, visited: 0, document_received: 0, opposite_party: 0 })
  const [dataLoaded, setDataLoaded] = useState(false)

  const searchTimeoutRef = useRef(null)

  // Load data on mount
  useEffect(() => {
    loadData().then(() => {
      setDataLoaded(true)
      setStats(getStats())
    }).catch(() => {
      showToast('Veri yüklenirken hata oluştu', 'error')
    })
  }, [])

  const refreshStats = () => {
    setStats(getStats())
  }

  const performSearch = useCallback((searchQuery, searchPage = 1, ilce = filterIlce, durum = filterDurum, append = false) => {
    if (!searchQuery.trim() && !durum && !ilce) {
      setResults([])
      setHasSearched(false)
      setTotalResults(0)
      return
    }

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsSearching(true)
    }

    // Use requestAnimationFrame to keep UI responsive
    requestAnimationFrame(() => {
      const data = searchMembers({
        q: searchQuery.trim(),
        page: searchPage,
        limit: 20,
        ilce,
        durum,
      })

      if (append) {
        setResults(prev => [...prev, ...data.results])
      } else {
        setResults(data.results)
      }
      setTotalResults(data.total)
      setHasMore(data.hasMore)
      setPage(searchPage)
      setHasSearched(true)
      setIsSearching(false)
      setIsLoadingMore(false)
    })
  }, [filterIlce, filterDurum])

  const handleSearchInput = (e) => {
    const value = e.target.value
    setQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value, 1, filterIlce, filterDurum)
    }, 350)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    performSearch(query, 1, filterIlce, filterDurum)
  }

  const handleLoadMore = () => {
    performSearch(query, page + 1, filterIlce, filterDurum, true)
  }

  const handleFilterDistrictChange = (ilce) => {
    const newIlce = filterIlce === ilce ? '' : ilce
    setFilterIlce(newIlce)
    performSearch(query, 1, newIlce, filterDurum)
  }

  const handleFilterDurumChange = (durum) => {
    const newDurum = filterDurum === durum ? '' : durum
    setFilterDurum(newDurum)
    performSearch(query, 1, filterIlce, newDurum)
  }

  const handleUpdateMember = async ({ rowIndex, durum, belgeyiAlan, referans, notlar }) => {
    try {
      const result = updateMember({ rowIndex, durum, belgeyiAlan, referans, notlar })
      
      if (result.success) {
        setResults(prev => prev.map(item => {
          if (item.__originalRowIndex === rowIndex) {
            return {
              ...item,
              DURUM: durum,
              'BELGEYİ ALAN': belgeyiAlan,
              belgeyi_alan: belgeyiAlan,
              REFERANS: referans,
              referans: referans,
              NOTLAR: notlar,
              notlar: notlar
            }
          }
          return item
        }))

        // Smart toast feedback
        if (durum === 'Belge Alındı' && belgeyiAlan) {
          showToast(`Belge Alındı (${belgeyiAlan}) kaydedildi`, 'success')
        } else if (referans) {
          showToast(`Referans (${referans}) kaydedildi`, 'success')
        } else if (notlar) {
          showToast('Not başarıyla kaydedildi', 'success')
        } else if (durum) {
          showToast(`"${durum}" olarak güncellendi`, 'success')
        } else {
          showToast('Değişiklik kaydedildi', 'success')
        }
        refreshStats()
      } else {
        showToast('Kayıt başarısız oldu', 'error')
      }
    } catch {
      showToast('Bir hata oluştu', 'error')
    }
  }

  const handleStatusUpdate = async (rowIndex, field, value, belgeyiAlan = '') => {
    return handleUpdateMember({ rowIndex, durum: value, belgeyiAlan })
  }

  const clearSearch = () => {
    setQuery('')
    if (!filterDurum && !filterIlce) {
      setResults([])
      setHasSearched(false)
      setTotalResults(0)
    } else {
      performSearch('', 1, filterIlce, filterDurum)
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
  }

  return (
    <div className="dashboard">
      {/* Mobile Sticky Header */}
      <header className="dashboard-header">
        <div className="header-top">
          <div className="header-brand">
            <div className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <div className="brand-name">Üye Takip Sistemi</div>
              <div className="user-badge">serhat.akyildiz</div>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={toggleTheme}
              aria-label="Tema değiştir"
              title="Temayı Değiştir"
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </button>
            <button
              className="icon-button logout-button"
              onClick={onLogout}
              aria-label="Çıkış yap"
              title="Çıkış Yap"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="stats-bar">
          <div
            className={`stat-pill ${filterDurum === 'Ziyarete Gidildi' ? 'stat-active' : ''}`}
            onClick={() => handleFilterDurumChange('Ziyarete Gidildi')}
          >
            <span className="stat-indicator green" />
            <span className="stat-label">Ziyaret:</span>
            <span className="stat-num">{stats.visited}</span>
          </div>
          <div
            className={`stat-pill ${filterDurum === 'Belge Alındı' ? 'stat-active' : ''}`}
            onClick={() => handleFilterDurumChange('Belge Alındı')}
          >
            <span className="stat-indicator cyan" />
            <span className="stat-label">Belge:</span>
            <span className="stat-num">{stats.document_received}</span>
          </div>
          <div
            className={`stat-pill ${filterDurum === 'Karşı Tarafta' ? 'stat-active' : ''}`}
            onClick={() => handleFilterDurumChange('Karşı Tarafta')}
          >
            <span className="stat-indicator orange" />
            <span className="stat-label">Karşı Taraf:</span>
            <span className="stat-num">{stats.opposite_party}</span>
          </div>
        </div>

        {/* Search input bar */}
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleSearchInput}
              placeholder={dataLoaded ? "Unvan, sicil no, yetkili veya kelime ara..." : "Veri yükleniyor..."}
              className="search-input"
              autoComplete="off"
              disabled={!dataLoaded}
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                onClick={clearSearch}
                aria-label="Aramayı temizle"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="button"
            className={`filter-toggle ${(showFilters || filterIlce || filterDurum) ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Filtreler"
            title="Filtreler"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>
        </form>

        {/* Filter chips expandable */}
        {showFilters && (
          <div className="filter-section">
            <div className="filter-group">
              <span className="filter-group-title">İlçe:</span>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${!filterIlce ? 'active' : ''}`}
                  onClick={() => handleFilterDistrictChange('')}
                >
                  Tümü
                </button>
                {['GEBZE', 'DARICA', 'ÇAYIROVA', 'DİLOVASI'].map(ilce => (
                  <button
                    key={ilce}
                    className={`filter-chip ${filterIlce === ilce ? 'active' : ''}`}
                    onClick={() => handleFilterDistrictChange(ilce)}
                  >
                    {ilce}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group" style={{ marginTop: '8px' }}>
              <span className="filter-group-title">Durum:</span>
              <div className="filter-chips">
                <button
                  className={`filter-chip ${!filterDurum ? 'active' : ''}`}
                  onClick={() => handleFilterDurumChange('')}
                >
                  Tümü
                </button>
                {['Ziyarete Gidildi', 'Belge Alındı', 'Karşı Tarafta'].map(d => (
                  <button
                    key={d}
                    className={`filter-chip ${filterDurum === d ? 'active' : ''}`}
                    onClick={() => handleFilterDurumChange(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="dashboard-content">
        {!dataLoaded && (
          <div className="search-loading">
            <span className="spinner" />
            <span>Veri yükleniyor...</span>
          </div>
        )}

        {isSearching && (
          <div className="search-loading">
            <span className="spinner" />
            <span>Aranıyor...</span>
          </div>
        )}

        {dataLoaded && !isSearching && !hasSearched && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <p className="empty-title">Üye Arama</p>
            <p className="empty-description">
              Excel dosyasındaki {stats.total > 0 ? stats.total.toLocaleString('tr-TR') + '+' : ''} üye arasında unvan, sicil no, yetkili veya adres aramak için yukarıdaki kutuyu kullanın.
            </p>
            <div className="quick-search-tags">
              <button onClick={() => { setQuery('Gıda'); performSearch('Gıda', 1); }} className="tag-btn">Gıda</button>
              <button onClick={() => { setQuery('İnşaat'); performSearch('İnşaat', 1); }} className="tag-btn">İnşaat</button>
              <button onClick={() => { setQuery('Lojistik'); performSearch('Lojistik', 1); }} className="tag-btn">Lojistik</button>
              <button onClick={() => { setQuery('Tekstil'); performSearch('Tekstil', 1); }} className="tag-btn">Tekstil</button>
            </div>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon warning">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="empty-title">Kayıt Bulunamadı</p>
            <p className="empty-description">
              "{query}" aramanızla veya seçili filtrelerle eşleşen kayıt bulunamadı.
            </p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <>
            <div className="results-info">
              <span><strong>{totalResults.toLocaleString('tr-TR')}</strong> kayıt bulundu</span>
              {(filterIlce || filterDurum) && (
                <span className="active-filter-label">
                  Filtre: {[filterIlce, filterDurum].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            <div className="results-list">
              {results.map((item, index) => (
                <MemberCard
                  key={`${item.__originalRowIndex}-${index}`}
                  member={item}
                  onUpdateMember={handleUpdateMember}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))}
            </div>

            {hasMore && (
              <div className="load-more-wrapper">
                <button
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <span className="button-loading">
                      <span className="spinner" />
                      Yükleniyor...
                    </span>
                  ) : (
                    'Daha Fazla Sonuç Göster'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
