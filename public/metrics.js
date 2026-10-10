export function validate(data) {
 if (!Array.isArray(data) || !data.length || data.length > 10000) throw Error('Un tableau de 1 à 10 000 essais est requis.');
 const ids=new Set();
 for (const r of data) {
  if (!r || typeof r !== 'object' || typeof r.id !== 'string' || !r.id || ids.has(r.id)) throw Error('Chaque essai doit avoir un id texte unique.');
  ids.add(r.id);
  if (!['calibration','stability','framing'].includes(r.protocol)) throw Error('Protocole inconnu.');
  if (typeof r.model !== 'string' || !r.model || typeof r.condition !== 'string' || !r.condition) throw Error('model et condition sont requis.');
  if (r.protocol==='calibration' && (!Number.isFinite(r.confidence)||r.confidence<0||r.confidence>1||![0,1].includes(r.correct))) throw Error('Calibration : confidence entre 0 et 1, correct égal à 0 ou 1.');
  if (r.protocol!=='calibration' && (typeof r.pair !== 'string'||!r.pair||typeof r.claim !== 'boolean')) throw Error('Comparaisons : pair texte et claim booléen requis.');
 }
 return data;
}
export function summarize(input) {
 const data=validate(input), cal=data.filter(r=>r.protocol==='calibration');
 const groups=new Map();
 for(const r of data.filter(r=>r.protocol!=='calibration')) {const key=JSON.stringify([r.protocol,r.model,r.pair]);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
 const pairs={stability:[],framing:[]}; let excluded=0;
 for(const rows of groups.values()) {if(rows.length!==2||rows[0].condition===rows[1].condition){excluded++;continue;} pairs[rows[0].protocol].push(rows[0].claim!==rows[1].claim);}
 const rate=a=>a.length?a.filter(Boolean).length/a.length:null;
 return {schemaVersion:1,n:data.length,calibration:{n:cal.length,accuracy:cal.length?cal.reduce((s,r)=>s+r.correct,0)/cal.length:null,brier:cal.length?cal.reduce((s,r)=>s+(r.confidence-r.correct)**2,0)/cal.length:null},stability:{pairs:pairs.stability.length,disagreement:rate(pairs.stability)},framing:{pairs:pairs.framing.length,disagreement:rate(pairs.framing)},excludedPairs:excluded,interpretation:'Mesures descriptives du comportement verbal. Aucune inférence de conscience ni accès vérifié aux états internes.'};
}
