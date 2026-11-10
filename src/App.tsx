import { useEffect, useState, type FormEvent } from 'react'
import { useWorkspace } from './useWorkspace'
import type { ImplementationStatus } from './workspace'
import CalendarPanel from './components/calendarMotion/CalendarPanel'
import CalendarButton from './components/calendarMotion/CalendarButton'
import AddSourceButton from './components/sources/AddSourceButton'
import SourceSections from './components/sources/SourceSections'
import useSourceSections from './components/sources/useSourceSections'
import MoonBanner from './components/header/MoonBanner'
import { MoonCredit } from './components/misc/MoonMark/MoonMark'
import EarthMark, { EarthCredit } from './components/misc/EarthMark/EarthMark'
import SparkArt from './components/hero/SparkArt'
import PaneBackground from './components/panes/PaneBackground'
import FooterTextScene from './components/typography/FooterTextScene'
import ResearchDraftPanel from './components/glass-panel-3d/ResearchDraftPanel'
import { GlassTorusCard, GlassPanelCard } from './components/glass-objects/GlassObjectCards'
import './App.css'

const MAIN_GLASS_PROPS = {
  initialSpin: true,
  initialRotationAxis: 'y' as const,
  initialRotationSpeed: 0.25,
  lightingIntensity: 1.25,
  initialMaterial: {
    transmission: 1,
    thickness: 0.41,
    ior: 1.7,
    chromaticAberration: 0.062,
    roughness: 0.08,
    color: '#cdd2d9',
  },
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  )
}

const statuses: { value: ImplementationStatus; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'building', label: 'Building' },
  { value: 'validated', label: 'Validated' },
]

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

