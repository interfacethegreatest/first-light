import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import EarthMarkCanvas from '../src/components/misc/EarthMark/EarthMarkCanvas'

vi.mock('../src/components/misc/EarthMark/EarthMarkCanvas',()=>({default:vi.fn()}))
vi.mock('../src/components/misc/MoonMark/MoonMarkCanvas',()=>({default:()=>null}))
vi.mock('../src/components/glass-panel-3d/GlassPanelCanvas',()=>({default:()=>null}))
vi.mock('../src/components/glass-objects/GlassObjectCanvas',()=>({default:()=>null}))
vi.mock('../src/components/typography/FooterTextCanvas',()=>({default:()=>null}))
vi.mock('../src/components/react three fibre/sunScene/SunScene',()=>({default:()=>null}))
const KEY='first-light.workspace.v1'
const SAVED={version:1,sources:[{id:'earth-existing-source',title:'Saved evidence',url:'https://example.org/research',notes:'Keep the original record',createdAt:'2026-01-01T00:00:00.000Z'}],decisions:[]}
function environment(webgl=true){
 vi.stubGlobal('WebGLRenderingContext',webgl?class {}:undefined);vi.stubGlobal('WebGL2RenderingContext',undefined)
 vi.stubGlobal('matchMedia',vi.fn((q:string)=>({matches:q.includes('reduced-motion'),addEventListener:vi.fn(),removeEventListener:vi.fn(),addListener:vi.fn(),removeListener:vi.fn()})))
 const observers:Observer[]=[]
 class Observer {
  target:Element|null=null;live=true
  constructor(readonly callback:IntersectionObserverCallback){observers.push(this)}
  observe(target:Element){this.target=target}
  disconnect(){this.live=false}
 }
 vi.stubGlobal('IntersectionObserver',Observer)
 return (target:Element)=>act(()=>observers.filter(o=>o.target===target&&o.live).forEach(o=>o.callback([{target,isIntersecting:true} as IntersectionObserverEntry],o as unknown as IntersectionObserver)))
}
beforeEach(()=>vi.mocked(EarthMarkCanvas).mockImplementation(()=><div data-testid="main-earth-gpu-boundary"/>))
afterEach(()=>vi.unstubAllGlobals())

describe('Earth indicators on the actual main workspace',()=>{
 it('replaces exactly the Local and stored indicators while preserving home focus, source batches, draft and saved export',async()=>{
  const intersect=environment();localStorage.setItem(KEY,JSON.stringify(SAVED))
  let exported:Blob|undefined
  const revoke=vi.fn()
  const OriginalURL=URL
  vi.stubGlobal('URL',class extends OriginalURL {
   static createObjectURL(blob:Blob|MediaSource){if(!(blob instanceof Blob))throw new Error('Expected export Blob');exported=blob;return 'blob:earth-export'}
   static revokeObjectURL=revoke
  })
  const click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{})
  const user=userEvent.setup(),view=render(<App/>),marks=[...view.container.querySelectorAll('[data-earth-mark]')]
  expect(marks).toHaveLength(2)
  const local=screen.getByText('Local',{exact:true}),stored=screen.getByText('Stored in this browser',{exact:true})
  expect(local.querySelector('[data-earth-mark]')).toBe(marks[0]);expect(stored.querySelector('[data-earth-mark]')).toBe(marks[1])
  expect((marks[0] as HTMLElement).style.getPropertyValue('--earth-mark-size')).toBe('12px')
  expect((marks[1] as HTMLElement).style.getPropertyValue('--earth-mark-size')).toBe('14px')
  const home=screen.getByRole('link',{name:'First Light home'})
  expect(home).toHaveAttribute('href','#top');expect(home.querySelectorAll('[data-moon-mark]')).toHaveLength(1)
  const credit=screen.getByRole('link',{name:'Earth by PatelDev'})
  expect(credit).toHaveAttribute('href','https://sketchfab.com/3d-models/earth-f7a76c63ff1846afb2d606e5c8369c15')
  expect(credit.parentElement?.querySelector('a[href="https://creativecommons.org/licenses/by/4.0/"]')).toBeInTheDocument()
  expect(screen.getByRole('link',{name:'Moon by MaggaModels'})).toBeInTheDocument()
  await user.tab();expect(screen.getByRole('link',{name:'Skip to workspace'})).toHaveFocus()
  await user.tab();expect(home).toHaveFocus()
  await user.tab();expect(screen.getByRole('button',{name:'Export workspace'})).toHaveFocus()
  marks.forEach(intersect);expect(await screen.findAllByTestId('main-earth-gpu-boundary')).toHaveLength(2)
  act(()=>vi.mocked(EarthMarkCanvas).mock.calls.forEach(([props])=>props.onReady?.()))
  for(const mark of marks){expect(mark).toHaveAttribute('data-earth-state','loaded');expect(mark.querySelector('[data-earth-fallback]')).toBeNull()}
  const metadata=screen.getByRole('textbox',{name:'Source title'}),draft=screen.getByRole('textbox',{name:'Research draft'})
  await user.type(metadata,'Unsaved Earth metadata');await user.type(draft,'Keep the temporary idea')
  await user.click(screen.getByRole('button',{name:'Add source'}))
  expect(view.container.querySelectorAll('#source-sections [data-new-user-card]')).toHaveLength(3)
  expect(metadata).toHaveValue('Unsaved Earth metadata');expect(draft).toHaveValue('Keep the temporary idea')
  expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual(SAVED)
  await user.click(screen.getByRole('button',{name:'Export workspace'}));expect(click).toHaveBeenCalledOnce()
  expect(exported).toBeInstanceOf(Blob)
  const json=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsText(exported!)})
  expect(JSON.parse(json)).toEqual(SAVED)
  await waitFor(()=>expect(revoke).toHaveBeenCalledWith('blob:earth-export'),{timeout:1800})
 })

 it('keeps Earth failures local without dropping native form values or saved evidence',async()=>{
  const intersect=environment(),view=render(<App/>),marks=[...view.container.querySelectorAll('[data-earth-mark]')]
  marks.forEach(intersect);await screen.findAllByTestId('main-earth-gpu-boundary')
  const callbacks=vi.mocked(EarthMarkCanvas).mock.calls.map(([props])=>props)
  const user=userEvent.setup(),field=screen.getByRole('textbox',{name:'Source title'})
  await user.type(field,'Native field survives Earth loss')
  act(()=>callbacks[0].onUnavailable?.())
  await waitFor(()=>expect(marks[0]).toHaveAttribute('data-earth-state','unavailable'))
  expect(field).toHaveValue('Native field survives Earth loss');expect(field).toHaveFocus()
  expect(marks[0].querySelector('[data-earth-fallback]')).toBeInTheDocument()
  expect(screen.getByRole('button',{name:'Add decision'})).toHaveAttribute('type','submit')
  expect(screen.getByRole('link',{name:'First Light home'})).toHaveAttribute('href','#top')
  expect(localStorage.length).toBe(0)
 })
})
