'use client'
import { useEffect, useRef } from 'react'

/** Keyboard containment, escape dismissal and focus restoration for overlays. */
export function useDialog(open:boolean,close:()=>void) {
  const closeRef=useRef(close);closeRef.current=close
  useEffect(()=>{
    if(!open)return
    const prior=document.activeElement as HTMLElement|null
    const scroll=document.body.style.overflow;document.body.style.overflow='hidden'
    const getDialog=()=>document.querySelector<HTMLElement>('.u-modal-backdrop [role="dialog"]')
    const focusables=()=>Array.from(getDialog()?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]')??[]).filter(el=>el.getClientRects().length)
    const frame=requestAnimationFrame(()=>focusables()[0]?.focus())
    function key(event:KeyboardEvent){
      if(event.key==='Escape'){event.preventDefault();closeRef.current();return}
      if(event.key!=='Tab')return
      const items=focusables();if(!items.length)return
      const first=items[0],last=items[items.length-1]
      if(event.shiftKey&&(document.activeElement===first||!getDialog()?.contains(document.activeElement))){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&(document.activeElement===last||!getDialog()?.contains(document.activeElement))){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',key)
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);document.body.style.overflow=scroll;if(prior?.isConnected)prior.focus()}
  },[open])
}
