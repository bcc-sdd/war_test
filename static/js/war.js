var map = null;
var assetBank = [];
var latlngs = [];
var existingPoints = 0;
var routeWeight = 0.2;

class Path {
  constructor(
    polyline,
    done,
    flightTime,
    startTime,
    distance,
    endTime,
    start,
    end
  ) {
    this.polyline = polyline;
    this.done = false;
    this.flightTime = flightTime;
    this.startTime = startTime;
    this.distance = distance;
    this.endTime = endTime;
    this.start = start;
    this.end = end;
  }
}

class Container {
  constructor(asset, start, end, intervalId, team = 1, ismoving = true) {
    this.team = team;
    this.asset = asset;
    this.start = start;
    this.end = end;
    this.intervalId = intervalId;
    this.paths = [];
    this.routeAssets = [];
    this.radarAsset = null;
    this.attackAsset = null;
    this.ismoving = ismoving;
    this.input_latlngs = [];
    this.isReoriented = false;
    this.totalFlightTime = 0;
  }

  paintOnMap() {
    var greenIcon = L.icon({
      iconUrl: "./static/images/plane.png",
      // shadowUrl: 'leaf-shadow.png',
      // shadowSize: [50, 64], // size of the shadow

      iconSize: [60, 60], // size of the icon
      iconAnchor: [30, 30], // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    var assetMarker = L.marker(this.start, {
      icon: greenIcon,
      opacity: 1,
      rotationAngle: 0,
    });
    assetMarker.addTo(map);
    this.asset = assetMarker;
    this.add_persistentAssets(map, this.start);
  }

  set_AssetsOpaque(val) {
    val = val ? 0.2 : 0;
    var val2 = val ? 1 : 0;
    this.asset.setOpacity(val2);
    this.radarAsset.setStyle({ fillOpacity: val, weight: val2 });
    this.attackAsset.setStyle({ fillOpacity: val, weight: val2 });
  }

  clear_RouteAssets() {
    this.routeAssets.forEach((asset) => map.removeLayer(asset));
  }

  add_routeAssets(map) {
    this.paths.forEach((path) => {
      this.routeAssets.push(path.polyline);
      path.polyline.addTo(map);
    });

    var startCircle = L.circle(this.start, {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 500000,
    });
    startCircle.addTo(map);
    var endCircle = L.circle(this.end, {
      color: "red",
      fillColor: "#212",
      fillOpacity: 0.5,
      radius: 500000,
    });
    endCircle.addTo(map);
    this.routeAssets.push(startCircle, endCircle);
  }

  add_persistentAssets(map, coords) {
    var radarAsset = L.circle(coords, {
      color: "green",
      // fillColor: "#212",
      // fillOpacity: 0.5,
      weight: 0.5,
      radius: 2000000,
    });
    var attackAsset = L.circle(coords, {
      color: "red",
      // fillColor: "#212",
      // fillOpacity: 0.5,
      weight: 1,
      radius: 500000,
    });
    radarAsset.addTo(map);
    attackAsset.addTo(map);
    this.radarAsset = radarAsset;
    this.attackAsset = attackAsset;
  }
  update_persistentAssets(coords) {
    this.radarAsset.setLatLng(coords);
    this.attackAsset.setLatLng(coords);
  }

  collisionCheck(container) {
    console.log(this.asset.getLatLng().distanceTo(container.asset.getLatLng()), 
    this.attackAsset.getRadius() + container.attackAsset.getRadius(), (
      this.asset.getLatLng().distanceTo(container.asset.getLatLng()) <=
      this.attackAsset.getRadius() + container.attackAsset.getRadius() 
    ) )
    return (
      this.asset.getLatLng().distanceTo(container.asset.getLatLng()) <=
      this.attackAsset.getRadius() + container.attackAsset.getRadius() 
    );
  }

  can_detectContainer(container) {
    return (
      this.asset.getLatLng().distanceTo(container.asset.getLatLng()) <=
      this.radarAsset.getRadius() + container.attackAsset.getRadius()
    );
  }

  orientAsset() {
    console.log("REORIENT ME");
    for (let i = 0; i < 1000; i++) {
      let currentPath = this.paths[i];
      if (currentPath.done) {
        continue;
      }
      if (currentPath.length == 2) {
        this.asset.setRotationAngle(
          currentPath.start.lng < currentPath.end.lng ? 180 : 0
        );
        // this.asset.setStyle({
        //   rotationAngle: this.start.lng < this.end.lng ? 180 : 0,
        // });
        // return this.start.lng < this.end.lng ? 180 : 0;
      } else {
        this.asset.setRotationAngle(
          currentPath.start.lng > currentPath.end.lng ? 180 : 0
        );
      }
      this.isReoriented = true;
      break;
    }
  }

