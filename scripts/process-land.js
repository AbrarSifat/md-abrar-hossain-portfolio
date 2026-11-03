const fs = require('fs');
const path = require('path');

const geojsonPath = path.join(__dirname, '../land.geojson');
const raw = fs.readFileSync(geojsonPath, 'utf8');
const geojson = JSON.parse(raw);

// Standard Point-in-Polygon (ray-casting)
function pointInPolygon(point, vs) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function pointInMultiPolygon(point, multiPoly) {
  for (const poly of multiPoly) {
    // poly[0] is exterior ring, poly[1..] are interior rings (holes)
    if (pointInPolygon(point, poly[0])) {
      let inHole = false;
      for (let h = 1; h < poly.length; h++) {
        if (pointInPolygon(point, poly[h])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

function isLand(lon, lat) {
  const pt = [lon, lat];
  for (const f of geojson.features) {
    const geom = f.geometry;
    if (geom.type === 'Polygon') {
      if (pointInPolygon(pt, geom.coordinates[0])) {
        let inHole = false;
        for (let h = 1; h < geom.coordinates.length; h++) {
          if (pointInPolygon(pt, geom.coordinates[h])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    } else if (geom.type === 'MultiPolygon') {
      if (pointInMultiPolygon(pt, geom.coordinates)) return true;
    }
  }
  return false;
}

// Generate an evenly spaced grid of points on the sphere
// Using Fibonacci sphere or latitude/longitude grid with cosine weighting
const R = 1.32;
const landPoints = [];
const numSamples = 6000;
const golden = (1 + Math.sqrt(5)) / 2;

for (let i = 0; i < numSamples; i++) {
  const theta = (2 * Math.PI * i) / golden;
  const phi = Math.acos(1 - (2 * (i + 0.5)) / numSamples);
  
  // Convert spherical (phi, theta) to lat, lon in degrees
  const lat = 90 - (phi * 180 / Math.PI);
  let lon = ((theta * 180 / Math.PI) % 360);
  if (lon > 180) lon -= 360;
  
  if (isLand(lon, lat)) {
    // Convert to Three.js coordinates
    // Using standard mapping where lat 90 is +Y, lon 0 faces camera
    const radLat = lat * Math.PI / 180;
    const radLon = lon * Math.PI / 180;
    
    // Geographical mapping to Three.js:
    // phi: angle from north pole (90 - lat)
    // theta: longitude angle
    const p = (90 - lat) * (Math.PI / 180);
    const th = (lon + 180) * (Math.PI / 180);
    const x = -(R * Math.sin(p) * Math.cos(th));
    const z = R * Math.sin(p) * Math.sin(th);
    const y = R * Math.cos(p);
    
    landPoints.push(Number(x.toFixed(4)), Number(y.toFixed(4)), Number(z.toFixed(4)));
  }
}

console.log(`Generated ${landPoints.length / 3} land stipple points from Natural Earth GeoJSON`);

const outPath = path.join(__dirname, '../src/data/land-points.json');
fs.writeFileSync(outPath, JSON.stringify(landPoints));
console.log(`Wrote to ${outPath}`);
