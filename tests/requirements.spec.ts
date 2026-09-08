import { test, expect, type Page } from '@playwright/test'

const roles = { 'project-manager':'Project Manager',technical:'Technical / Lab',operations:'Operations',procurement:'Procurement / Logistics',commercial:'Commercial',management:'Management',admin:'Admin' }
async function role(page: Page,key: keyof typeof roles) {
  await page.goto('/')
  await page.getByRole('button',{name:new RegExp('^'+roles[key])}).click()
  await page.getByRole('button',{name:'Enter Workspace'}).click()
  await expect(page.getByRole('heading',{level:1})).toBeVisible()
}

test('permissions follow the seven-role requirement matrix',async({page})=>{
  test.setTimeout(120000)
  for(const key of Object.keys(roles) as (keyof typeof roles)[]){
    await role(page,key)
    await page.goto('/changes/cr-003')
    const approve=page.getByRole('button',{name:'Approve Change',exact:true})
    if(key==='project-manager') await expect(approve).toBeEnabled();else await expect(approve).toBeDisabled()
    await expect(page.getByRole('button',{name:'Update Assessment',exact:true})).toHaveCount(['technical','operations','procurement','commercial'].includes(key)?1:0)
    await page.goto('/technical')
    await page.locator('main [data-slot="card-content"] > button').first().click()
    const select=page.getByRole('dialog').getByRole('combobox')
    if(key==='technical') await expect(select).toBeEnabled();else await expect(select).toBeDisabled()
    await page.keyboard.press('Escape')
    await page.goto('/projects')
    await expect(page.getByRole('button',{name:'Create Project',exact:true})).toHaveCount(['project-manager','admin'].includes(key)?1:0)
    await page.goto('/admin/users')
    await expect(page.getByRole('heading',{level:1})).toHaveText(key==='admin'?'Users & Roles':'This view belongs to another role')
  }
})

test('scope change passes through four specialists to PM and updates records',async({page})=>{
  test.setTimeout(90000)
  await role(page,'project-manager');await page.goto('/changes/cr-003')
  await page.getByRole('button',{name:'Begin Specialist Review'}).click()
  await expect(page.getByRole('button',{name:'Approve Change',exact:true})).toBeDisabled()
  for(const key of ['technical','procurement','operations','commercial'] as const){
    await role(page,key);await page.goto('/changes/cr-003')
    await page.getByRole('button',{name:'Update Assessment',exact:true}).click()
    await page.locator('#assessment-note').fill(`${roles[key]} reviewed the additional treatment scope.`)
    if(key==='operations')await page.locator('#assessment-impact').fill('3')
    if(key==='commercial')await page.locator('#assessment-impact').fill('18500')
    await page.getByRole('button',{name:'Complete Assessment'}).click()
  }
  await role(page,'project-manager');await page.goto('/changes/cr-003')
  await page.getByRole('button',{name:'Review Impact',exact:true}).click()
  await page.getByRole('button',{name:'Approve Change',exact:true}).click()
  await page.getByRole('button',{name:'Confirm Approval',exact:true}).click()
  await expect(page.getByText('Change approved',{exact:true})).toBeVisible()
  await page.goto('/actions');await expect(page.getByText('Update field execution plan for approved CR-003 scope',{exact:true})).toBeVisible()
  await page.goto('/activity')
  for(const key of ['technical','procurement','operations','commercial'])await expect(page.getByText(`Completed ${key} assessment for CR-003.`,{exact:false})).toBeVisible()
})

test('specialist execution and client confirmations reach project closure',async({page})=>{
  test.setTimeout(120000)
  for(const key of ['technical','operations','project-manager'] as const){
    await role(page,key);await page.goto('/technical')
    await expect(page.locator('main [data-slot="card-content"] > button').first()).toBeVisible()
    const stages=page.locator('main [data-slot="card-content"] > button')
    for(let i=0;i<await stages.count();i++){
      await stages.nth(i).click();const select=page.getByRole('dialog').getByRole('combobox');
      if(await select.isEnabled()){await select.click();await page.getByRole('option',{name:'Completed',exact:true}).click()}
      await page.keyboard.press('Escape')
    }
    await page.goto('/timeline')
    for(const name of key==='operations'?['Execution Readiness','Mobilization','Field Execution']:key==='technical'?['Performance Verification']:['Client Approval']){
      await page.getByRole('combobox',{name:`Status for ${name}`,exact:true}).click();await page.getByRole('option',{name:'Completed',exact:true}).click()
    }
  }
  for(const key of ['procurement','technical','operations','project-manager'] as const){
    await role(page,key);await page.goto('/issues')
    await expect(page.getByRole('button',{name:'View',exact:true}).first()).toBeVisible()
    for(const button of await page.getByRole('button',{name:'View',exact:true}).all()) {await button.click();const resolve=page.getByRole('button',{name:'Resolve',exact:true});if(await resolve.count() && await resolve.isEnabled())await resolve.click();else await page.keyboard.press('Escape')}
    await page.goto('/actions');await expect(page.getByRole('heading',{level:1})).toBeVisible()
    const complete=page.getByRole('button',{name:'Complete',exact:true}).and(page.locator(':enabled'))
    while(await complete.count())await complete.first().click()
  }
  for(const [key,steps] of [['technical',['Performance Documentation','Technical Completion Report']],['project-manager',['Client Review','Client Validation / Sign-Off']],['commercial',['Commercial Closure']],['project-manager',['Project Closure']]] as const){
    await role(page,key);await page.goto('/completion')
    for(const name of steps){const row=page.locator('li').filter({has:page.getByRole('heading',{name,exact:true})});await row.getByRole('button').click();await page.locator('#closeout-note').fill(`Confirmed ${name}; mocked reference QA-01.`);await page.getByRole('button',{name:'Confirm Completion'}).click()}
  }
  await page.reload();await expect(page.getByText('10 / 10',{exact:true})).toBeVisible()
  await page.goto('/projects/pwt-001');await expect(page.getByText('100%',{exact:true})).toBeVisible()
})

test('admin configuration and project creation stay mocked and save',async({page})=>{
  await role(page,'admin');await page.goto('/admin/statuses')
  await page.getByRole('textbox',{name:'Project Phases 1',exact:true}).fill('Contract Award Review')
  await page.getByRole('button',{name:'Save Configuration'}).click();await page.reload()
  await expect(page.getByRole('textbox',{name:'Project Phases 1',exact:true})).toHaveValue('Contract Award Review')
  await page.goto('/projects');await page.getByRole('button',{name:'Create Project'}).click()
  await page.locator('#name').fill('North Field Treatment Evaluation')
  await page.getByRole('button',{name:'Save Changes'}).first().click()
  await expect(page.getByText('Project details saved',{exact:true})).toBeVisible()
})

