import { useState, type FormEvent } from 'react'
import { useWorkspace } from './useWorkspace'
import type { ImplementationStatus } from './workspace'
import CalendarPanel from './components/calendarMotion/CalendarPanel'
import CalendarButton from './components/calendarMotion/CalendarButton'
import { sourceSectionTemplate, type SourceSectionInstance } from './components/sources/SourceSection'
import './App.css'

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h15m-6-6 6 6-6 6" />}
    </svg>
  )
}

function Sun({ large = false }: { large?: boolean }) {
  return (
    <svg aria-hidden="true" className={large ? 'sun-illustration' : 'brand-icon'} width={large ? '180' : '38'} height={large ? '122' : '38'} viewBox={large ? '0 0 180 122' : '0 0 38 38'} fill="none">
      {large ? <>
        <path d="M20 102h140M33 113h114M90 9v17M30 35l12 12M150 35l-12 12M10 76h18M152 76h18" stroke="currentColor" strokeWidth="2" />
        <path d="M43 102a47 47 0 0 1 94 0" fill="currentColor" />
      </> : <>
        <rect width="38" height="38" rx="11" fill="currentColor" />
        <path d="M8 25h22M12 22a7 7 0 0 1 14 0M19 8v4M9 12l3 3M29 12l-3 3" stroke="#fffaf4" strokeWidth="1.7" strokeLinecap="round" />
      </>}
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
  const { workspace, storageWarning, addSource, addDecision, updateDecisionStatus, exportWorkspace } = useWorkspace()
  const [sourceTitle, setSourceTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [sourceNotes, setSourceNotes] = useState('')
  const [sourceError, setSourceError] = useState('')
  const [sourceSuccess, setSourceSuccess] = useState('')
  const [sourceSections, setSourceSections] = useState<SourceSectionInstance[]>([])
  const [selectedSource, setSelectedSource] = useState('')
  const [finding, setFinding] = useState('')
  const [implementation, setImplementation] = useState('')
  const [decisionError, setDecisionError] = useState('')
  const [decisionSuccess, setDecisionSuccess] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [workspaceMessage, setWorkspaceMessage] = useState('')
  const effectiveSource = selectedSource || workspace.sources[0]?.id || ''
  const validated = workspace.decisions.filter((decision) => decision.status === 'validated').length

  function introduceSourceSection() {
    const section = sourceSectionTemplate.create()
    setSourceSections(current => [...current, section])
  }

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
      <header className="site-header">
        <a className="brand" href="#top" aria-label="First Light home"><Sun /><span>first light<span className="brand-dot">.</span></span></a>
        <div className="header-context"><span className="context-divider" />Research workspace<span className="local-badge"><span />Local</span></div>
        <CalendarButton
          className="button button-secondary export-button"
          type="button"
          label="Export workspace"
          hoverLabel="Download JSON"
          onClick={downloadWorkspace}
          icon={<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" /></svg>}
        />
      </header>

      <main id="top" className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="tiny-line" />IDEAS, GROUNDED IN EVIDENCE</p>
            <h1 id="hero-title">Good research.<br /><span>Real applications.</span></h1>
            <p className="hero-description">A place to turn what you learn into what you build. Collect the evidence, connect the findings, and give your next web application a clear starting point.</p>
          </div>
          <div className="hero-art" aria-hidden="true"><div className="art-grid" /><Sun large /><span className="art-caption">EVERY BUILD STARTS WITH A SPARK</span></div>
        </section>

        <section className="workflow-strip" aria-label="Research to application workflow">
          <span><b>01</b> Collect sources</span><Arrow /><span><b>02</b> Connect findings</span><Arrow /><span><b>03</b> Build an application</span><Arrow /><span><b>04</b> Verify the result</span>
        </section>

        <div className="workspace-heading" id="workspace">
          <div><p className="eyebrow">YOUR STARTING POINT</p><h2>The workspace</h2></div>
          <span className="privacy-note"><span className="small-dot" />Stored in this browser</span>
        </div>

        {storageWarning && <div className="notice notice-warning" role="alert">{storageWarning}</div>}
        {workspaceError && <div className="notice notice-error" role="alert">{workspaceError}</div>}
        <div className="workspace-feedback" role="status" aria-live="polite">{workspaceMessage}</div>

        <section className="stats-grid" aria-label="Workspace overview">
          <div className="stat"><span className="stat-label">Research sources</span><span className="stat-value">{String(workspace.sources.length).padStart(2, '0')}</span><span className="stat-detail">The evidence behind your ideas</span></div>
          <div className="stat"><span className="stat-label">Implementation decisions</span><span className="stat-value">{String(workspace.decisions.length).padStart(2, '0')}</span><span className="stat-detail">Findings with a plan of action</span></div>
          <div className="stat"><span className="stat-label">Marked validated</span><span className="stat-value">{String(validated).padStart(2, '0')}<span className="stat-spark">✳</span></span><span className="stat-detail">Status reported by you</span></div>
        </section>

        <div className="workspace-grid">
          <CalendarPanel>
          <section className="panel source-panel" aria-labelledby="sources-heading">
            <div className="panel-heading"><span className="step-number">01</span><div><h3 id="sources-heading">Research library</h3><p>Start with something worth building on.</p></div></div>
            <form onSubmit={submitSource} noValidate className="entry-form">
              <div className="field"><label htmlFor="source-title">Source title <span aria-hidden="true">*</span></label><input id="source-title" value={sourceTitle} onChange={(event) => setSourceTitle(event.target.value)} placeholder="A paper, study, or research article" required /></div>
              <div className="field"><label htmlFor="source-url">Source URL <span aria-hidden="true">*</span></label><input id="source-url" type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" required /><span className="field-hint">Link to the original research where possible.</span></div>
              <div className="field"><label htmlFor="source-notes">Source notes <span className="optional">optional</span></label><textarea id="source-notes" rows={3} value={sourceNotes} onChange={(event) => setSourceNotes(event.target.value)} placeholder="Why is this source useful? Note its context or limitations." /></div>
              {sourceError && <p className="form-error" role="alert">{sourceError}</p>}
              <p className="form-success" role="status" aria-live="polite">{sourceSuccess}</p>
              <CalendarButton className="button button-primary" type="button" label="Add source" hoverLabel="New section" onClick={introduceSourceSection} aria-controls="source-sections" icon={<span aria-hidden="true">+</span>} />
            </form>
            <div className="library-section"><div className="list-heading"><h4>Your sources</h4><span>{workspace.sources.length}</span></div>
              {workspace.sources.length === 0 ? <div className="empty-state source-empty"><span className="empty-symbol" aria-hidden="true"><Arrow diagonal /></span><h4>A clean page. A clear beginning.</h4><p>Add your first source above. Your evidence will live here, ready to inform the next step.</p></div> : <ul className="source-list">{workspace.sources.map((source, index) => <li key={source.id}><span className="source-index">{String(index + 1).padStart(2, '0')}</span><div className="source-content"><a href={source.url} target="_blank" rel="noreferrer">{source.title}<Arrow diagonal /></a><span className="source-host">{new URL(source.url).hostname}</span>{source.notes && <p>{source.notes}</p>}</div></li>)}</ul>}
            </div>
          </section>
          </CalendarPanel>

          <CalendarPanel>
          <section className="panel decision-panel" aria-labelledby="decisions-heading">
            <div className="panel-heading"><span className="step-number">02</span><div><h3 id="decisions-heading">From finding to feature</h3><p>Make the connection between evidence and action.</p></div></div>
            <form onSubmit={submitDecision} noValidate className="entry-form">
              <div className="field"><label htmlFor="decision-source">Research source <span aria-hidden="true">*</span></label><select id="decision-source" value={effectiveSource} onChange={(event) => setSelectedSource(event.target.value)} disabled={workspace.sources.length === 0} required>{workspace.sources.length === 0 && <option value="">Add a source to get started</option>}{workspace.sources.map((source) => <option value={source.id} key={source.id}>{source.title}</option>)}</select></div>
              <div className="decision-field-grid"><div className="field"><label htmlFor="research-finding">Research finding <span aria-hidden="true">*</span></label><textarea id="research-finding" rows={4} value={finding} onChange={(event) => setFinding(event.target.value)} placeholder="What does the evidence suggest? Include the limits of the finding." required /></div><div className="field"><label htmlFor="implementation-plan">Implementation plan <span aria-hidden="true">*</span></label><textarea id="implementation-plan" rows={4} value={implementation} onChange={(event) => setImplementation(event.target.value)} placeholder="How will this inform your web application? What will you test?" required /></div></div>
              {decisionError && <p className="form-error" role="alert">{decisionError}</p>}
              <p className="form-success" role="status" aria-live="polite">{decisionSuccess}</p>
              <div className="decision-form-footer"><span className="field-hint">Every decision starts with a source.</span><CalendarButton className="button button-primary" type="submit" label="Add decision" hoverLabel="Plan feature" disabled={workspace.sources.length === 0} icon={<span aria-hidden="true">+</span>} /></div>
            </form>

            <div className="decisions-section"><div className="list-heading"><h4>Implementation decisions</h4><span>{workspace.decisions.length}</span></div>
              {workspace.decisions.length === 0 ? <div className="empty-state decision-empty"><div className="empty-orbit" aria-hidden="true"><span />→<span /></div><h4>Give your research a direction.</h4><p>Connect a finding to a concrete implementation. Then track it from the first plan to a result you have checked.</p><span className="empty-tag">RESEARCH → APPLICATION</span></div> : <ul className="decision-list">{workspace.decisions.map((decision, index) => {
                const source = workspace.sources.find((item) => item.id === decision.sourceId)
                return <li key={decision.id} className="decision-card"><div className="decision-card-top"><span className="decision-id">DECISION {String(index + 1).padStart(2, '0')}</span><span className={`status-badge status-${decision.status}`}><span />{statuses.find((status) => status.value === decision.status)?.label}</span></div><h5>Finding</h5><p className="decision-text">{decision.finding}</p><div className="implementation-block"><h5>Implementation</h5><p className="decision-text">{decision.implementation}</p></div><div className="decision-card-bottom">{source && <a className="decision-source-link" href={source.url} target="_blank" rel="noreferrer"><Arrow diagonal />{source.title}</a>}<label className="status-control">Status<select aria-label={`Status for decision ${index + 1}`} value={decision.status} onChange={(event) => changeStatus(decision.id, event.target.value as ImplementationStatus)}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label></div></li>
              })}</ul>}
              <p className="validation-note">“Validated” is a status you set after checking an implementation. It does not establish scientific validity. Record the test and its results in the repository’s decision template.</p>
            </div>
          </section>
          </CalendarPanel>
        </div>

        <div id="source-sections" style={{ display: 'grid', gap: 24, marginTop: sourceSections.length ? 24 : 0 }}>
          {sourceSections.map((section, index) => sourceSectionTemplate.render(section, index + 1))}
        </div>

        <aside className="next-step"><div className="next-step-icon" aria-hidden="true">✳</div><div><h3>A small beginning. Room to grow.</h3><p>Choose a research question, review the evidence, then build the smallest application that can test your idea. Research and decision templates are included in the repository.</p></div></aside>
        <footer className="site-footer"><span>first light<span className="brand-dot">.</span><span className="footer-tagline">Make learning tangible.</span></span><p>Local browser storage · Export regularly for backup · No account needed</p></footer>
      </main>
    </>
  )
}
