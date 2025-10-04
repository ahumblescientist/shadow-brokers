/**
 * @typedef {import('leaflet')} L
 * @typedef {import('leaflet.heat')} HeatLayer
 */


var map = L.map('map', {
  center: [20, 0], 
  zoom: 2,
  maxBoundsViscosity: 0.8,
  minZoom : 1,
  fullscreenControl: true
});

// Standard tiles
L.tileLayer('https://api.maptiler.com/maps/streets-v2-dark/{z}/{x}/{y}.png?key=y8paSDcnb3DXXFDZKHtm', {
  attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>'
}).addTo(map);

// Limit panning so you can’t drag too far north/south
map.setMaxBounds([
  [-85, -180], // southwest corner
  [85,  180]   // northeast corner
]);



let currentHeat = null; 
prob_r = 6;

function loadHeatmap(jsonPath, format, rad) {
  fetch(jsonPath)
    .then(res => res.json())
    .then(data => {
      let mult = 1; 
      let adder = 0;
      if(format == "chlor_a") mult = 5;
      if(format=="sss") mult = 1/40;
      if(format=="sla") adder += 1;
      const heatPoints = data.map(d => [d.lat, d.lon, mult*eval("d."+format) + adder]);

      // remove old layer completely
      if (currentHeat) {
        map.removeLayer(currentHeat);
        console.log("worked");
        currentHeat = null;
      }

      // create new heatmap fresh
      currentHeat = L.heatLayer(heatPoints, {
        radius: rad,
        blur: 5,
        maxZoom: 6,
        gradient: {
          0.2: 'blue',
          0.4: 'cyan',
          0.6: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      });
      currentHeat.addTo(map); // add after creatio
    })
    .catch(err => console.error("Error loading heatmap data:", err));
}


// load default (overall probability) on first load
loadHeatmap('data/prob.json', 'prob', prob_r);

// hook buttons
document.getElementById("pills-Edian-tab").addEventListener("click", () => {
  loadHeatmap("data/prob.json", "prob", prob_r);
});

document.getElementById("pills-SST-tab").addEventListener("click", () => {
  loadHeatmap("data/sst.json", "sst", 3.3);
});

document.getElementById("pills-CLOR-tab").addEventListener("click", () => {
  loadHeatmap("data/chlor.json", "chlor_a", 4);
});

document.getElementById("pills-SSS-tab").addEventListener("click", () => {
  loadHeatmap("data/sss.json", "sss", 3.5);
});

document.getElementById("pills-SSH-tab").addEventListener("click", () => {
  loadHeatmap("data/sla.json", "sla", 4);
});


map.on('click', function(e) {
  if (!lastData || lastData.length === 0) {
    console.log("No data loaded.");
    return;
  }

  const { lat, lng } = e.latlng;
  
  let nearest = null;
  let minDist = Infinity;
  lastData.forEach(point => {
    let dLat = lat - point[0];
    let dLng = lng - point[1];
    let dist = dLat*dLat + dLng*dLng;
    if (dist < minDist) {
      minDist = dist;
      nearest = point;
    }
  });

  if (nearest) {
    let probability = nearest[2];
    console.log(`Clicked at ${lat.toFixed(3)}, ${lng.toFixed(3)} → Probability = ${probability.toFixed(4)}`);

    // also update your little output box
    const out = document.getElementById("prob-result");
    if (out) out.textContent = (probability * 100).toFixed(2) + "%";
  }
});



