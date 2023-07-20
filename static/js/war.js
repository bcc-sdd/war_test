var latlngs = [L.latLng(40, -20), L.latLng(-40, 150)];

function sign(x) {
  return typeof x === "number" ? (x ? (x < 0 ? -1 : 1) : 0) : NaN;
}

function isCrossMeridian(latLngA, latLngB) {
  // Returns true if the signs are not the same.
  return sign(latLngA.lng) * sign(latLngB.lng) < 0;
}

function isDrawAntimeridian(latLngA1, latLngA2, latLngB1, latLngB2) {
    return Math.abs(latLngA1.lng - latLngB1.lng) >= 180
  var meas1 =
    (latLngA2.distanceTo(latLngA1) + latLngB2.distanceTo(latLngB1)) / 1000;
  var meas2 = latLngA1.distanceTo(latLngB1) / 1000;
  console.log(`ANTIMER ${meas1}, ACROSS${meas2}`);
  return (
    meas1 < meas2 &&
    isCrossMeridian(latLngA1, latLngB1)
  );
}

function calculateAntimeridianLat(latLngA, latLngB) {
  if (latLngA.lat > latLngB.lat) {
    var temp = latLngA;
    latLngA = latLngB;
    latLngB = temp;
  }
  var A = 360 - Math.abs(latLngA.lng - latLngB.lng);
  var B = latLngB.lat - latLngA.lat;
  var a = Math.abs(180 - Math.abs(latLngA.lng));
  return latLngA.lat + (B * a) / A;
}

var isCrossMeridianVar = isCrossMeridian(latlngs[0], latlngs[1]);
var new_lat = calculateAntimeridianLat(latlngs[0], latlngs[1]);
var isWestward = latlngs[0].lng > latlngs[1].lng
var new_latlng1 = L.latLng(new_lat, isWestward ? 180 : -180);
var new_latlng2 = L.latLng(new_lat, isWestward ? -180 : 180);
console.log(
  isDrawAntimeridian(latlngs[0], new_latlng1, latlngs[1], new_latlng2)
);

document.addEventListener("DOMContentLoaded", function () {
  function initMap() {
    var maxBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

    map = L.map("map", {
      minZoom: 2,
      maxZoom: 6,
      maxBounds: maxBounds,
    }).setView([30, 0], 2);
    // var map = L.map('map').setView([51.505, -0.09], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(map);

    // updateAssets(); // Call the function once to initialize the assets
    // setInterval(updateAssets, 1000); // Update assets every second
    if (isDrawAntimeridian(latlngs[0], new_latlng1, latlngs[1], new_latlng2)) {
      var firstpolyline = new L.Polyline([latlngs[0], new_latlng1], {
        color: "red",
        weight: 1,
        smoothFactor: 1,
        //   noWrap: true,
      });

      firstpolyline.addTo(map);
      var secondpolyline = new L.Polyline([latlngs[1], new_latlng2], {
        color: "red",
        weight: 1,
        smoothFactor: 1,
        //   noWrap: true,
      });

      secondpolyline.addTo(map);
    } else {
      var firstpolyline = new L.Polyline(latlngs, {
        color: "red",
        weight: 1,
        smoothFactor: 1,
        //   noWrap: true,
      });

      firstpolyline.addTo(map);
    }
  }
  initMap();
  var popup = L.popup();

  var circle = L.circle([51.508, -0.11], {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.5,
    radius: 500000,
  }).addTo(map);
  function onMapClick(e) {
    // var x = L.latLng(0, 170);
    // var polyline = L.polyline(latlngs, { color: "red", weight: 1 });
    // polyline.addTo(map);
    // popup
    //   .setLatLng(e.latlng)
    //   .setContent(`${e.latlng.toString()}. ${e.latlng.distanceTo(x) / 1000} km`)
    //   .openOn(map);
    // console.log(polyline);
  }

  map.on("click", onMapClick);

  var pointA = new L.LatLng(90, 180.0);
  var pointB = new L.LatLng(-90, 180.0);
  var pointList = [pointA, pointB];
  var idl = new L.polyline(pointList, {
    color: "green",
    weight: 1,
    opacity: 0.5,
    smoothFactor: 1,
    noWrap: false,
  });
  idl.addTo(map);
  var pointA = new L.LatLng(90, -180.0);
  var pointB = new L.LatLng(-90, -180.0);
  var pointList = [pointA, pointB];
  var idl2 = new L.polyline(pointList, {
    color: "green",
    weight: 1,
    opacity: 0.5,
    smoothFactor: 1,
    noWrap: false,
  });
  idl2.addTo(map);
});
