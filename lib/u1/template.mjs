// Geometry only, measured against the supplied U1-15 three-page scan.
// Coordinates use a 922 × 1187 reference page. No sample values belong here.
export function templateFields() {
  const fields = [];
  const add = (id, label, section, page, x, y, w, h, table, row) => fields.push({ id, label, section, page, box: [x/922,y/1187,w/922,h/1187], ...(table ? {table,row} : {}) });
  const line = (id,label,section,page,x,y,w,h=19) => add(id,label,section,page,x,y,w,h);
  const grid = (prefix,section,page,table,rows,cols) => rows.forEach(([y,h],r)=>cols.forEach(([key,label,x,w])=>add(`${prefix}.${r+1}.${key}`,label,section,page,x,y,w,h,table,r+1)));
  const g='General information';
  line('manufacturer','Manufacturer',g,1,207,76,655,23);
  line('manufacturerAddress','Manufacturer address',g,1,207,76,655,23);
  line('purchaser','Purchaser',g,1,150,105,710,21);
  line('purchaserAddress','Purchaser address',g,1,150,105,710,21);
  line('installation','Installation location',g,1,177,133,685,23);
  line('orientation','Orientation',g,1,93,165,162);
  line('vesselType','Vessel type',g,1,292,165,314);
  line('serial','Serial number',g,1,615,165,244);
  line('crn','CRN',g,1,63,199,193,21);
  line('drawing','Drawing number',g,1,260,199,307,21);
  line('nationalBoard','National Board number',g,1,570,199,134,21);
  line('year','Year built',g,1,707,199,152,21);
  line('asme','ASME section / division',g,1,59,231,175,21);
  line('edition','Edition / addenda',g,1,244,231,235,21);
  line('codeCase','Code case',g,1,490,231,216,21);
  line('specialService','Special service',g,1,713,231,146,21);
  const shellCols=[['course','Course',37,23],['diameter','Diameter',61,79],['length','Length',141,76],['material','Material',218,114],['thickness','Nominal thickness',334,65],['corrosion','Corrosion allowance',401,62],['longType','Longitudinal joint type',465,27],['longExam','Longitudinal examination',494,73],['longEfficiency','Longitudinal efficiency',570,25],['circType','Circumferential joint type',598,25],['circExam','Circumferential examination',625,72],['circEfficiency','Circumferential efficiency',700,42],['heatTemp','Heat treatment temperature',746,52],['heatTime','Heat treatment time',801,52]];
  line('shell.courses','Number of courses','Shell',1,218,288,56,20);
  line('shell.length','Overall length','Shell',1,500,288,248,21);
  grid('shell','Shell',1,'Shell courses',[[346,16],[364,16]],shellCols);
  line('inner.courses','Number of courses','Inner chamber · shell',2,203,96,69,18);
  line('inner.length','Overall length','Inner chamber · shell',2,489,96,259,20);
  grid('inner','Inner chamber · shell',2,'Shell courses',[[151,17]],shellCols.map(([k,l,x,w])=>[k,l,x+(x<330?3:0),w]));
  const flangeCols=[['number','Number',36,29],['type','Type',68,72],['id','ID',143,43],['od','OD',189,41],['thickness','Flange thickness',235,36],['hub','Hub thickness',274,68],['material','Material',346,93],['attachment','Attachment',443,55],['location','Location',502,55],['bolting','Bolting quantity & size',561,76],['boltMaterial','Bolting material',640,63],['washer','Washer information',707,77],['washerMaterial','Washer material',788,66]];
  grid('bodyFlange','Body flanges',1,'Shell body flanges',[[440,16]],flangeCols);
  grid('innerFlange','Inner chamber · flanges',2,'Shell body flanges',[[231,17]],flangeCols);
  const headCols=[['location','Location',62,76],['thickness','Minimum thickness',141,58],['corrosion','Corrosion allowance',201,59],['crown','Crown radius',263,78],['knuckle','Knuckle radius',344,53],['ratio','Elliptical ratio',400,49],['angle','Conical angle',452,55],['radius','Hemispherical radius',510,69],['diameter','Flat diameter',582,44],['convex','Convex',630,32],['concave','Concave',665,33],['category','Category A joint type',701,49],['jointType','Joint examination',753,76],['efficiency','Joint efficiency',832,23]];
  line('head.material.a','Head (a) material / heat treatment','Heads',1,115,460,319,21);
  line('head.material.b','Head (b) material / heat treatment','Heads',1,557,460,298,21);
  grid('head','Heads',1,'Heads',[[528,16],[547,16]],headCols);
  line('innerHead.material.a','Head (a) material / heat treatment','Inner chamber · heads',2,111,251,321,20);
  line('innerHead.material.b','Head (b) material / heat treatment','Inner chamber · heads',2,551,251,301,20);
  grid('innerHead','Inner chamber · heads',2,'Heads',[[318,20]],headCols);
  const hf=[['location','Location',62,56],['type','Type',121,61],['id','ID',186,45],['od','OD',235,44],['thickness','Flange thickness',283,57],['hub','Hub thickness',344,51],['material','Material',400,77],['attachment','Attachment',481,83],['bolting','Bolting quantity & size',568,76],['boltMaterial','Bolting material',649,65],['washer','Washer information',719,57],['washerMaterial','Washer material',780,75]];
  grid('headFlange','Body flanges',1,'Head body flanges',[[625,16]],hf);
  grid('innerHeadFlange','Inner chamber · flanges',2,'Head body flanges',[[400,17]],hf);
  line('jacket.type','Jacket type','Shell',1,129,650,338);
  line('jacket.closure','Jacket closure','Shell',1,549,650,307);
  line('jacket.details','Jacket details','Shell',1,318,683,537);
  const pressure = (prefix,section,page,dy) => {
    line(prefix+'.mawp','MAWP / internal pressure',section,page,94,708+dy,89,20);
    line(prefix+'.external','External pressure',section,page,196,708+dy,91,20);
    line(prefix+'.temperature','Maximum internal temperature',section,page,355,708+dy,88,20);
    line(prefix+'.externalTemp','Maximum external temperature',section,page,455,708+dy,89,20);
    line(prefix+'.mdmt','Minimum design metal temperature',section,page,675,708+dy,85,20);
    line(prefix+'.mdmtPressure','MDMT pressure',section,page,779,708+dy,76,20);
    line(prefix+'.impact','Impact test status',section,page,122,738+dy,557,18);
    line(prefix+'.impactTemp','Impact test temperature',section,page,801,738+dy,53,18);
    line(prefix+'.test','Test type and pressure',section,page,219,768+dy,123,18);
    line(prefix+'.proof','Proof test',section,page,410,768+dy,443,18);
  };
  pressure('design','Pressure / design',1,0);
  // Inner chamber values have different baselines and widths.
  [['mawp','MAWP / internal pressure',102,91],['external','External pressure',203,57],['temperature','Maximum internal temperature',346,87],['externalTemp','Maximum external temperature',447,85],['mdmt','Minimum design metal temperature',662,93],['mdmtPressure','MDMT pressure',780,75]].forEach(([k,l,x,w])=>line('innerDesign.'+k,l,'Inner chamber · pressure',2,x,451,w,20));
  line('innerDesign.impact','Impact test status','Inner chamber · pressure',2,124,496,549,19);
  line('innerDesign.impactTemp','Impact test temperature','Inner chamber · pressure',2,800,496,57,19);
  line('innerDesign.test','Test type and pressure','Inner chamber · pressure',2,272,532,162,19);
  line('innerDesign.proof','Proof test','Inner chamber · pressure',2,503,532,340,19);
  const tubeCols=[['material','Material',111,226],['diameter','Diameter',342,142],['thickness','Nominal thickness',490,104],['corrosion','Corrosion allowance',603,99],['attachment','Attachment',711,145]];
  grid('tubesheet','Tubesheets / tubes',1,'Tubesheets (stationary / floating)',[[807,17],[843,17]],tubeCols);
  grid('tube','Tubesheets / tubes',1,'Tubes',[[878,17]],[['material','Material',109,227],['od','Tube OD',342,142],['thickness','Tube thickness',490,104],['number','Number of tubes',603,99],['type','Tube type',711,145]]);
  grid('nozzle','Nozzles / openings',2,'Nozzles / openings',[[607,16],[625,16],[642,16],[660,16],[677,16]],[['purpose','Purpose',33,109],['number','Number',145,33],['size','Size',182,67],['type','Type',252,56],['material','Nozzle material',312,76],['flangeMaterial','Flange material',392,76],['thickness','Thickness',472,40],['corrosion','Corrosion allowance',516,39],['reinforcement','Reinforcement material',559,85],['attachment','Nozzle attachment',648,52],['flangeAttachment','Flange attachment',704,55],['location','Location',763,90]]);
  [['skirt','Skirt',150,46],['lugs','Lugs',235,57],['legs','Legs',338,74],['other','Other support',460,164],['attachment','Attachment method',705,148]].forEach(([k,l,x,w])=>line('supports.'+k,l,'Supports',2,x,715,w,19));
  line('notes','Supporting notes / partial data reports','Remarks',2,45,781,810,19);
  line('remarks','Remarks','Remarks',2,44,815,810,72);
  const c='Certification';
  line('cert.shopCertificate','Shop compliance · authorization number',c,3,632,109,55,23);
  line('cert.shopExpiry','Shop compliance · expires',c,3,744,109,94,23);
  line('cert.shopDate','Shop compliance · date',c,3,84,129,94,26);
  line('cert.manufacturer','Shop compliance · manufacturer',c,3,231,129,369,27);
  line('cert.representative','Shop compliance · representative',c,3,654,129,187,29);
  line('cert.employer','Shop inspection · inspector employer',c,3,48,211,791,21);
  line('cert.inspectedOn','Shop inspection · inspection date',c,3,480,232,142,21);
  line('cert.inspectionDate','Shop inspection · signature date',c,3,100,326,99,22);
  line('cert.inspector','Shop inspection · authorized inspector',c,3,256,312,201,39);
  line('cert.commission','Shop inspection · commission details',c,3,548,326,295,24);
  line('cert.fieldCertificate','Field assembly compliance · authorization number',c,3,633,398,55,24);
  line('cert.fieldExpiry','Field assembly compliance · expires',c,3,733,398,107,24);
  line('cert.fieldDate','Field assembly compliance · date',c,3,73,432,96,20);
  line('cert.assembler','Field assembly compliance · assembler',c,3,226,432,345,22);
  line('cert.fieldRepresentative','Field assembly compliance · representative',c,3,653,432,192,22);
  line('cert.fieldEmployer','Field assembly inspection · inspector employer',c,3,38,525,799,12);
  line('cert.fieldExceptions','Field assembly inspection · exceptions',c,3,39,548,191,10);
  line('cert.fieldTest','Field assembly inspection · hydrostatic test',c,3,544,580,91,11);
  line('cert.fieldInspectionDate','Field assembly inspection · date',c,3,94,658,102,20);
  line('cert.fieldInspector','Field assembly inspection · authorized inspector',c,3,256,658,198,20);
  line('cert.fieldCommission','Field assembly inspection · commission details',c,3,538,658,302,21);
  // Separate structured fields retain the same printed source cell.
  for(const field of [...fields]) {
    if(field.id.endsWith('.bolting')) {
      fields.push({...field,id:field.id.replace('.bolting','.boltQuantity'),label:'Bolting quantity'});
      fields.push({...field,id:field.id.replace('.bolting','.boltSize'),label:'Bolting size'});
    }
    if(field.id.endsWith('Design.test')||field.id==='design.test') {
      fields.push({...field,id:field.id.replace('.test','.testPressure'),label:'Test pressure'});
      fields.push({...field,id:field.id.replace('.test','.testType'),label:'Hydro / pneumatic / combined'});
    }
  }
  return fields;
}