export default function App() {
  useEffect(() => {
    const target = window.location.hash
    if (target !== '#glass-workspace' && target !== '#glass-objects') return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(target.slice(1))?.scrollIntoView({ block: 'start', behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const { workspace, storageWarning, addSource, addDecision, updateDecisionStatus, exportWorkspace } = useWorkspace()
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceNotes, setSourceNotes] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [sourceSuccess, setSourceSuccess] = useState('')
  const { sourceSections, introduceSourceSection } = useSourceSections()
  const [selectedSource, setSelectedSource] = useState('')
  const [finding, setFinding] = useState('')
  const [implementation, setImplementation] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const [decisionSuccess, setDecisionSuccess] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const effectiveSource = selectedSource || workspace.sources[0]?.id || ''
  const validated = workspace.decisions.filter((decision) => decision.status === 'validated').length

  function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSourceError('')
    setSourceSuccess('')
    try {
      addSource({ title: sourceTitle, url: sourceUrl, notes: sourceNotes })
      setSourceTitle('')
      setSourceUrl('')
      setSourceNotes('')
      setSourceSuccess('Source added to your research library.')
    } catch (error) {
      setSourceError(errorMessage(error))
    }
  }

  function submitDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDecisionError('')
    setDecisionSuccess('')
    try {
      addDecision({ sourceId: effectiveSource, finding, implementation })
      setFinding('')
      setImplementation('')
      setDecisionSuccess('Implementation decision added. Start building when you are ready.')
    } catch (error) {
      setDecisionError(errorMessage(error))
    }
  }

  function changeStatus(id: string, status: ImplementationStatus) {
    setWorkspaceError('')
    setWorkspaceMessage('')
    try {
      updateDecisionStatus(id, status)
      setWorkspaceMessage(`Implementation status updated to ${status}.`)
    } catch (error) {
      setWorkspaceError(errorMessage(error))
    }
  }

  function downloadWorkspace() {
    setWorkspaceError('')
    setWorkspaceMessage('')
    try {
      const url = URL.createObjectURL(new Blob([exportWorkspace()], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = 'first-light-workspace.json'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setWorkspaceMessage('Workspace exported as JSON. Keep it as a backup; restoring exports is not available yet.')
    } catch (error) {
      setWorkspaceError(errorMessage(error))
    }
  }

  return (
    <>
      <a className="skip-link" href="#workspace">Skip to workspace</a>
      <MoonBanner onExport={downloadWorkspace} />

      <main id="top" className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="tiny-line" />IDEAS, GROUNDED IN EVIDENCE</p>
            <h1 id="hero-title">Good research.<br /><span>Real applications.</span></h1>
            <p className="hero-description">A place to turn what you learn into what you build. Collect the evidence, connect the findings, and give your next web application a clear starting point.</p>
          </div>
          <SparkArt />
        </section>

        <section className="workflow-strip" aria-label="Research to application workflow">
          <span><b>01</b> Collect sources</span><Arrow /><span><b>02</b> Connect findings</span><Arrow /><span><b>03</b> Build an application</span><Arrow /><span><b>04</b> Verify the result</span>
        </section>

        <div className="workspace-heading" id="workspace">
          <div><p className="eyebrow">YOUR STARTING POINT</p><h2>The workspace</h2></div>
          <span className="privacy-note"><EarthMark size={14} />Stored in this browser</span>
        </div>

        {storageWarning && <div className="notice notice-warning" role="alert">{storageWarning}</div>}
        {workspaceError && <div className="notice notice-error" role="alert">{workspaceError}</div>}
        <div className="workspace-feedback" role="status" aria-live="polite">{workspaceMessage}</div>

        <PaneBackground as="section" className="stats-grid" aria-label="Workspace overview">
          <div className="stat"><span className="stat-label">Research sources</span><span className="stat-value">{String(workspace.sources.length).padStart(2, '0')}</span><span className="stat-detail">The evidence behind your ideas</span></div>
          <div className="stat"><span className="stat-label">Implementation decisions</span><span className="stat-value">{String(workspace.decisions.length).padStart(2, '0')}</span><span className="stat-detail">Findings with a plan of action</span></div>
          <div className="stat"><span className="stat-label">Marked validated</span><span className="stat-value">{String(validated).padStart(2, '0')}<span className="stat-spark">✳</span></span><span className="stat-detail">Status reported by you</span></div>
        </PaneBackground>

        <div className="workspace-grid">
          <CalendarPanel>
          <PaneBackground as="section" className="panel source-panel" aria-labelledby="sources-heading">
            <div className="panel-heading"><span className="step-number">01</span><div><h3 id="sources-heading">Research library</h3><p>Start with something worth building on.</p></div></div>
            <form onSubmit={submitSource} noValidate className="entry-form">
              <div className="field"><label htmlFor="source-title">Source title <span aria-hidden="true">*</span></label><PaneBackground as="input" id="source-title" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder="A paper, study, or research article" required /></div>
              <div className="field"><label htmlFor="source-url">Source URL <span aria-hidden="true">*</span></label><PaneBackground as="input" id="source-url" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required /><span className="field-hint">Link to the original research where possible.</span></div>
              <div className="field"><label htmlFor="source-notes">Source notes <span className="optional">optional</span></label><PaneBackground as="textarea" id="source-notes" rows={3} value={sourceNotes} onChange={(event) => setSourceNotes(event.target.value)} placeholder="Why is this source useful? Note its context or limitations." /></div>
              {sourceError && <p className="form-error" role="alert">{sourceError}</p>}
              <p className="form-success" role="status" aria-live="polite">{sourceSuccess}</p>
              <div className="entry-form" style={{ padding: 0, gap: 0, minWidth: 0 }}>
                <AddSourceButton onClick={introduceSourceSection} />
                <SourceSections sections={sourceSections} />
              </div>
            </form>
            <div className="library-section"><div className="list-heading"><h4>Your sources</h4><span>{workspace.sources.length}</span></div>
              {workspace.sources.length === 0 ? <div className="empty-state source-empty"><span className="empty-symbol" aria-hidden="true"><Arrow diagonal /></span><h4>A clean page. A clear beginning.</h4><p>Add your first source above. Your evidence will live here, ready to inform the next step.</p></div> : <ul className="source-list">{workspace.sources.map((source, index) => <li key={source.id}><span className="source-index">{String(index + 1).padStart(2, '0')}</span><div className="source-content"><a href={source.url} target="_blank" rel="noreferrer">{source.title}<Arrow diagonal /></a><span className="source-host">{new URL(source.url).hostname}</span>{source.notes && <p>{source.notes}</p>}</div></li>)}</ul>}
            </div>
          </PaneBackground>
          </CalendarPanel>

          <CalendarPanel>
          <PaneBackground as="section" className="panel decision-panel" aria-labelledby="decisions-heading">
            <div className="panel-heading"><span className="step-number">02</span><div><h3 id="decisions-heading">From finding to feature</h3><p>Make the connection between evidence and action.</p></div></div>
            <form onSubmit={submitDecision} noValidate className="entry-form">
              <div className="field"><label htmlFor="decision-source">Research source <span aria-hidden="true">*</span></label><PaneBackground as="select" id="decision-source" value={effectiveSource} onChange={(event) => setSelectedSource(event.target.value)} disabled={workspace.sources.length === 0} required>{workspace.sources.length === 0 && <option value="">Add a source to get started</option>}{workspace.sources.map((source) => <option value={source.id} key={source.id}>{source.title}</option>)}</PaneBackground></div>
              <div className="decision-field-grid"><div className="field"><label htmlFor="research-finding">Research finding <span aria-hidden="true">*</span></label><PaneBackground as="textarea" id="research-finding" rows={4} value={finding} onChange={(event) => setFinding(event.target.value)} placeholder="What does the evidence suggest? Include the limits of the finding." required /></div><div className="field"><label htmlFor="implementation-plan">Implementation plan <span aria-hidden="true">*</span></label><PaneBackground as="textarea" id="implementation-plan" rows={4} value={implementation} onChange={(event) => setImplementation(event.target.value)} placeholder="How will this inform your web application? What will you test?" required /></div></div>
              {decisionError && <p className="form-error" role="alert">{decisionError}</p>}
              <p className="form-success" role="status" aria-live="polite">{decisionSuccess}</p>
              <div className="decision-form-footer"><span className="field-hint">Every decision starts with a source.</span><CalendarButton className="button button-primary" type="submit" label="Add decision" hoverLabel="Plan feature" disabled={workspace.sources.length === 0} icon={<span aria-hidden="true">+</span>} /></div>
            </form>

            <div className="decisions-section"><div className="list-heading"><h4>Implementation decisions</h4><span>{workspace.decisions.length}</span></div>
              {workspace.decisions.length === 0 ? <div className="empty-state decision-empty"><div className="empty-orbit" aria-hidden="true"><span />→<span /></div><h4>Give your research a direction.</h4><p>Connect a finding to a concrete implementation. Then track it from the first plan to a result you have checked.</p><span className="empty-tag">RESEARCH → APPLICATION</span></div> : <ul className="decision-list">{workspace.decisions.map((decision, index) => {
                const source = workspace.sources.find((item) => item.id === decision.sourceId)
                return <PaneBackground as="li" key={decision.id} className="decision-card"><div className="decision-card-top"><span className="decision-id">DECISION {String(index + 1).padStart(2, '0')}</span><span className={`status-badge status-${decision.status}`}><span />{statuses.find((status) => status.value === decision.status)?.label}</span></div><h5>Finding</h5><p className="decision-text">{decision.finding}</p><div className="implementation-block"><h5>Implementation</h5><p className="decision-text">{decision.implementation}</p></div><div className="decision-card-bottom">{source && <a className="decision-source-link" href={source.url} target="_blank" rel="noreferrer"><Arrow diagonal />{source.title}</a>}<label className="status-control">Status<PaneBackground as="select" aria-label={`Status for decision ${index + 1}`} value={decision.status} onChange={(event) => changeStatus(decision.id, event.target.value as ImplementationStatus)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</PaneBackground></label></div></PaneBackground>
              })}</ul>}
              <p className="validation-note">“Validated” is a status you set after checking an implementation. It does not establish scientific validity. Record the test and its results in the repository’s decision template.</p>
            </div>
          </PaneBackground>
          </CalendarPanel>
        </div>

        <section id="glass-workspace" aria-label="Idea draft" className="glass-workspace-section" data-main-glass="">
          <ResearchDraftPanel />
        </section>

        <section id="glass-objects" aria-label="Glass objects" className="main-glass-objects">
          <GlassTorusCard {...MAIN_GLASS_PROPS} />
          <GlassPanelCard {...MAIN_GLASS_PROPS} />
        </section>

        <PaneBackground as="aside" className="next-step"><div className="next-step-icon" aria-hidden="true">✳</div><div><h3>A small beginning. Room to grow.</h3><p>Choose a research question, review the evidence, then build the smallest application that can test your idea. Research and decision templates are included in the repository.</p></div></PaneBackground>
        <FooterTextScene rotationSpeed={0.12} />
        <footer className="site-footer"><span>first light<span className="brand-dot">.</span><span className="footer-tagline">Make learning tangible.</span></span><p>Local browser storage · Export regularly for backup · No account needed<br /><MoonCredit />{' · '}<EarthCredit /></p></footer>
      </main>
    </>
  )
}
