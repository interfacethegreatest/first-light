import { Children, StrictMode, Suspense, isValidElement, type Ref } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Canvas } from '@react-three/fiber'
import EarthMark from '../src/components/misc/EarthMark/EarthMark'
import EarthMarkCanvas from '../src/components/misc/EarthMark/EarthMarkCanvas'

vi.mock('../src/components/misc/EarthMark/EarthMarkCanvas',()=>({default:vi.fn()}))
vi.mock('@react-three/fiber',()=>({Canvas:vi.fn()}))
vi.mock('@react-three/drei',()=>({useGLTF:Object.assign(vi.fn(),{preload:vi.fn()})}))

function environment({reduced=false,webgl=true,hidden=false,observe=true}={}) {
  const listeners=new Set<()=>void>()
  const motion={matches:reduced,addEventListener:vi.fn((_name:string,fn:()=>void)=>listeners.add(fn)),removeEventListener:vi.fn((_name:string,fn:()=>void)=>listeners.delete(fn)),addListener:vi.fn(),removeListener:vi.fn()}
  const coarse={matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn(),addListener:vi.fn(),removeListener:vi.fn()}
  vi.stubGlobal('matchMedia',vi.fn((q:string)=>q.includes('reduced-motion')?motion:coarse))
  vi.stubGlobal('WebGLRenderingContext',webgl?class {}:undefined);vi.stubGlobal('WebGL2RenderingContext',undefined)
  let visibility=hidden?'hidden':'visible'
  vi.spyOn(document,'visibilityState','get').mockImplementation(()=>visibility as DocumentVisibilityState)
  const observers:Observer[]=[]
  class Observer {
    target:Element|null=null;live=true
    constructor(readonly callback:IntersectionObserverCallback){observers.push(this)}
    observe(target:Element){this.target=target}
    disconnect(){this.live=false}
    emit(intersecting:boolean){this.callback([{target:this.target!,isIntersecting:intersecting} as IntersectionObserverEntry],this as unknown as IntersectionObserver)}
  }
  vi.stubGlobal('IntersectionObserver',observe?Observer:undefined)
  return {observers,listeners,
    intersect(target:Element,visible:boolean){act(()=>observers.filter(o=>o.target===target&&o.live).forEach(o=>o.emit(visible)))},
    hidden(value:boolean){act(()=>{visibility=value?'hidden':'visible';document.dispatchEvent(new Event('visibilitychange'))})},
    reduced(value:boolean){act(()=>{motion.matches=value;listeners.forEach(fn=>fn())})},
  }
}
function latest(){return vi.mocked(EarthMarkCanvas).mock.calls.at(-1)![0]}
function element(container:HTMLElement){return container.querySelector('[data-earth-mark]')!}
function modelProps(){
  const config=vi.mocked(Canvas).mock.calls.at(-1)![0]
  const suspense=Children.toArray(config.children).find(child=>isValidElement(child)&&child.type===Suspense)
  if(!isValidElement<{children:{props:{animate?:boolean;rotationAxis?:string;rotationSpeed?:number;onReady:()=>void}}}>(suspense)) throw new Error('Missing Earth model boundary')
  return suspense.props.children.props
}
beforeEach(()=>{
  vi.mocked(EarthMarkCanvas).mockImplementation(({animate})=><div data-testid="earth-gpu-boundary" data-animate={Boolean(animate)} />)
  vi.mocked(Canvas).mockImplementation(props=><canvas ref={(props as {ref?:Ref<HTMLCanvasElement>}).ref} data-testid="earth-canvas-boundary" data-frameloop={props.frameloop} />)
})
afterEach(()=>vi.unstubAllGlobals())

