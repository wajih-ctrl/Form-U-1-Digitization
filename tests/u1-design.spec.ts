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

test('Jost, focus review, grouped records and safe navigation from captured forms',async({page,request})=>{
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
  const sheet=page.locator('.u-document-sheet'),sheetBox=await sheet.boundingBox(),course=source.fields.find(f=>f.id==='shell.1.course')!,bolting=source.fields.find(f=>f.id==='bodyFlange.1.bolting')!
  expect(sheetBox).toBeTruthy()
  await page.mouse.click(sheetBox!.x+course.box[0]*sheetBox!.width-10,sheetBox!.y+(course.box[1]+course.box[3]/2)*sheetBox!.height)
  await expect(page.locator('[data-field-id="shell.1.course"]')).toHaveClass(/active/)
  await page.mouse.click(sheetBox!.x+(bolting.box[0]+bolting.box[2]/2)*sheetBox!.width,sheetBox!.y+(bolting.box[1]+bolting.box[3]/2)*sheetBox!.height)
  await expect(page.locator('.u-source-options')).toContainText('3 fields share this source')
  await page.getByRole('button',{name:'Select Bolting size',exact:true}).click()
  await expect(page.locator('[data-field-id="bodyFlange.1.boltSize"]')).toHaveClass(/active/)
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
