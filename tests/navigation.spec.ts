import { test, expect } from '@playwright/test'

test('all list filters, project selectors, sidebar and profile controls work',async({page})=>{
  for(const route of ['actions','activity','timeline']) {
    await page.goto('/'+route)
    await expect(page.getByRole('heading',{level:1})).toBeVisible()
    const filters=page.locator('main button[aria-pressed]')
    for(let i=0;i<await filters.count();i++){await filters.nth(i).click();await expect(filters.nth(i)).toHaveAttribute('aria-pressed','true')}
  }
  await page.goto('/projects')
  const selects=page.getByRole('combobox')
  for(let i=0;i<await selects.count();i++){
    await selects.nth(i).click();const names=await page.getByRole('option').allTextContents();await page.keyboard.press('Escape')
    for(const name of names){await selects.nth(i).click();await page.getByRole('option',{name,exact:true}).click();await expect(selects.nth(i)).toContainText(name)}
  }
  await page.getByRole('button',{name:'Collapse sidebar'}).click()
  await expect(page.getByRole('link',{name:'Timeline',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Expand sidebar'}).click()
  await page.getByRole('button',{name:'Portfolio workspace'}).click()
  await page.getByRole('menuitem',{name:'Scale Control Field Trial',exact:true}).click()
  await expect(page).toHaveURL(/scf-004$/)
  await page.getByRole('button',{name:'Profile menu'}).click()
  await page.getByRole('menuitem',{name:'Account Settings'}).click()
  await expect(page).toHaveURL(/settings$/)
  await page.getByRole('button',{name:'Profile menu'}).click()
  await page.getByRole('menuitem',{name:'Switch Role'}).click()
  await expect(page.getByRole('button',{name:'Enter Workspace'})).toBeVisible()
})
test('all issue status options and unknown routes are handled',async({page})=>{
  await page.goto('/issues')
  await page.getByRole('button',{name:'View',exact:true}).first().click()
  const select=page.getByRole('dialog').getByRole('combobox')
  await select.click();const names=await page.getByRole('option').allTextContents();await page.keyboard.press('Escape')
  for(const name of names){await select.click();await page.getByRole('option',{name,exact:true}).click();await expect(select).toContainText(name)}
  await page.keyboard.press('Escape')
  await page.goto('/projects/missing-project')
  await expect(page.getByRole('heading',{name:'This page isn’t available'})).toBeVisible()
  await page.getByRole('link',{name:'Back to Projects'}).click()
  await expect(page).toHaveURL(/projects$/)
  await page.goto('/missing-route')
  await expect(page.getByRole('heading',{name:'This page isn’t available'})).toBeVisible()
})
