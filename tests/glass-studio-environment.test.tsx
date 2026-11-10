import { Children, isValidElement } from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Environment, Lightformer } from '@react-three/drei'
import { GlassStudioEnvironment } from '../src/components/transmission/GlassStudioEnvironment'

vi.mock('@react-three/drei',()=>({Environment:vi.fn(()=>null),Lightformer:vi.fn(()=>null)}))

describe('stable studio environment capture inputs',()=>{
  it('preserves capture children on unrelated renders but updates the lighting when intensity changes',()=>{
    const view=render(<GlassStudioEnvironment intensity={1.25} />)
    const first=vi.mocked(Environment).mock.calls.at(-1)![0]
    const count=vi.mocked(Environment).mock.calls.length
    view.rerender(<GlassStudioEnvironment intensity={1.25} />)
    expect(Environment).toHaveBeenCalledTimes(count)
    view.rerender(<GlassStudioEnvironment intensity={1.5} />)
    expect(Environment).toHaveBeenCalledTimes(count+1)
    const updated=vi.mocked(Environment).mock.calls.at(-1)![0]
    expect(updated.children).not.toBe(first.children)
    expect(updated.frames).toBe(1)
    const lights=Children.toArray(updated.children).filter(isValidElement).filter(element=>element.type===Lightformer)
    expect(lights.map(element=>(element.props as {intensity:number}).intensity)).toEqual([6.75,3.375,4.5,1.875])
  })
})
