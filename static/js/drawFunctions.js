import Path from "./class_path.js";

var routeWeight = 0.2;

export function computePaths(latlngs0, latlngs1) {
    var new_lat = calculateAntimeridianLat(latlngs0, latlngs1);
    var isWestward = latlngs0.lng > latlngs1.lng;
    var new_latlng1 = L.latLng(new_lat, isWestward ? 180 : -180);
    var new_latlng2 = L.latLng(new_lat, isWestward ? -180 : 180);
    if (isDrawAntimeridian(latlngs0, new_latlng1, latlngs1, new_latlng2)) {
        var firstpolyline = new L.Polyline([latlngs0, new_latlng1], {
            color: "red",
            weight: routeWeight,
            smoothFactor: 1,
            //   noWrap: true,
        });
        var secondpolyline = new L.Polyline([latlngs1, new_latlng2], {
            color: "red",
            weight: routeWeight,
            smoothFactor: 1,
            //   noWrap: true,
        });
        var retVal_paths = [new Path(firstpolyline, latlngs0, new_latlng1),
        new Path(secondpolyline, new_latlng2, latlngs1)];
        return retVal_paths;
    } else {
        var firstpolyline = new L.Polyline([latlngs0, latlngs1], {
            color: "red",
            weight: routeWeight,
            smoothFactor: 1,
            //   noWrap: true,
        });
        retVal_paths = [new Path(firstpolyline, latlngs0, latlngs1)]
        return retVal_paths;
    }
}

export function drawPaths(map, paths) {
    paths.forEach((path) => {
        path.polyline.addTo(map);
    });

}


export function drawPoint(map, coords, draggable=false) {
    var startCircle = L.circle(coords, {
        color: "red",
        draggable: draggable,
        fillColor: "#f03",
        fillOpacity: 0.5,
        radius: 100000,
    });
    startCircle.addTo(map);
    return startCircle
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

  
function isDrawAntimeridian(latLngA1, latLngA2, latLngB1, latLngB2) {
    return Math.abs(latLngA1.lng - latLngB1.lng) >= 180;
    var meas1 =
      (latLngA2.distanceTo(latLngA1) + latLngB2.distanceTo(latLngB1)) / 1000;
    var meas2 = latLngA1.distanceTo(latLngB1) / 1000;
    console.log(`ANTIMER ${meas1}, ACROSS${meas2}`);
    return meas1 < meas2 && isCrossMeridian(latLngA1, latLngB1);
  }

  
function sign(x) {
    return typeof x === "number" ? (x ? (x < 0 ? -1 : 1) : 0) : NaN;
  }
  
  function isCrossMeridian(latLngA, latLngB) {
    // Returns true if the signs are not the same.
    return sign(latLngA.lng) * sign(latLngB.lng) < 0;
  }