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
  'shell.1.diameter':'48.0 IN','shell.1.material':'SA516-60','shell.1.thickness':'0.750','design.mawp':'225 psi','design.mdmt':'-35 F','design.test':'Hydro at 293 PSI','tube.1.number':'480','tube.1.material':'SA179',
  'innerDesign.mawp':'300 psi','nozzle.1.material':'SA312','nozzle.1.size':'12','nozzle.1.number':'4','nozzle.3.thickness':'0.500',
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
const result=await extract(captured,event=>console.log(event.message))
await writeFile('tmp/u1-tests/image-result.json',JSON.stringify(result,null,2))
const normalize=value=>value.replace(/\s/g,'').toUpperCase(),expected={...changes,manufacturer:'ATLAS VESSELS LTD',manufacturerAddress:'18 DOCK ROAD'},failures=[]
for(const [id,value] of Object.entries(expected)){
  const field=result.fields.find(field=>field.id===id)
  if(normalize(field?.value??'')!==normalize(value))failures.push(`${id}: expected ${value}, got ${field?.value||'(blank)'}`)
}
console.log(JSON.stringify({checked:Object.keys(expected).length,failures},null,2))
assert.equal(failures.length,0,'Screenshot and camera extraction must retain every tested field and table value.')