describe('reusable decorative Earth lifecycle',()=>{
  it('loads only after visibility, waits for an actual draw and retains its scene across all activity gates',async()=>{
    const activity=environment(),view=render(<StrictMode><EarthMark className="local-earth" /></StrictMode>),mark=element(view.container)
    expect(mark).toHaveAttribute('aria-hidden','true');expect(mark).toHaveClass('local-earth')
    expect(mark).toHaveAttribute('data-earth-state','pending');expect(EarthMarkCanvas).not.toHaveBeenCalled()
    expect(mark.querySelector('[data-earth-fallback]')).toBeInTheDocument()
    activity.intersect(mark,true)
    const scene=await screen.findByTestId('earth-gpu-boundary')
    expect(mark).toHaveAttribute('data-earth-state','loading');expect(mark.querySelector('[data-earth-fallback]')).toBeInTheDocument()
    act(()=>latest().onReady?.())
    expect(mark).toHaveAttribute('data-earth-state','loaded');expect(mark.querySelector('[data-earth-fallback]')).toBeNull();expect(scene).toHaveAttribute('data-animate','true')
    activity.intersect(mark,false);expect(scene).toHaveAttribute('data-animate','false')
    activity.intersect(mark,true);activity.hidden(true);expect(scene).toHaveAttribute('data-animate','false')
    activity.hidden(false);activity.reduced(true);expect(scene).toHaveAttribute('data-animate','false')
    activity.reduced(false);expect(scene).toHaveAttribute('data-animate','true')
    view.rerender(<StrictMode><EarthMark animate rotationAxis="z" rotationSpeed={0} /></StrictMode>)
    expect(scene).toHaveAttribute('data-animate','false');expect(latest()).toMatchObject({rotationAxis:'z',rotationSpeed:0})
    expect(screen.getByTestId('earth-gpu-boundary')).toBe(scene)
    view.unmount();expect(activity.observers.every(o=>!o.live)).toBe(true);expect(activity.listeners.size).toBe(0)
  })

  it('defers first loading while hidden and cleans document listeners and queued observer deliveries',async()=>{
    const activity=environment({hidden:true}),add=vi.spyOn(document,'addEventListener'),remove=vi.spyOn(document,'removeEventListener')
    const view=render(<EarthMark />),mark=element(view.container)
    activity.intersect(mark,true);expect(EarthMarkCanvas).not.toHaveBeenCalled()
    activity.hidden(false);await screen.findByTestId('earth-gpu-boundary')
    const listener=add.mock.calls.find(([name])=>name==='visibilitychange')![1],observer=activity.observers.at(-1)!
    view.unmount();expect(remove).toHaveBeenCalledWith('visibilitychange',listener)
    const before=vi.mocked(EarthMarkCanvas).mock.calls.length;act(()=>observer.emit(true));expect(EarthMarkCanvas).toHaveBeenCalledTimes(before)
  })

  it('keeps two instances independent and ignores stale readiness after one renderer becomes unavailable',async()=>{
    const activity=environment(),view=render(<><EarthMark size={12}/><EarthMark size={14}/><button>Keep working</button></>)
    const [first,second]=view.container.querySelectorAll('[data-earth-mark]')
    activity.intersect(first,true);await screen.findByTestId('earth-gpu-boundary');const old=latest();act(()=>old.onReady?.())
    activity.intersect(second,true);expect(await screen.findAllByTestId('earth-gpu-boundary')).toHaveLength(2);act(()=>latest().onReady?.())
    act(()=>old.onUnavailable?.());act(()=>old.onReady?.())
    expect(first).toHaveAttribute('data-earth-state','unavailable');expect(second).toHaveAttribute('data-earth-state','loaded')
    expect(screen.getAllByTestId('earth-gpu-boundary')).toHaveLength(1)
    const user=userEvent.setup();await user.click(screen.getByRole('button',{name:'Keep working'}));expect(screen.getByRole('button')).toHaveFocus()
  })

  it('contains asset exceptions locally and leaves surrounding native content usable',async()=>{
    const activity=environment();vi.spyOn(console,'error').mockImplementation(()=>{})
    vi.mocked(EarthMarkCanvas).mockImplementation(()=>{throw new Error('Earth asset unavailable')})
    const view=render(<><EarthMark/><input aria-label="Research draft" defaultValue="Keep this"/></>),mark=element(view.container)
    activity.intersect(mark,true);await waitFor(()=>expect(mark).toHaveAttribute('data-earth-state','unavailable'))
    expect(mark.querySelector('canvas')).toBeNull();expect(mark.querySelector('[data-earth-fallback]')).toBeInTheDocument()
    const field=screen.getByRole('textbox',{name:'Research draft'});field.focus();expect(field).toHaveValue('Keep this');expect(field).toHaveFocus()
  })

  it('uses an empty decorative fallback without WebGL and reduced motion with no IntersectionObserver',async()=>{
    environment({webgl:false});const noGL=render(<EarthMark/>),mark=element(noGL.container)
    expect(mark).toHaveAttribute('data-earth-state','unavailable');expect(EarthMarkCanvas).not.toHaveBeenCalled();noGL.unmount()
    environment({observe:false,reduced:true});render(<EarthMark/>);expect(await screen.findByTestId('earth-gpu-boundary')).toHaveAttribute('data-animate','false')
  })
})

describe('actual Earth Canvas boundary',()=>{
  it('forwards rotation, switches demand mode at zero speed and contains real context loss without late readiness',async()=>{
    const {default:ActualCanvas}=await vi.importActual<typeof import('../src/components/misc/EarthMark/EarthMarkCanvas')>('../src/components/misc/EarthMark/EarthMarkCanvas')
    const ready=vi.fn(),unavailable=vi.fn(),view=render(<ActualCanvas animate rotationAxis="x" rotationSpeed={0.3} onReady={ready} onUnavailable={unavailable}/>)
    const canvas=screen.getByTestId('earth-canvas-boundary'),afterDraw=modelProps().onReady
    expect(canvas).toHaveAttribute('data-frameloop','always');expect(modelProps()).toMatchObject({animate:true,rotationAxis:'x',rotationSpeed:0.3})
    expect(ready).not.toHaveBeenCalled();act(()=>afterDraw());expect(ready).toHaveBeenCalledOnce()
    view.rerender(<ActualCanvas animate rotationAxis="z" rotationSpeed={0} onReady={ready} onUnavailable={unavailable}/>)
    expect(screen.getByTestId('earth-canvas-boundary')).toBe(canvas);expect(canvas).toHaveAttribute('data-frameloop','demand')
    expect(modelProps()).toMatchObject({animate:false,rotationAxis:'z',rotationSpeed:0})
    const remove=vi.spyOn(canvas,'removeEventListener'),loss=new Event('webglcontextlost',{cancelable:true})
    fireEvent(canvas,loss);expect(loss.defaultPrevented).toBe(true);expect(unavailable).toHaveBeenCalledOnce();expect(remove).toHaveBeenCalledWith('webglcontextlost',expect.any(Function))
    expect(screen.queryByTestId('earth-canvas-boundary')).not.toBeInTheDocument();act(()=>afterDraw());expect(ready).toHaveBeenCalledOnce()
  })
})