  init_movement() {
    this.totalFlightTime = 0;
    if (this.paths.length == 0) {
      return;
    }
    let totalFlightTime = 0;
    var startTime = Date.now() / 1000;
    this.paths.forEach((path) => {
      start = path.start;
      end = path.end;
      path.startTime = startTime * 1000;
      //distance is in meters
      //TODO paths
      var distance = start.distanceTo(end) / 1000;
      path.distance = distance;
      //TODO hardcoded speed
      var flightTime = distance / 1000;
      path.flightTime = flightTime;
      path.endTime = startTime + flightTime;
      startTime = startTime + flightTime;
      totalFlightTime += flightTime;
    });
    this.totalFlightTime = totalFlightTime;
    this.orientAsset();
    let tooltip = L.tooltip()
      .setLatLng(this.end)
      .setContent(`Remain: ${totalFlightTime.toFixed(2)}`)
      .addTo(map);
    tooltip.openOn(map);
    this.routeAssets.push(tooltip);
  }
}

var testPlane = new Container(
  (asset = null),
  (start = null),
  (end = null),
  (intervalId = null)
);

function spawnGoons() {
  for (let i = 0; i < 300; i++) {
    var latBounds = [-50, 50];
    var lngBounds = [-180, 180];
    var lat = Math.random() * (latBounds[1] - latBounds[0] + 1) + latBounds[0];
    var lng = Math.random() * (lngBounds[1] - lngBounds[0] + 1) + lngBounds[0];
    var latlng = L.latLng(lat, lng);
    var container = new Container(
      (asset = null),
      (start = latlng),
      (end = null),
      (intervalId = null),
      (team = Math.ceil(Math.random() * 5))
    );
    createAssets(map, assetBank, container);
  }
}

function simulateArmagedon() {
  for (let i = 0; i < 300; i++) {
    var latBounds = [-50, 50];
    var lngBounds = [-180, 180];
    var container = new Container(
      (asset = null),
      (start = null),
      (end = null),
      (intervalId = null)
    );
    for (let i = 0; i < 4; i++) {
      var lat =
        Math.random() * (latBounds[1] - latBounds[0] + 1) + latBounds[0];
      var lng =
        Math.random() * (lngBounds[1] - lngBounds[0] + 1) + lngBounds[0];
      var latlng = L.latLng(lat, lng);
      container.input_latlngs.push(latlng);
    }
    createAssets(map, assetBank, container);
  }
}

