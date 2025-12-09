import { useState, useEffect } from 'react'
import { ModeToggle } from './components/mode-toggle'

type AppMode = 'normal' | 'secret'

interface Participant {
  id: string
  name: string
  email: string
}

const FOLLOWERS_DATA: Participant[] = [
  { id: '1', name: "Simeon", email: "tsvetanov.simeon@gmail.com" },
  { id: '2', name: "Iliyana", email: "iliana.sakaliyska@gmail.com" },
  { id: '3', name: "Lubomir", email: "lyuborhristov@gmail.com" },
  { id: '4', name: "Apapa", email: "iliya.stanchev@gmail.com" },
  { id: '5', name: "Antonio", email: "rubinevantonio@gmail.com" },
  { id: '6', name: "Asen", email: "asenrakov@gmail.com" },
  { id: '7', name: "Tancheto", email: "taniaboshnakova@abv.bg" },
  { id: '8', name: "Mitaka G", email: "gramadarev.dimitar@gmail.com" },
  { id: '9', name: "George", email: "georgipiskov@gmail.com" },
  { id: '10', name: "Viki", email: "viki.mileva@gmail.com" },
  { id: '11', name: "Djoni", email: "iliq.bakalov890@gmail.com" },
  { id: '12', name: "Raiko", email: "raikoraikoraiko@abv.bg" },
  { id: '13', name: "Dinkata", email: "kostadin_raichev11@abv.bg" },
  { id: '14', name: "Ralica", email: "rstefanova18@gmail.com" },
  { id: '15', name: "Slavi", email: "slavi_684@abv.bg" },
  { id: '16', name: "Eli", email: "emiteva7@gmail.com" },
  { id: '17', name: "Venci", email: "ventsislav.uruchev@gmail.com" },
]

const STORAGE_KEYS = {
  participants: 'secret-santa-participants',
  mode: 'secret-santa-mode',
  budget: 'secret-santa-budget',
}


const isValidEmail = (email: string): boolean => {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const generateId = () => Math.random().toString(36).substr(2, 9)

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Gift icon component
const GiftIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="8" width="18" height="13" rx="1" />
    <path d="M12 8v13" />
    <path d="M3 12h18" />
    <path d="M19 8c0-2.5-2-4-4-4-1.5 0-2.5 1-3 2-.5-1-1.5-2-3-2-2 0-4 1.5-4 4" />
  </svg>
)

