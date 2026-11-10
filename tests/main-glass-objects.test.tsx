import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import GlassObjectCanvas from '../src/components/glass-objects/GlassObjectCanvas'
import FooterTextScene from '../src/components/typography/FooterTextScene'

vi.mock('../src/components/glass-objects/GlassObjectCanvas', () => ({ default: vi.fn() }))
vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas', () => ({ default: () => null }))
vi.mock('../src/components/react three fibre/sunScene/SunScene', () => ({ default: () => null }))
vi.mock('../src/components/typography/FooterTextScene', () => ({ default: vi.fn(() => <div data-testid="main-footer-scene-boundary" />) }))

const KEY='first-light.workspace.v1'
const SEED={ version:1, sources:[{ id:'main-object-source', title:'Existing evidence', url:'https://example.org/evidence', notes:'Saved research', createdAt:'2026-01-01T00:00:00.000Z' }], decisions:[] }

function environment(reduced=false) {
  vi.stubGlobal('WebGLRenderingContext',class {})
  vi.stubGlobal('WebGL2RenderingContext',undefined)
  vi.stubGlobal('matchMedia',vi.fn((query:string)=>({ matches:query.includes('reduced-motion')&&reduced,addEventListener:vi.fn(),removeEventListener:vi.fn(),addListener:vi.fn(),removeListener:vi.fn() })))
  const observers:Observer[]=[]
  class Observer {
    target:Element|null=null
    live=true
    constructor(readonly callback:IntersectionObserverCallback) { observers.push(this) }
    observe(target:Element) { this.target=target }
    disconnect() { this.live=false }
  }
  vi.stubGlobal('IntersectionObserver',Observer)
  return (target:Element)=>act(()=>observers.filter(observer=>observer.live&&observer.target===target).forEach(observer=>observer.callback([{ target,isIntersecting:true } as IntersectionObserverEntry],observer as unknown as IntersectionObserver)))
}
function latest(kind:'torus'|'panel') { return vi.mocked(GlassObjectCanvas).mock.calls.map(call=>call[0]).filter(props=>props.kind===kind).at(-1)! }
function showObjects(intersect:ReturnType<typeof environment>,region:HTMLElement) {
  region.querySelectorAll('[data-glass-object-stage]').forEach(intersect)
}

beforeEach(()=>{
  vi.mocked(GlassObjectCanvas).mockImplementation(({kind})=><div data-testid="main-object-gpu-boundary" data-kind={kind} />)
})
afterEach(()=>{vi.unstubAllGlobals()})

