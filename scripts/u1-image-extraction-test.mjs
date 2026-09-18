import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {createCanvas,loadImage} from '@napi-rs/canvas'
import sharp from 'sharp'
import {prepareFile,extract,pagePath} from '../lib/u1/engine.mjs'
import {templateFields} from '../lib/u1/template.mjs'

await mkdir('tmp/u1-tests',{recursive:true})
const sourcePages=await prepareFile(await readFile('public/reference-u1.pdf'),'Image registration reference')
const changes={
  manufacturer:'ATLAS VESSELS LTD, 18 DOCK ROAD',serial:'HX-8842',nationalBoard:'98216',year:'2024',drawing:'DWG-771',installation:'PORT TERMINAL',
  'shell.length':`31' 4.5"`,'shell.1.diameter':'48.0 IN','shell.1.material':'SA516-60','shell.1.thickness':'0.750','shell.1.longExam':'Spot RT','shell.1.circExam':'Full RT','shell.1.heatTemp':'1125 F','shell.1.heatTime':'1.5 HR','bodyFlange.1.boltMaterial':'SA193-B7','bodyFlange.1.washerMaterial':'SA516-70','design.mawp':'225 psi','design.mdmt':'-35 F','design.test':'Hydro at 293 PSI','tube.1.number':'480','tube.1.material':'SA214',
  'innerDesign.mawp':'300 psi','inner.length':`2' 8.5"`,'inner.1.circEfficiency':'85','innerFlange.1.boltMaterial':'SA193-B8M','innerHead.1.knuckle':'3.0','innerHeadFlange.1.boltMaterial':'SA193-B8M','nozzle.1.material':'SA312','nozzle.1.size':'12','nozzle.1.number':'4','nozzle.1.reinforcement':'Pad','nozzle.2.attachmentDetails':'(c) Full pen','nozzle.3.thickness':'0.500','nozzle.4.size':'2.5"','remarks.1.text':'First nozzle remark',
  'cert.manufacturer':'ATLAS VESSELS LTD','cert.shopDate':'06/14/2024','cert.inspector':'JAMES CARTER','cert.commission':'NB 88219',
}
const captured=[]
for(let i=0;i<3;i++){
  const source=await loadImage(await readFile(pagePath(sourcePages[i].id))),page=createCanvas(source.width,source.height),pageContext=page.getContext('2d');pageContext.drawImage(source,0,0)
  for(const [id,value] of Object.entries(changes)){
    const field=templateFields().find(field=>field.id===id);if(field.page!==i+1)continue
    const [x,y,w,h]=field.box.map((n,index)=>n*(index%2?source.height:source.width))
    pageContext.fillStyle='white';pageContext.fillRect(x,y,w,h);pageContext.fillStyle='black';pageContext.font=`${Math.min(22,h*.65)}px Arial`;pageContext.textBaseline='middle';pageContext.fillText(value,x+4,y+h/2,w-8)
  }
  const frame=createCanvas(i===0?2800:2400,3200),context=frame.getContext('2d'),angle=[0,2.2,-1.6][i]*Math.PI/180,drawWidth=[1540,1760,1680][i],drawHeight=drawWidth*source.height/source.width
  context.fillStyle=['#555b60','#324139','#6a6865'][i];context.fillRect(0,0,frame.width,frame.height)
  context.translate(frame.width/2+[120,-60,90][i],frame.height/2+[40,-30,70][i]);context.rotate(angle);context.drawImage(page,-drawWidth/2,-drawHeight/2,drawWidth,drawHeight);context.resetTransform()
  if(i===1){const shade=context.createLinearGradient(0,0,frame.width,0);shade.addColorStop(0,'#00000022');shade.addColorStop(.55,'#00000000');shade.addColorStop(1,'#ffffff12');context.fillStyle=shade;context.fillRect(0,0,frame.width,frame.height)}
  const jpeg=await frame.encode('jpeg',82);await writeFile(`tmp/u1-tests/image-page-${i+1}.jpg`,jpeg)
  const [registered]=await prepareFile(jpeg,`Camera / screenshot page ${i+1}`),metadata=await sharp(await readFile(pagePath(registered.id))).metadata()
  assert.deepEqual([metadata.width,metadata.height],[1844,2374]);captured.push(registered)
}
// Browsers and mobile photo pickers do not guarantee selection order.
const shuffled=[captured[1],captured[2],captured[0]]
const result=await extract(shuffled,event=>console.log(event.message))
assert.deepEqual(result.pages.map(page=>page.name),captured.map(page=>page.name),'Image pages should be classified and restored to Form U-1 order.')
const pwht=result.fields.filter(field=>['shell.1.heatTemp','shell.1.heatTime'].includes(field.id))
assert.ok(pwht.every(field=>field.table==='Shell courses'&&field.row===1),'Related PWHT temperature and time must remain in the same source row.')
assert.ok(result.fields.filter(field=>['Review Required','Not Detected'].includes(field.status)).every(field=>field.lowConfidenceReason),'Every uncertain field must explain why review is needed.')
await writeFile('tmp/u1-tests/image-result.json',JSON.stringify(result,null,2))
const normalize=value=>value.replace(/\s/g,'').toUpperCase(),expected={...changes,'design.mdmt':'-35 °F','shell.1.heatTemp':'1125 °F',manufacturer:'ATLAS VESSELS LTD',manufacturerAddress:'18 DOCK ROAD'},failures=[]
for(const [id,value] of Object.entries(expected)){
  const field=result.fields.find(field=>field.id===id)
  if(normalize(field?.value??'')!==normalize(value))failures.push(`${id}: expected ${value}, got ${field?.value||'(blank)'}`)
}
console.log(JSON.stringify({checked:Object.keys(expected).length,failures},null,2))
assert.ok(!result.fields.some(field=>/\.bolt(?:Quantity|Size)$|\.flangeAttachment$/.test(field.id)),'Obsolete split bolting and attachment fields must be absent.')
assert.equal(failures.length,0,'Screenshot and camera extraction must retain every tested field and table value.')