function App() {
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.mode)
    return (saved as AppMode) || 'secret'
  })
  const [participants, setParticipants] = useState<Participant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.participants)
    return saved ? JSON.parse(saved) : []
  })
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [budget, setBudget] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.budget) || ''
  })
  const [results, setResults] = useState<Map<string, Participant> | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'single' | 'all', id?: string, name?: string } | null>(null)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailsSent, setEmailsSent] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [emailResult, setEmailResult] = useState<{ sent: number, failed: number, total: number } | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // N8N Webhook URL
  const N8N_WEBHOOK_URL = 'https://n8n.simeontsvetanovn8nworkflows.site/webhook/secret-santa-webhook-automation'

  const allEmailsValid = appMode === 'normal' || participants.every(p => p.name.trim() && isValidEmail(p.email))
  const hasInvalidParticipants = appMode === 'secret' && participants.some(p => !p.name.trim() || !isValidEmail(p.email))

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.participants, JSON.stringify(participants))
  }, [participants])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mode, appMode)
  }, [appMode])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.budget, budget)
  }, [budget])

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Sync status bar color with theme
  useEffect(() => {
    const updateThemeColor = () => {
      const isDark = document.documentElement.classList.contains('dark')
      // Find existing meta or create new
      let meta = document.querySelector('meta[name="theme-color"]')
      
      // If we have multiple with media queries (from index.html), we might want to consolidate 
      // or just ensure we have one that takes precedence.
      // Simple strategy: Update the first one found or creating one without media query to override.
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'theme-color')
        document.head.appendChild(meta)
      }
      
      meta.setAttribute('content', isDark ? '#0a0a0f' : '#ffffff')
      // Clearing media ensures this applies always based on APP state
      meta.removeAttribute('media')
      
      // Cleanup other potential conflicting tags if any existed initially
      const allMetas = document.querySelectorAll('meta[name="theme-color"]')
      allMetas.forEach(m => {
        if (m !== meta) m.remove()
      })
    }

    // Run initially and observe changes
    updateThemeColor()
    const observer = new MutationObserver(updateThemeColor)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  const handleShare = async () => {
    const shareData = {
      title: 'Secret Santa 🎁',
      text: 'Organize your Secret Santa gift exchange easily! No servers, no sign-ups.',
      url: 'https://simeontsvetanov.github.io/secret_santa/'
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.error('Share failed:', err)
      }
    } else {
      navigator.clipboard.writeText(shareData.url)
      alert('Link copied to clipboard! 📋')
    }
  }

  const addParticipant = () => {
    const trimmedName = newName.trim()
    const trimmedEmail = newEmail.trim()
    
    if (trimmedName.toLowerCase() === "the followers") {
      setParticipants(FOLLOWERS_DATA)
      setNewName('')
      setNewEmail('')
      setResults(null)
      return
    }

    if (!trimmedName) return
    if (participants.some(p => p.name === trimmedName)) return
    
    if (appMode === 'secret') {
      if (!trimmedEmail) {
        setEmailError('Email is required')
        return
      }
      if (!isValidEmail(trimmedEmail)) {
        setEmailError('Invalid email')
        return
      }
    }

    setEmailError('')
    setParticipants([...participants, { id: generateId(), name: trimmedName, email: trimmedEmail }])
    setNewName('')
    setNewEmail('')
    setResults(null)
  }

  const openEditModal = (p: Participant) => {
    setEditingParticipant(p)
    setEditName(p.name)
    setEditEmail(p.email)
  }

  const saveEdit = () => {
    if (!editingParticipant || !editName.trim()) return
    if (appMode === 'secret' && !isValidEmail(editEmail)) return
    
    setParticipants(participants.map(p => 
      p.id === editingParticipant.id ? { ...p, name: editName.trim(), email: editEmail.trim() } : p
    ))
    setResults(null)
    setEditingParticipant(null)
  }

  const executeDelete = () => {
    if (!showDeleteModal) return
    if (showDeleteModal.type === 'single' && showDeleteModal.id) {
      setParticipants(participants.filter(p => p.id !== showDeleteModal.id))
    } else {
      setParticipants([])
      setBudget('')
    }
    setResults(null)
    setShowDeleteModal(null)
  }

  const drawNames = () => {
    if (participants.length < 2 || !allEmailsValid) return
    
    const shuffled = [...participants]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    const assignments = new Map<string, Participant>()
    for (let i = 0; i < shuffled.length; i++) {
      assignments.set(shuffled[i].name, shuffled[(i + 1) % shuffled.length])
    }
    setResults(assignments)
  }

  const shareResults = async () => {
    if (!results) return
    const text = [
      '🎁 Secret Santa Results',
      '',
      ...Array.from(results.entries()).map(([g, r]) => `${g} → ${r.name}`),
      '',
      'Made with Secret Santa'
    ].join('\n')
    
    if (navigator.share) {
      try { await navigator.share({ title: 'Secret Santa', text }) } 
      catch { navigator.clipboard.writeText(text) }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  const sendEmails = async () => {
    if (participants.length < 2 || !allEmailsValid) return
    
    // Draw names first (shuffle and assign)
    const shuffled = [...participants]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    
    const assignments = new Map<string, Participant>()
    for (let i = 0; i < shuffled.length; i++) {
      assignments.set(shuffled[i].name, shuffled[(i + 1) % shuffled.length])
    }
    
    setSendingEmails(true)
    setEmailsSent(false)
    
    // Build the list of email objects for n8n
    const emailList = Array.from(assignments.entries()).map(([giverName, receiver]) => {
      const giver = participants.find(p => p.name === giverName)
      
      return {
        name: giver?.name || giverName,
        email: giver?.email || '',
        subject: '🎁 Your Secret Santa Assignment',
        body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 40px 20px; margin: 0; }
    .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .gift { font-size: 56px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0; font-weight: 600; }
    .card { background: #f8f8f8; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; border: 1px solid #eee; }
    .label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .name { font-size: 28px; font-weight: 700; color: #1a1a1a; }
    .budget { background: #e8f5e9; border: 1px solid #4caf50; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #2e7d32; margin: 16px 0; text-align: center; }
    .secret { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #856404; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <svg width="56" height="56" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="512" height="512" rx="96" fill="#0a0a0a"/>
        <g stroke="#fafafa" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
          <rect x="96" y="192" width="320" height="240" rx="16"/>
          <path d="M256 192v240"/>
          <path d="M96 272h320"/>
          <path d="M384 192c0-48-40-80-80-80-32 0-48 24-48 48 0-24-16-48-48-48-40 0-80 32-80 80"/>
        </g>
      </svg>
      <h1>Secret Santa</h1>
    </div>
    <p>Hello ${giver?.name || giverName}!</p>
    <p>The draw is complete. Here's your assignment:</p>
    <div class="card">
      <div class="label">You will be gifting</div>
      <div class="name">${receiver.name}</div>
    </div>
    ${budget ? `<div class="budget">💰 Budget: <strong>${budget}€</strong></div>` : ''}
    <div class="secret">🤫 <strong>Remember:</strong> Keep it a secret!</div>
    <div class="footer">
      Sent via <a href="https://simeontsvetanov.github.io/secret_santa/" style="color: #999; text-decoration: underline;">Secret Santa App</a>
    </div>
  </div>
</body>
</html>`
      }
    }).filter(item => item.email) // Only include those with valid emails
    
    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors', // n8n doesn't support CORS, but emails are sent
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(emailList),
      })
      
      // no-cors means we can't read response, but if no error, n8n processed it
      setSendingEmails(false)
      setEmailsSent(true)
      setEmailResult({ sent: emailList.length, failed: 0, total: emailList.length })
    } catch (error) {
      console.error('Send error:', error)
      setSendingEmails(false)
      setEmailResult({ sent: 0, failed: emailList.length, total: emailList.length })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">


      {/* Header */}
      <header className={`sticky top-0 z-40 bg-background/80 backdrop-blur-xl transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GiftIcon className="w-6 h-6" />
            <span className="text-lg font-semibold tracking-tight">Secret Santa</span>
          </div>
          <div className="flex items-center gap-1">
            {deferredPrompt && (
              <button
                onClick={handleInstall}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Install App"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </button>
            )}
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Share App"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </button>
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="How it works"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
            </button>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-8 space-y-8">
        
        {/* Mode Selector */}
        <div className="flex gap-2 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setAppMode('secret')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              appMode === 'secret' 
                ? 'bg-foreground text-background shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Secret
          </button>
          <button
            onClick={() => setAppMode('normal')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              appMode === 'normal' 
                ? 'bg-foreground text-background shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Normal
          </button>
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Budget</h2>
          <div className="relative">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-3 pr-12 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {budget && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
            )}
          </div>
        </div>

        {/* Add Participant */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Add Participant</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
              placeholder="Name"
              className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            {appMode === 'secret' && (
              <div>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                  placeholder="Email"
                  className={`w-full px-4 py-3 bg-secondary rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                    emailError ? 'ring-2 ring-red-500/50' : 'focus:ring-foreground/20'
                  }`}
                />
                {emailError && <p className="text-red-500 text-xs mt-1.5">{emailError}</p>}
              </div>
            )}
            <button
              onClick={addParticipant}
              disabled={!newName.trim()}
              className="w-full py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Participants · {participants.length}
              </h2>
              <button
                onClick={() => setShowDeleteModal({ type: 'all' })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2">
              {participants.map((p) => {
                const hasError = appMode === 'secret' && (!p.name.trim() || !isValidEmail(p.email))
                return (
                  <div
                    key={p.id}
                    onClick={() => openEditModal(p)}
                    className={`group flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all ${
                      hasError 
                        ? 'bg-red-500/5 border border-red-500/20 hover:bg-red-500/10' 
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name || 'No name'}</p>
                      {(appMode === 'secret' || p.email) && (
                        <p className={`text-sm truncate ${p.email ? 'text-muted-foreground' : 'text-red-400'}`}>
                          {p.email || 'No email'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteModal({ type: 'single', id: p.id, name: p.name }) }}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
            {hasInvalidParticipants && (
              <p className="text-xs text-amber-500">Some participants need valid emails</p>
            )}
          </div>
        )}

        {/* Action Button */}
        {participants.length >= 2 && !results && (
          <button
            onClick={appMode === 'secret' ? () => setShowConfirmModal(true) : drawNames}
            disabled={!allEmailsValid || sendingEmails}
            className={`w-full py-4 rounded-lg font-semibold text-lg transition-all ${
              allEmailsValid && !sendingEmails
                ? 'bg-foreground text-background hover:opacity-90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            {sendingEmails 
              ? 'Sending...' 
              : !allEmailsValid 
                ? 'Fix emails first' 
                : appMode === 'secret' 
                  ? 'Send Emails' 
                  : 'Draw Names'}
          </button>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">
              Results
            </h2>
            {appMode === 'normal' ? (
              <>
                <div className="space-y-2">
                  {Array.from(results.entries()).map(([giver, receiver]) => (
                    <div key={giver} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <span className="font-medium">{giver}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{receiver.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={shareResults} className="flex-1 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90">
                    Share
                  </button>
                  <button onClick={() => setResults(null)} className="flex-1 py-3 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80">
                    Redraw
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center">
                  <GiftIcon className="w-8 h-8" />
                </div>
                <p className="text-muted-foreground">
                  {emailsSent 
                    ? '✅ Emails sent!' 
                    : `${participants.length} assignments ready`}
                </p>
                <button
                  onClick={sendEmails}
                  disabled={sendingEmails || emailsSent}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    emailsSent 
                      ? 'bg-green-500 text-white cursor-default'
                      : sendingEmails
                        ? 'bg-muted text-muted-foreground cursor-wait'
                        : 'bg-foreground text-background hover:opacity-90'
                  }`}
                >
                  {sendingEmails ? 'Sending...' : emailsSent ? 'Sent ✓' : 'Send Emails'}
                </button>
                <button 
                  onClick={() => { setResults(null); setEmailsSent(false) }} 
                  className="w-full py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80"
                >
                  {emailsSent ? 'Done' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {participants.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <GiftIcon className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Add at least 2 participants<br />to start the draw
            </p>
          </div>
        )}
      </main>

      {/* Edit Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEditingParticipant(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
                autoFocus
              />
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Email"
                className={`w-full px-4 py-3 bg-secondary rounded-lg focus:outline-none focus:ring-2 ${
                  appMode === 'secret' && editEmail && !isValidEmail(editEmail)
                    ? 'ring-2 ring-red-500/30'
                    : 'focus:ring-foreground/20'
                }`}
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingParticipant(null)} className="flex-1 py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80">
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!editName.trim() || (appMode === 'secret' && !isValidEmail(editEmail))}
                className="flex-1 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-30"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">
              {showDeleteModal.type === 'all' ? 'Clear all?' : 'Remove?'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {showDeleteModal.type === 'all' 
                ? 'This will remove all participants.' 
                : `Remove "${showDeleteModal.name}"?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80">
                Cancel
              </button>
              <button onClick={executeDelete} className="flex-1 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowInfoModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <GiftIcon className="w-8 h-8" />
              <h3 className="text-xl font-semibold">Secret Santa</h3>
            </div>
            
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">What is this?</strong><br />
                A simple app to organize Secret Santa gift exchanges. Everyone gives exactly one gift and receives exactly one gift.
              </p>
              
              <p>
                <strong className="text-foreground">How does it work?</strong><br />
                1. Add all participants with their emails<br />
                2. Set an optional budget<br />
                3. Draw names randomly<br />
                4. Send private email notifications
              </p>
              
              <p>
                <strong className="text-foreground">Two Modes:</strong><br />
                • <strong>Secret</strong> - Results sent privately via email<br />
                • <strong>Normal</strong> - Results shown on screen to share
              </p>
              
              <p>
                <strong className="text-foreground">Privacy</strong><br />
                All data stays on your device. Nothing is stored on servers.
              </p>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <a 
                href="https://buymeacoffee.com/simeontsvetanov" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ☕ Support this project
              </a>
            </div>
            
            <button 
              onClick={() => setShowInfoModal(false)} 
              className="w-full mt-4 py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Sending Emails Loading Modal */}
      {sendingEmails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-8 max-w-xs w-full shadow-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-muted border-t-foreground rounded-full animate-spin" />
            <p className="text-lg font-medium">Sending emails...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* Confirm Send Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-semibold">Verify Recipients</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {participants.length} emails will be sent
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[40vh]">
              {participants.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                  <span className="w-6 h-6 flex items-center justify-center bg-foreground/10 rounded-full text-xs font-medium">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {budget && (
              <div className="text-center text-sm text-muted-foreground mb-4 p-2 bg-secondary/50 rounded-lg">
                💰 Budget: <strong>{budget}€</strong>
              </div>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="flex-1 py-3 bg-secondary rounded-lg font-medium hover:bg-secondary/80"
              >
                Edit
              </button>
              <button 
                onClick={() => { setShowConfirmModal(false); sendEmails(); }} 
                className="flex-1 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Result Modal */}
      {emailResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setEmailResult(null)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${emailResult.failed === 0 ? 'bg-green-500/10' : 'bg-amber-500/10'}`}>
                {emailResult.failed === 0 ? (
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {emailResult.failed === 0 ? 'All emails sent!' : 'Some issues'}
              </h3>
              <p className="text-muted-foreground">
                {emailResult.sent} of {emailResult.total} emails delivered
              </p>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <span className="text-sm">Sent successfully</span>
                <span className="font-semibold text-green-500">{emailResult.sent}</span>
              </div>
              {emailResult.failed > 0 && (
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="text-sm">Failed</span>
                  <span className="font-semibold text-red-500">{emailResult.failed}</span>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setEmailResult(null)} 
              className="w-full py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-6 text-center">
        <a 
          href="https://buymeacoffee.com/simeontsvetanov" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          If you like this app, consider supporting ☕
        </a>
      </footer>
    </div>
  )
}

export default App