function countryToggle(event) {
  var truthiness = event.srcElement.checked ? true : false;
  assetBank.forEach((asset) => {
    if (asset.team == 1 || asset.team == 2 || asset.team == 3) {
      asset.set_AssetsOpaque(truthiness);
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  //init map
  function onMapClick(e) {
    var latlng = e.latlng.wrap();
    testPlane.input_latlngs.push(latlng);
    existingPoints += 1;
  }
  map = initMap(assetBank);
  map.on("click", onMapClick);
  // spawnGoons()
});

document.addEventListener("keyup", (event) => {
  if (existingPoints < 2) {
    return;
  }
  if (event.code === "Enter") {
    createAssets(map, assetBank, testPlane);
    // container.intervalId = setInterval(updateAssets, 100);
    setInterval(updateAssets, 100);
  }
  if (event.code === "Space") {
    simulateArmagedon();
  }
});

function initMap(assetBank) {
  function init_map(assetBank) {
    var maxBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
    var map = L.map("map", {
      attributionControl: false,
      minZoom: 2,
      maxZoom: 6,
      maxBounds: maxBounds,
    }).setView([30, 0], 2);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );
    //init lines for IDL and PM
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
    paintTestIcon(map, assetBank);
    return map;
  }

  function paintTestIcon(map, assetBank) {
    var greenIcon = L.icon({
      iconUrl: "./static/images/bio.png",
      // shadowUrl: 'leaf-shadow.png',
      // shadowSize: [50, 64], // size of the shadow

      iconSize: [60, 60], // size of the icon
      iconAnchor: [30, 30], // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    var assetMarker = L.marker([27, 0], { icon: greenIcon, opacity: 1 });
    var extraAsset = new Container(
      (asset = assetMarker),
      (start = null),
      (end = null),
      (intervalId = null),
      (team = 2),
      (ismoving = false)
    );
    extraAsset.add_persistentAssets(map, assetMarker.getLatLng());
    assetMarker.addTo(map);
    assetBank.push(extraAsset);
  }
  return init_map(assetBank);
}

function createAssets(map, assetBank, container) {
  function createAndDraw(map, assetBank, container) {
    if (container.input_latlngs.length > 0) {
      container = computePaths(map, container);
    }
    assetBank.push(container);
    container.paintOnMap();
    //contains check whether has path or not
    container.init_movement();
  }

  function computePaths(map, container) {
    var latlngs = container.input_latlngs;
    container.start = latlngs[0];
    for (let i = 0; i < latlngs.length; i++) {
      if (i + 1 == latlngs.length) {
        container.end = latlngs[i];
        break;
      }
      var paths = paintLines(latlngs[i], latlngs[i + 1]);
      container.paths.push(...paths);
    }
    container.add_routeAssets(map);
    return container;
  }

  function paintLines(latlngs0, latlngs1) {
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
      var retVal_paths = [
        new Path(
          (polyline = firstpolyline),
          (done = false),
          (flightTime = null),
          (startTime = null),
          (distance = null),
          (endTime = null),
          (start = latlngs0),
          (end = new_latlng1)
        ),
        new Path(
          (polyline = secondpolyline),
          (done = false),
          (flightTime = null),
          (startTime = null),
          (distance = null),
          (endTime = null),
          (start = new_latlng2),
          (end = latlngs1)
        ),
      ];
      return retVal_paths;
    } else {
      var firstpolyline = new L.Polyline([latlngs0, latlngs1], {
        color: "red",
        weight: routeWeight,
        smoothFactor: 1,
        //   noWrap: true,
      });
      retVal_paths = [
        new Path(
          (polyline = firstpolyline),
          (done = false),
          (flightTime = null),
          (startTime = null),
          (distance = null),
          (endTime = null),
          (start = latlngs0),
          (end = latlngs1)
        ),
      ];
      return retVal_paths;
    }
  }

  createAndDraw(map, assetBank, container);
}

function updateAssets() {
  assetBank.forEach((assetContainer) => {
    var finishedMovingFlag = true;
    var assetMarker = assetContainer.asset;
    if (!assetContainer.ismoving) {
      return;
    }
    for (path of assetContainer.paths) {
      // continue along loop until current path is reached
      if (path.done == true) {
        console.log("OK");
        continue;
      }
      var currentTime = Date.now() / 1000;
      var progress = 1 - (path.endTime - currentTime) / path.flightTime;
      if (progress >= 1) {
        assetMarker.setLatLng(path.end);
        assetContainer.isReoriented = false;
        path.done = true;
        return;
      }
      if (!assetContainer.isReoriented) {
        assetContainer.orientAsset();
      }
      finishedMovingFlag = false;
      // reached destination
      // console.log(`${progress * 100}%`, progress, path.end.lat, assetContainer.end.lng)
      var newPosition = midpoint(
        path.start.lat,
        path.start.lng,
        path.end.lat,
        path.end.lng,
        progress
      );
      assetContainer.update_persistentAssets(newPosition);
      assetMarker.setLatLng(newPosition);
      // assetContainer.update_persistentAssets(newPosition)

      break;
    }
    assetBank.forEach((otherAssetContainer) => {
      // if (otherAssetContainer.team == 1) {
      //   return;
      // }
      assetContainer.collisionCheck(otherAssetContainer)
      otherAssetContainer.set_AssetsOpaque(
        assetContainer.can_detectContainer(otherAssetContainer)
      );
    });
    if (finishedMovingFlag) {
      // assetContainer.ismoving = false
      clearInterval(assetContainer.intervalId);
      assetContainer.clear_RouteAssets();
    }
  });
}

function sign(x) {
  return typeof x === "number" ? (x ? (x < 0 ? -1 : 1) : 0) : NaN;
}

function isCrossMeridian(latLngA, latLngB) {
  // Returns true if the signs are not the same.
  return sign(latLngA.lng) * sign(latLngB.lng) < 0;
}

function isDrawAntimeridian(latLngA1, latLngA2, latLngB1, latLngB2) {
  return Math.abs(latLngA1.lng - latLngB1.lng) >= 180;
  var meas1 =
    (latLngA2.distanceTo(latLngA1) + latLngB2.distanceTo(latLngB1)) / 1000;
  var meas2 = latLngA1.distanceTo(latLngB1) / 1000;
  console.log(`ANTIMER ${meas1}, ACROSS${meas2}`);
  return meas1 < meas2 && isCrossMeridian(latLngA1, latLngB1);
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

function midpoint(lat1, long1, lat2, long2, per) {
  return [lat1 + (lat2 - lat1) * per, long1 + (long2 - long1) * per];
}
