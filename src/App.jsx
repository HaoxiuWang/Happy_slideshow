import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import source from './content/happy.md?raw'
import coverImage from './content/founders.png'
import mobileCoverImage from './content/founders-mobile.png'
import logoSheet from './content/happies.png'
import happyCometValleyImage from './content/happy_cometvalley.png'

const palettes = [
  ['#FF6B4A', '#FF9F68'], ['#FF8A00', '#FFD166'], ['#E85D04', '#FF9A1F'],
  ['#FFB000', '#FFE08A'], ['#F97316', '#FDBA74'], ['#FF7A45', '#FFC078'],
  ['#E96B2C', '#FFB347'], ['#FF9500', '#FFD166'], ['#F45D48', '#FFA76C'],
]

function parseMarkdown(markdown) {
  const matches = [...markdown.matchAll(/^#\s+(.+?)\s*$/gm)]
  return matches.map((match, index) => {
    const bodyEnd = matches[index + 1]?.index ?? markdown.search(/^\[image\d+\]:/m)
    const body = markdown.slice(match.index + match[0].length, bodyEnd < 0 ? markdown.length : bodyEnd).trim()
    const title = match[1].replace(/^\*{2,3}|\*{2,3}$/g, '')
    return { title, body, number: String(index + 1).padStart(2, '0') }
  })
}

function renderInlineMarkdown(text) {
  const parts = []
  const pattern = /(\*{2,3})(.+?)\1/g
  let cursor = 0
  let match
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > cursor) parts.push(text.slice(cursor, match.index))
    parts.push(<strong key={`${match.index}-${match[2]}`}>{match[2]}</strong>)
    cursor = match.index + match[0].length
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts
}

function Arrow({ left = false }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={left ? 'm15 18-6-6 6-6M9 12h10' : 'M5 12h10m-4-6 6 6-6 6'} /></svg>
}

function RabbitLogo() {
  return <img src={logoSheet} alt="" />
}

function isPhone() {
  if (navigator.userAgentData?.mobile === true) return true
  if (/Android|iPhone|iPod|IEMobile|Windows Phone|webOS|BlackBerry|Opera Mini/i.test(navigator.userAgent)) return true
  return window.matchMedia('(max-width: 767px) and (pointer: coarse)').matches
}

export default function App() {
  const chapters = useMemo(() => parseMarkdown(source), [])
  const slides = useMemo(() => [
    { title: 'Happy', number: '00', isCover: true },
    ...chapters,
    { title: 'The End', number: String(chapters.length + 1).padStart(2, '0'), isEnd: true, note: 'This slideshow was invented by Peter Wang for showing ideas like this.' },
  ], [chapters])
  const [index, setIndex] = useState(0)
  const [detail, setDetail] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [introOpen, setIntroOpen] = useState(true)
  const [phoneNoticeOpen] = useState(isPhone)
  const [motion, setMotion] = useState('')
  const [dragX, setDragX] = useState(null)
  const [dragY, setDragY] = useState(null)
  const [viewportHeight, setViewportHeight] = useState(() => window.visualViewport?.height ?? window.innerHeight)
  const touch = useRef(null)
  const wheelLocked = useRef(false)
  const detailRef = useRef(null)
  const menuRef = useRef(null)
  const current = slides[index]

  useEffect(() => {
    const syncViewport = () => setViewportHeight(window.visualViewport?.height ?? window.innerHeight)
    window.addEventListener('resize', syncViewport)
    window.visualViewport?.addEventListener('resize', syncViewport)
    return () => {
      window.removeEventListener('resize', syncViewport)
      window.visualViewport?.removeEventListener('resize', syncViewport)
    }
  }, [])

  useEffect(() => {
    if (detail && detailRef.current) detailRef.current.scrollTop = 0
  }, [detail, index])

  const move = useCallback((direction) => {
    setDetail(false)
    setMotion(direction > 0 ? 'up' : 'down')
    setIndex((value) => Math.min(slides.length - 1, Math.max(0, value + direction)))
    window.setTimeout(() => setMotion(''), 520)
  }, [slides.length])

  useEffect(() => {
    const onKey = (event) => {
      if (introOpen) return
      if (menuOpen) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key)) {
          event.preventDefault()
          const direction = event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1
          const amount = event.key.startsWith('Page') ? (menuRef.current?.clientHeight ?? 600) * 0.82 : 72
          menuRef.current?.scrollBy({ top: direction * amount, behavior: 'smooth' })
        }
        return
      }
      if (detail) {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(event.key)) {
          event.preventDefault()
          const direction = event.key === 'ArrowUp' || event.key === 'PageUp' ? -1 : 1
          const amount = event.key.startsWith('Page') ? (detailRef.current?.clientHeight ?? 600) * 0.82 : 72
          detailRef.current?.scrollBy({ top: direction * amount, behavior: 'smooth' })
        }
        if (event.key === 'ArrowLeft' || event.key === 'Escape') setDetail(false)
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'PageDown') move(1)
      if (event.key === 'ArrowUp' || event.key === 'PageUp') move(-1)
      if ((event.key === 'ArrowRight' || event.key === 'Enter') && !current.isCover && !current.isEnd) setDetail(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current.isCover, current.isEnd, detail, introOpen, menuOpen, move])

  const onWheel = (event) => {
    if (menuOpen || introOpen) return
    if (detail || wheelLocked.current || Math.abs(event.deltaY) < 18) return
    wheelLocked.current = true
    move(event.deltaY > 0 ? 1 : -1)
    window.setTimeout(() => { wheelLocked.current = false }, 650)
  }

  const onTouchStart = (event) => {
    if (menuOpen || introOpen) return
    const point = event.touches[0]
    touch.current = { x: point.clientX, y: point.clientY, axis: null }
  }
  const onTouchMove = (event) => {
    if (!touch.current) return
    const point = event.touches[0]
    const dx = point.clientX - touch.current.x
    const dy = point.clientY - touch.current.y

    if (!touch.current.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
      touch.current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
    if (touch.current.axis === 'x') {
      if (current.isCover || current.isEnd) return
      event.preventDefault()
      const width = window.innerWidth
      setDragX(detail
        ? Math.min(width, Math.max(0, dx))
        : Math.max(-width, Math.min(0, dx)))
    } else if (touch.current.axis === 'y' && !detail) {
      event.preventDefault()
      const height = viewportHeight
      const lower = index === slides.length - 1 ? 0 : -height
      const upper = index === 0 ? 0 : height
      setDragY(Math.min(upper, Math.max(lower, dy)))
    }
  }
  const onTouchEnd = (event) => {
    if (!touch.current) return
    const point = event.changedTouches[0]
    const dx = point.clientX - touch.current.x
    const dy = point.clientY - touch.current.y
    const axis = touch.current.axis
    touch.current = null
    setDragX(null)
    setDragY(null)
    if (axis === 'x' && Math.abs(dx) > 55) setDetail(dx < 0 && !current.isCover && !current.isEnd)
    else if (axis === 'y' && !detail && Math.abs(dy) > 55) move(dy < 0 ? 1 : -1)
  }
  const onTouchCancel = () => { touch.current = null; setDragX(null); setDragY(null) }

  const jumpTo = (next) => { setIndex(next); setDetail(false); setMenuOpen(false) }
  const playFullscreen = async () => {
    const page = document.documentElement
    const requestFullscreen = page.requestFullscreen || page.webkitRequestFullscreen
    try {
      if (requestFullscreen && !document.fullscreenElement) await requestFullscreen.call(page)
    } catch {
      // Fullscreen may be unavailable in embedded or restricted browsers.
    } finally {
      setIntroOpen(false)
    }
  }
  return (
    <main className="app" style={{ '--viewport-height': `${viewportHeight}px` }} onWheel={onWheel} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel}>
      <div
        className={`stage ${detail ? 'is-detail' : ''} ${dragX !== null ? 'is-dragging' : ''}`}
        style={dragX !== null ? { transform: `translate3d(${(detail ? -window.innerWidth : 0) + dragX}px, 0, 0)` } : undefined}
      >
        <section className={`cover ${current.isCover ? 'image-active' : ''}`} aria-label={`${current.title} overview`}>
          {!current.isCover && <div className="story-topbar">
            <button className="brand" onClick={() => jumpTo(0)} aria-label="Comet Valley and Happy home">
              <span className="brand-lockup"><b>Comet Valley</b></span>
              <span className="brand-divider" aria-hidden="true" />
              <span className="brand-lockup"><b>Happy</b></span>
            </button>
            <button className="menu-button" onClick={() => setMenuOpen(true)}><span>Explore</span><i /><i /></button>
          </div>}
          <div
            className={`vertical-track ${dragY !== null ? 'is-dragging' : ''}`}
            style={{ transform: `translate3d(0, ${-index * viewportHeight + (dragY ?? 0)}px, 0)` }}
          >
            {slides.map((chapter, chapterIndex) => {
              const chapterAccent = palettes[chapterIndex % palettes.length]
              const dragProgress = dragY === null ? 0 : Math.min(1, Math.abs(dragY) / viewportHeight)
              const incomingIndex = dragY === null ? -1 : index + (dragY < 0 ? 1 : -1)
              const brightness = dragY === null
                ? 1
                : chapterIndex === index
                  ? 1 - dragProgress * 0.45
                  : chapterIndex === incomingIndex
                    ? 0.7 + dragProgress * 0.3
                    : 0.7
              return (
                <article
                  key={chapter.title}
                  className={`cover-slide layout-${chapterIndex % 6} ${chapter.isCover ? 'is-cover' : ''} ${chapterIndex === index && motion ? `motion-${motion}` : ''}`}
                  style={{ '--accent': chapterAccent[0], '--accent-two': chapterAccent[1], filter: `brightness(${brightness})` }}
                >
                  {chapter.isCover ? <>
                    <div className="image-cover">
                      <picture>
                        <source media="(max-width: 640px)" srcSet={mobileCoverImage} />
                        <img
                          src={coverImage}
                          alt="The five Comet Valley and Happy founders beneath the Comet Valley and Happy logos"
                          fetchPriority="high"
                        />
                      </picture>
                    </div>
                  </> : <>
                    <div className="orb orb-one" /><div className="orb orb-two" />
                    <p className="eyebrow">Happy / Our story <b>{chapter.number}</b></p>
                    <div className="title-wrap">
                      <p className="chapter-label">{chapter.number}</p>
                      <h1>{chapter.title}</h1>
                      {chapter.isEnd && <p className="end-note">{chapter.note}</p>}
                      {!chapter.isEnd && <button className="open-detail" onClick={() => { setIndex(chapterIndex); setDetail(true) }}>
                        <span>read the content</span><i><Arrow /></i>
                      </button>}
                    </div>
                    <p className="side-note">Language learning,<br />made human.</p>
                  </>}
                  <div className="scroll-cue"><span>Scroll to explore</span><i>↓</i></div>
                </article>
              )
            })}
          </div>
          <div className="progress" aria-label={`Slide ${index + 1} of ${slides.length}`}>
            <span style={{ height: `${Math.min(100, Math.max(0, ((index + 1 - (dragY ?? 0) / viewportHeight) / slides.length) * 100))}%` }} />
          </div>
        </section>

        <section ref={detailRef} className="detail" aria-hidden={!detail}>
          {detail && !current.isCover && !current.isEnd && <button className="back" onClick={() => setDetail(false)}><Arrow left /><span>Back to story</span></button>}
          <div className="detail-inner">
            <p className="chapter-label">{current.number}</p>
            <h2>{current.title}</h2>
            <div className="rule" />
            <div className="copy">
              {(current.body ?? '').split(/\n\s*\n/).filter(Boolean).map((paragraph, i) => {
                const lines = paragraph.split('\n')
                const imageMatch = paragraph.match(/^\s*!\[(.*?)\]\((.+?)\)\s*$/)
                if (imageMatch) {
                  const isFoundersVision = imageMatch[2].endsWith('founders.png')
                  const imageSrc = isFoundersVision
                    ? coverImage
                    : happyCometValleyImage
                  return <figure className={`chapter-image ${isFoundersVision ? 'chapter-image-wide' : ''}`} key={i}>
                    <img src={imageSrc} alt={imageMatch[1]} />
                    {isFoundersVision && <figcaption>The Comet Valley and Happy founders</figcaption>}
                  </figure>
                }
                if (lines.every((line) => /^\s*-\s+/.test(line))) return <ul key={i}>{lines.map((line) => <li key={line}>{renderInlineMarkdown(line.replace(/^\s*-\s+/, ''))}</li>)}</ul>
                if (/^\d+\./.test(paragraph)) return <ol key={i}>{lines.map((line) => <li key={line}>{renderInlineMarkdown(line.replace(/^\d+\.\s*/, ''))}</li>)}</ol>
                if (/^\s*##\s+/.test(paragraph)) return <h4 className="body-subheading" key={i}>{renderInlineMarkdown(paragraph.replace(/^\s*##\s+/, ''))}</h4>
                if (/^\s*#\s+/.test(paragraph)) return <h3 className="body-heading" key={i}>{renderInlineMarkdown(paragraph.replace(/^\s*#\s+/, ''))}</h3>
                return <p key={i}>{renderInlineMarkdown(paragraph)}</p>
              })}
            </div>
            <div className="detail-footer"><span>{current.number} / {String(chapters.length).padStart(2, '0')}</span><button onClick={() => { setDetail(false); move(1) }} disabled={index === slides.length - 1}>Next chapter <Arrow /></button></div>
          </div>
        </section>
      </div>

      <Dialog open={phoneNoticeOpen} onClose={() => {}} className="phone-dialog">
        <DialogBackdrop className="phone-backdrop" />
        <DialogPanel className="phone-panel">
          <div className="phone-symbol" aria-hidden="true">↗</div>
          <p className="phone-kicker">Before you begin</p>
          <DialogTitle>This presentation is not available on phones.</DialogTitle>
          <p className="phone-copy">Please visit Happy on a desktop, laptop, or iPad to view the presentation.</p>
        </DialogPanel>
      </Dialog>

      <Dialog open={introOpen && !phoneNoticeOpen} onClose={() => {}} className="intro-dialog">
        <DialogBackdrop className="intro-backdrop" />
        <DialogPanel className="intro-panel">
          <div className="intro-mark"><RabbitLogo /></div>
          <p className="intro-kicker">An immersive story</p>
          <DialogTitle>Meet Happy.</DialogTitle>
          <p className="intro-copy">For the best experience, enter full screen and explore one chapter at a time.</p>
          <button className="play-button" onClick={playFullscreen}>
            <span className="play-icon">▶</span>
            <span>Play the slideshow</span>
          </button>
          <p className="intro-hint">Swipe or scroll to navigate</p>
        </DialogPanel>
      </Dialog>

      <Dialog open={menuOpen} onClose={setMenuOpen} className="dialog">
        <DialogBackdrop className="backdrop" />
        <DialogPanel ref={menuRef} className="panel">
          <div className="panel-head"><p>All chapters</p><button onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button></div>
          <nav><button className={index === 0 ? 'active' : ''} onClick={() => jumpTo(0)}><span>00</span>Cover</button>{chapters.map((chapter, i) => <button key={chapter.title} className={i + 1 === index ? 'active' : ''} onClick={() => jumpTo(i + 1)}><span>{chapter.number}</span>{chapter.title}</button>)}<button className={current.isEnd ? 'active' : ''} onClick={() => jumpTo(slides.length - 1)}><span>{String(chapters.length + 1).padStart(2, '0')}</span>The End</button></nav>
          <p className="panel-foot">Enjoy stories. Learn naturally.</p>
        </DialogPanel>
      </Dialog>
    </main>
  )
}