describe('two glass objects on the actual main workspace',()=>{
  it('places two independent cards between the research draft and next step, passing exact optics, tint, spin and main-only lighting',async()=>{
    const intersect=environment()
    const view=render(<App />)
    const region=screen.getByRole('region',{name:'Glass objects'})
    expect(region).toHaveAttribute('id','glass-objects')
    expect(region.querySelectorAll('[data-glass-object-kind]')).toHaveLength(2)
    expect(within(region).queryByRole('combobox',{name:'Glass object'})).not.toBeInTheDocument()
    const draft=screen.getByRole('region',{name:'Idea draft'}),next=view.container.querySelector('.next-step')!
    expect(draft.compareDocumentPosition(region)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(region.compareDocumentPosition(next)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    showObjects(intersect,region)
    expect(await screen.findAllByTestId('main-object-gpu-boundary')).toHaveLength(2)
    for(const kind of ['torus','panel'] as const) {
      expect(latest(kind)).toMatchObject({
        kind,rotationAxis:'y',rotationSpeed:0.25,lightingIntensity:1.25,
        settings:{transmission:1,thickness:0.41,ior:1.7,chromaticAberration:0.062,roughness:0.08,color:'#cdd2d9'},
      })
      const card=region.querySelector(`[data-glass-object-kind="${kind}"]`)!
      expect(within(card as HTMLElement).getByRole('checkbox',{name:'Spin'})).toBeChecked()
      expect(within(card as HTMLElement).getByRole('combobox',{name:'Rotation axis'})).toHaveValue('y')
      expect(within(card as HTMLElement).getByRole('slider',{name:/Rotation speed:/})).toHaveValue('0.25')
    }
    act(()=>{latest('torus').onReady();latest('panel').onReady()})
    expect(latest('torus').spin).toBe(true)
    expect(latest('panel').spin).toBe(true)
    expect(vi.mocked(FooterTextScene).mock.calls.at(-1)![0]).toMatchObject({rotationSpeed:0.12})
  })

  it('keeps workspace data, temporary draft, source batches and JSON export independent of object-control edits',async()=>{
    environment(true);localStorage.setItem(KEY,JSON.stringify(SEED))
    let exported:Blob|undefined
    const revoke=vi.fn()
    const OriginalURL=URL
    vi.stubGlobal('URL',class extends OriginalURL {
      static createObjectURL(object:Blob|MediaSource) {
        if(!(object instanceof Blob)) throw new Error('Expected a workspace Blob')
        exported=object;return 'blob:workspace-export'
      }
      static revokeObjectURL(url:string) {revoke(url)}
    })
    const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
    const user=userEvent.setup(),view=render(<App />)
    const draft=screen.getByRole('textbox',{name:'Research draft'})
    await user.type(draft,'A temporary research idea')
    const metadata=screen.getByRole('textbox',{name:'Source title'})
    await user.type(metadata,'Unsaved source metadata')
    const panel=view.container.querySelector('[data-glass-object-kind="panel"]')! as HTMLElement
    const axis=within(panel).getByRole('combobox',{name:'Rotation axis'})
    await user.selectOptions(axis,'x')
    fireEvent.change(within(panel).getByRole('slider',{name:/Thickness:/}),{target:{value:'0.5'}})
    await user.click(screen.getByRole('button',{name:'Add source'}))
    expect(view.container.querySelectorAll('#source-sections [data-new-user-card]')).toHaveLength(3)
    expect(draft).toHaveValue('A temporary research idea')
    expect(metadata).toHaveValue('Unsaved source metadata')
    expect(within(panel).getByRole('combobox',{name:'Rotation axis'})).toBe(axis)
    expect(axis).toHaveValue('x')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(SEED)
    await user.click(screen.getByRole('button',{name:'Export workspace'}))
    expect(click).toHaveBeenCalledOnce()
    expect(exported).toBeInstanceOf(Blob)
    const json=await new Promise<string>((resolve,reject)=>{
      const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsText(exported!)
    })
    expect(JSON.parse(json)).toEqual(SEED)
    await waitFor(()=>expect(revoke).toHaveBeenCalledWith('blob:workspace-export'),{timeout:1800})
  })

  it('contains one object renderer failure while preserving the other scene, native draft, controls and saved research',async()=>{
    const intersect=environment(true);localStorage.setItem(KEY,JSON.stringify(SEED))
    const user=userEvent.setup()
    render(<App />)
    const region=screen.getByRole('region',{name:'Glass objects'})
    showObjects(intersect,region)
    await screen.findAllByTestId('main-object-gpu-boundary')
    act(()=>{latest('torus').onReady();latest('panel').onReady()})
    const draft=screen.getByRole('textbox',{name:'Research draft'})
    await user.type(draft,'Keep this idea')
    const torus=region.querySelector('[data-glass-object-kind="torus"]')! as HTMLElement
    const panel=region.querySelector('[data-glass-object-kind="panel"]')!
    const callbacks=latest('torus')
    act(()=>callbacks.onUnavailable('context'))
    expect(torus).toHaveAttribute('data-glass-object-state','unavailable')
    expect(panel).toHaveAttribute('data-glass-object-state','loaded')
    expect(screen.getAllByTestId('main-object-gpu-boundary')).toHaveLength(1)
    expect(screen.getByRole('textbox',{name:'Research draft'})).toBe(draft)
    expect(draft).toHaveValue('Keep this idea');expect(draft).toHaveFocus()
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(SEED)
    await user.click(within(torus).getByRole('button',{name:'Retry 3D preview'}))
    expect(await screen.findAllByTestId('main-object-gpu-boundary')).toHaveLength(2)
    act(()=>callbacks.onReady())
    expect(torus).toHaveAttribute('data-glass-object-state','loading')
    expect(panel).toHaveAttribute('data-glass-object-state','loaded')
  })
})
