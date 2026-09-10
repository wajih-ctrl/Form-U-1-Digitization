import { test,expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { templateFields } from '../lib/u1/template.mjs'

test('requirement audit: static mappings, approved totals and filtered review navigation',async({page})=>{
  const fields=templateFields().map(f=>({...f,value:'',original:'',confidence:0,status:'Not Detected'}))
  fields[1]={...fields[1],value:'Reviewed address',original:'Reviewed address',confidence:95,status:'Verified'}
  const source={id:'U1-AUDIT-REVIEW',name:'Review fixture',created:new Date().toISOString(),updated:new Date().toISOString(),reviewer:'UI tester',status:'In Review',pages:[],history:[],fields}
  const captured={...source,id:'U1-AUDIT-CAPTURE',status:'Captured',fields:[]}
  const approved={...source,id:'U1-AUDIT-APPROVED',status:'Approved',approvedAt:new Date().toISOString()}
  const database={...approved,id:'U1-AUDIT-DATABASE',status:'Database Ready'}
  let records:unknown[]=[]
  await page.route('**/api/u1/records',route=>route.fulfill({json:{records}}))
  await page.goto('/')
  await page.getByRole('button',{name:'Administration',exact:true}).click()
  await page.getByRole('button',{name:'Field mappings',exact:true}).click()
  await expect(page.getByRole('region',{name:'Supported field mappings'}).locator('tbody tr')).toHaveCount(fields.length)
  records=[captured,source,approved,database];await page.reload()
  await page.locator('.u-metric').filter({hasText:'Approved records'}).click()
  await expect(page.locator('.u-record-link')).toHaveCount(2)
  await expect(page.getByRole('button',{name:database.id,exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Reset',exact:true}).click()
  await page.getByRole('button',{name:captured.id,exact:true}).click()
  await page.getByRole('button',{name:'Administration',exact:true}).click()
  await page.getByRole('button',{name:'Field mappings',exact:true}).click()
  await expect(page.getByRole('region',{name:'Supported field mappings'}).locator('tbody tr')).toHaveCount(fields.length)
  await page.getByRole('navigation',{name:'Workspace navigation'}).getByRole('button',{name:/Engineering review/}).click()
  await page.getByLabel('Field filter').selectOption('Needs review')
  await page.getByRole('button',{name:'Next field',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Edit Purchaser',exact:true})).toBeVisible()
  await expect(page.getByLabel('Field filter')).toHaveValue('Needs review')
  await page.getByRole('button',{name:'Previous field',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Edit Manufacturer',exact:true})).toBeVisible()
})

test('Jost, complete document hit map, focus review and safe record navigation',async({page,request})=>{
  test.setTimeout(120000)
  const upload=await request.post('/api/u1/upload',{multipart:{files:{name:'reference.pdf',mimeType:'application/pdf',buffer:await readFile('public/reference-u1.pdf')}}})
  const {pages}=await upload.json()
  // Browser-only fixtures test layout/navigation without creating a signed record.
  const source={id:'U1-DESIGN-REVIEW',name:'UI test fixture',created:new Date().toISOString(),updated:new Date().toISOString(),reviewer:'UI tester',status:'Review Required',pages,history:[],fields:templateFields().map(f=>({...f,value:'',original:'',confidence:0,status:'Not Detected'}))}
  const captured={...source,id:'U1-DESIGN-CAPTURE',status:'Captured',fields:[],history:[]}
  await page.route('**/api/u1/records',route=>route.request().method()==='GET'?route.fulfill({json:{records:[captured,source]}}):route.continue())
  await page.goto('/');await page.evaluate(()=>document.fonts.ready)
  for(const selector of ['h1','.u-btn','.u-sidebar','.u-record-link'])expect(await page.locator(selector).first().evaluate(e=>getComputedStyle(e).fontFamily)).toContain('Jost')
  await page.getByRole('button',{name:'U1-DESIGN-CAPTURE',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Capture a new form'})).toBeVisible()
  await page.getByRole('navigation',{name:'Workspace navigation'}).getByRole('button',{name:/Engineering review/}).click()
  await expect(page.getByRole('heading',{name:'Review against the original'})).toBeVisible()
  const sheet=page.locator('.u-document-sheet'),viewport=page.locator('.u-document-viewport')
  let currentZoom=100
  for(const targetZoom of [75,100,200]){
    while(currentZoom<targetZoom){await page.getByRole('button',{name:'Zoom in',exact:true}).click();currentZoom+=25}
    while(currentZoom>targetZoom){await page.getByRole('button',{name:'Zoom out',exact:true}).click();currentZoom-=25}
    for(const pageNumber of [1,2,3]){
      await page.getByRole('button',{name:`Page ${pageNumber}`,exact:true}).click()
      const grouped=new Map<string,typeof source.fields>()
      for(const field of source.fields.filter(f=>f.page===pageNumber)){const key=field.box.join(',');grouped.set(key,[...(grouped.get(key)||[]),field])}
      const cases=[...grouped.values()].map(group=>({box:group[0].box,ids:group.map(f=>f.id)}))
      const misses=await sheet.evaluate(async(element,tests)=>{
        const failed:string[]=[]
        for(const test of tests){
          const rect=element.getBoundingClientRect(),[x,y,w,h]=test.box
          element.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:rect.left+(x+w/2)*rect.width,clientY:rect.top+(y+h/2)*rect.height}))
          await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()))
          const selected=document.querySelector<HTMLElement>('[data-field-id].selected, [data-field-id].active')?.dataset.fieldId
          if(!selected||!test.ids.includes(selected))failed.push(`${test.ids.join('|')} selected ${selected||'nothing'}`)
        }
        return failed
      },cases)
      expect(misses,`Page ${pageNumber} source-map misses at ${targetZoom}%`).toEqual([])
      }
  }
  await page.getByRole('button',{name:'Page 1',exact:true}).click()
  async function clickPrintedLabel(fieldId:string){
    const field=source.fields.find(f=>f.id===fieldId)!
    await page.waitForTimeout(350)
    await viewport.evaluate((element,y)=>{element.scrollTop=Math.max(0,y*element.scrollHeight-element.clientHeight/2);element.scrollLeft=0},field.box[1]+field.box[3]/2)
    await page.waitForTimeout(50)
    const box=await sheet.boundingBox();expect(box).toBeTruthy()
    await page.mouse.click(box!.x+.055*box!.width,box!.y+(field.box[1]+field.box[3]/2)*box!.height)
  }
  for(const id of ['design.mawp','design.impact']){await clickPrintedLabel(id);await expect(page.locator(`[data-field-id="${id}"]`)).toHaveClass(/selected/)}
  await clickPrintedLabel('design.test')
  await expect(page.locator('.u-source-options')).toContainText('3 fields share this source')
  await page.getByRole('button',{name:'Select Hydro / pneumatic / combined',exact:true}).click()
  await expect(page.locator('[data-field-id="design.testType"]')).toHaveClass(/selected/)
  for(const id of ['tubesheet.1.material','tube.1.material']){await clickPrintedLabel(id);await expect(page.locator(`[data-field-id="${id}"]`)).toHaveClass(/active/)}
  await page.getByLabel('Review section').selectOption('General information')
  await page.getByRole('button',{name:'Focus review',exact:true}).click()
  await expect(page.locator('.u-app')).toHaveClass(/u-focus-mode/)
  await page.getByRole('button',{name:'Next review item',exact:true}).click()
  await expect(page.getByRole('textbox',{name:'Edit Manufacturer address',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Exit focus view',exact:true}).click()
  await page.getByRole('button',{name:'Vessel record',exact:true}).click()
  await page.getByRole('button',{name:'Collapse all',exact:true}).click()
  await expect(page.locator('.u-structure-body')).toHaveCount(0)
  await page.getByLabel('Search structured fields').fill('Nozzles / openings')
  await expect(page.locator('.u-structure-section')).toHaveCount(1)
  await expect(page.locator('.u-structure-table tbody tr')).toHaveCount(5)
  await page.getByLabel('Search structured fields').fill('no-match-zzzz')
  await expect(page.getByRole('heading',{name:'No matching fields'})).toBeVisible()
  for(const width of [1024,760,390,320]){
    await page.setViewportSize({width,height:900})
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Record overflow at ${width}px`).toBeTruthy()
  }
})

test('capture draft survives refresh and dialogs support Escape and focus return',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Capture a new form'}).click()
  await page.locator('input[type=file][multiple]').setInputFiles('public/reference-u1.pdf')
  await expect(page.locator('.u-page-tile')).toHaveCount(3)
  await page.getByRole('button',{name:'Remove page 3',exact:true}).click()
  await page.getByRole('button',{name:'Remove page 2',exact:true}).click()
  await expect(page.locator('.u-page-tile')).toHaveCount(1)
  await page.getByLabel('Record name',{exact:true}).fill('Saved capture draft')
  await page.reload();await page.getByRole('button',{name:'Capture a new form'}).click()
  await expect(page.locator('.u-page-tile')).toHaveCount(1)
  await expect(page.getByLabel('Record name',{exact:true})).toHaveValue('Saved capture draft')
  await page.getByRole('button',{name:'Preview page 1',exact:true}).click()
  await expect(page.getByRole('dialog',{name:'Page preview and crop'})).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Preview page 1',exact:true})).toBeFocused()
})
