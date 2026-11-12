import { useState } from 'react'
import type { AccountWorkspace } from '../../useAccountWorkspace'
import styles from './AccountResearchControls.module.css'

/** Native controls only; provider sign-in remains an explicit future integration. */
export default function AccountResearchControls({ account }: { account: AccountWorkspace['account'] }) {
  const [message, setMessage] = useState('')
  if (!account.enabled) return null

  async function perform(action: () => Promise<void>, success: string) {
    setMessage('')
    try { await action(); setMessage(success) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'The account request failed.') }
  }

  return (
    <section aria-label="Account research" className="notice">
      <p>{account.phase === 'authenticated'
        ? `Signed in as ${account.user?.name || account.user?.email || 'researcher'}. Research is stored in your account.`
        : account.checking ? 'Checking your session…'
          : account.phase === 'signed-out' ? 'Signed out. Refresh account to continue with the browser workspace.'
          : account.phase === 'anonymous' ? 'Browser workspace. A sign-in provider has not been connected yet.'
            : 'Account research is locked. Your original browser data has been kept.'}</p>
      <div className={styles.controls}>
        <button type="button" className="button button-secondary" disabled={account.busy || account.checking}
          onClick={() => void perform(account.refresh, '')}>Refresh account</button>
        {account.phase === 'authenticated' && <>
          <button type="button" className="button button-secondary" disabled={account.busy}
            onClick={() => void perform(account.importBrowserResearch, 'Browser research imported. The local original was kept.')}>Import browser research</button>
          <label className={`field ${styles.file}`}>Import an exported workspace
            <input type="file" accept="application/json,.json" disabled={account.busy}
              onChange={event => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ''
                if (file) void perform(() => account.importResearchFile(file), 'Exported research imported. Existing account records were preserved.')
              }} />
          </label>
        </>}
        {(account.phase === 'authenticated' || account.phase === 'locked') && <button type="button" className="button button-secondary" disabled={account.busy}
          onClick={() => void perform(() => account.logout(), '')}>Log out</button>}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  )
}
