// Sample IU Campus Bus live passenger loads (public ETA Spot feed) into a
// per-day JSONL. Powers BeeLine's future "how full is this bus usually"
// odds — empirical, per stop/route/time, always shown with sample counts.
const r = await fetch('https://iucbs.etaspot.net/service.php?service=get_vehicles&token=TESTING', {
  headers: { 'User-Agent': 'BeeLineCrowdLogger/1.0 (occupancy research; low-frequency sampling)' },
});
if (!r.ok) { console.log('feed http', r.status); process.exit(0); }
const j = await r.json();
const vehicles = (j.get_vehicles || []).filter(v => v.receiveTime && (v.inService === 1 || v.load > 0 || v.scheduleNumber !== 'NIS'));
if (!vehicles.length) { console.log('no active vehicles'); process.exit(0); }
const now = new Date();
const rows = vehicles.map(v => JSON.stringify({
  t: now.toISOString().slice(0, 16), vid: v.equipmentID, rt: v.routeID,
  load: v.load, cap: v.capacity, next: v.nextStopID, last: v.lastStopID,
  eta: v.nextStopETA, insvc: v.inService, sched: v.scheduleNumber,
  lat: v.lat, lng: v.lng, h: v.h,
})).join('\n') + '\n';
const fs = await import('node:fs');
fs.mkdirSync('data', { recursive: true });
const f = `data/${now.toISOString().slice(0, 10)}.jsonl`;
fs.appendFileSync(f, rows);
console.log(`${vehicles.length} vehicles → ${f}`);
