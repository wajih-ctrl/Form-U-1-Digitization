import sharp from 'sharp'

const TARGET_WIDTH=1844,TARGET_HEIGHT=2374

function paperComponent(data,width,height,channels){
  const size=width*height,light=new Uint8Array(size),seen=new Uint8Array(size),queue=new Int32Array(size),components=[]
  for(let i=0;i<size;i++){
    const at=i*channels,r=data[at],g=data[at+1],b=data[at+2],max=Math.max(r,g,b),min=Math.min(r,g,b),luma=.2126*r+.7152*g+.0722*b
    light[i]=luma>142&&max-min<72?1:0
  }
  for(let start=0;start<size;start++){
    if(!light[start]||seen[start])continue
    let head=0,tail=0,count=0,minX=width,maxX=0,minY=height,maxY=0
    queue[tail++]=start;seen[start]=1
    while(head<tail){
      const index=queue[head++],x=index%width,y=(index/width)|0
      count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)
      if(x&&light[index-1]&&!seen[index-1]){seen[index-1]=1;queue[tail++]=index-1}
      if(x+1<width&&light[index+1]&&!seen[index+1]){seen[index+1]=1;queue[tail++]=index+1}
      if(y&&light[index-width]&&!seen[index-width]){seen[index-width]=1;queue[tail++]=index-width}
      if(y+1<height&&light[index+width]&&!seen[index+width]){seen[index+width]=1;queue[tail++]=index+width}
    }
    const boxWidth=maxX-minX+1,boxHeight=maxY-minY+1,boxArea=boxWidth*boxHeight,ratio=boxWidth/boxHeight,fill=count/boxArea,coverage=boxArea/size
    if(coverage<.12||ratio<.45||ratio>1.15||fill<.42)continue
    const topEdge=new Int32Array(boxWidth);topEdge.fill(height);const bottomEdge=new Int32Array(boxWidth);bottomEdge.fill(-1)
    for(let i=0;i<tail;i++){const index=queue[i],x=index%width-minX,y=(index/width)|0;topEdge[x]=Math.min(topEdge[x],y);bottomEdge[x]=Math.max(bottomEdge[x],y)}
    const edgeSlope=edge=>{
      let n=0,sx=0,sy=0,sxx=0,sxy=0
      for(let x=Math.floor(boxWidth*.08);x<Math.ceil(boxWidth*.92);x++){const y=edge[x];if(y<0||y>=height)continue;n++;sx+=x;sy+=y;sxx+=x*x;sxy+=x*y}
      return n>2?(n*sxy-sx*sy)/(n*sxx-sx*sx):0
    }
    const deviation=Math.atan((edgeSlope(topEdge)+edgeSlope(bottomEdge))/2)*180/Math.PI
    const aspectScore=Math.max(.15,1-Math.abs(ratio-TARGET_WIDTH/TARGET_HEIGHT)),score=coverage*fill*aspectScore
    components.push({minX,maxX,minY,maxY,deviation,score,coverage})
  }
  return components.sort((a,b)=>b.score-a.score)[0]
}

async function detectPage(buffer){
  const {data,info}=await sharp(buffer).resize({width:420,height:540,fit:'inside',withoutEnlargement:true}).removeAlpha().raw().toBuffer({resolveWithObject:true})
  const component=paperComponent(data,info.width,info.height,info.channels)
  if(!component)return null
  return {
    left:component.minX/info.width,top:component.minY/info.height,
    right:(component.maxX+1)/info.width,bottom:(component.maxY+1)/info.height,
    angle:Math.abs(component.deviation)<=8?component.deviation:0,
    coverage:component.coverage,
  }
}

export async function normalizePageImage(input){
  let buffer=await sharp(input,{limitInputPixels:45000000}).rotate().flatten({background:'#fff'}).png().toBuffer()
  let detection=await detectPage(buffer)
  if(detection&&Math.abs(detection.angle)>.35){
    buffer=await sharp(buffer).rotate(-detection.angle,{background:'#303532'}).png().toBuffer()
    detection=await detectPage(buffer)
  }
  const metadata=await sharp(buffer).metadata()
  let pipeline=sharp(buffer)
  if(detection){
    const padX=(detection.right-detection.left)*.0015,padY=(detection.bottom-detection.top)*.0015
    const left=Math.max(0,detection.left-padX),top=Math.max(0,detection.top-padY),right=Math.min(1,detection.right+padX),bottom=Math.min(1,detection.bottom+padY)
    const extract={left:Math.floor(left*metadata.width),top:Math.floor(top*metadata.height),width:Math.max(1,Math.ceil((right-left)*metadata.width)),height:Math.max(1,Math.ceil((bottom-top)*metadata.height))}
    extract.width=Math.min(extract.width,metadata.width-extract.left);extract.height=Math.min(extract.height,metadata.height-extract.top)
    pipeline=pipeline.extract(extract)
  }
  return pipeline.resize({width:TARGET_WIDTH,height:TARGET_HEIGHT,fit:'fill'}).greyscale().normalize().sharpen({sigma:.6}).png().toBuffer({resolveWithObject:true})
}

export const pageTarget={width:TARGET_WIDTH,height:TARGET_HEIGHT}
