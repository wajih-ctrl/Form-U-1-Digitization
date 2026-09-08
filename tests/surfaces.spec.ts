import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('every readiness, issue, technical, and document detail opens and closes', async ({page}, testInfo) => {
  test.setTimeout(120000)
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:844})
    for (const [route,label] of [['readiness','Review'],['issues','View'],['documents','Preview']]) {
      await page.goto('/'+route)
      await expect(page.getByRole('heading',{level:1})).toBeVisible()
      const buttons=page.getByRole('button',{name:label,exact:true})
      const count=await buttons.count()
      expect(count).toBeGreaterThan(0)
      for(let i=0;i<count;i++){
        await buttons.nth(i).click()
        const dialog=page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect.poll(async () => { const b = await dialog.boundingBox(); return Math.round(b!.x+b!.width) }).toBeLessThanOrEqual(width)
        const box=await dialog.boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x+box!.width).toBeLessThanOrEqual(width+1)
        expect(box!.height).toBeLessThanOrEqual(845)
        if(i===0){ const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();expect(audit.violations).toEqual([]);await page.screenshot({path:testInfo.outputPath(`dialog-${width}-${route}.png`)}) }
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
      }
    }
    await page.goto('/technical')
    const stages=page.locator('main [data-slot="card-content"] > button')
    await expect(stages.first()).toBeVisible()
    for(let i=0;i<await stages.count();i++){await stages.nth(i).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape')}
  }
})
test('all change dialogs fit on mobile and escape restores focus',async({page}, testInfo)=>{
  await page.setViewportSize({width:390,height:740})
  await page.goto('/changes/cr-003')
  for(const name of ['Approve Change','Reject','Request Clarification','Escalate']){
    const button=page.getByRole('button',{name,exact:true});await button.click()
    const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible()
    const box=await dialog.boundingBox();expect(box!.height).toBeLessThanOrEqual(709);expect(box!.x).toBeGreaterThanOrEqual(0)
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa']).analyze();expect(audit.violations).toEqual([])
    await page.screenshot({path:testInfo.outputPath(`decision-${name.replaceAll(' ','-')}.png`)})
    await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0)
  }
})
test('technical status choices save and assessment completion persists',async({page}, testInfo)=>{
  await page.goto('/'); await page.getByRole('button',{name:/^Technical \/ Lab/}).click(); await page.getByRole('button',{name:'Enter Workspace'}).click()
  await page.goto('/technical')
  await page.locator('main [data-slot="card-content"] > button').first().click()
  for(const label of ['Not Started','In Progress','At Risk','Blocked','Completed']){
    await page.getByRole('dialog').getByRole('combobox').click()
    await page.getByRole('option',{name:label,exact:true}).click()
    await expect(page.getByRole('dialog').getByRole('combobox')).toContainText(label)
  }
  await page.keyboard.press('Escape')
  await page.goto('/changes/cr-003')
  await page.getByRole('button',{name:'Update Assessment'}).first().click()
  await page.locator('#assessment-note').fill('Validated revised sampling frequency with the lab.')
  await page.getByRole('button',{name:'Complete Assessment'}).click()
  await page.reload()
  await expect(page.getByText('Validated revised sampling frequency with the lab.')).toBeVisible()
})

