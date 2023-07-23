var map = null;
var assetBank = [];
var input_latlngs = [];
var existingPoints = 0;
import socket from './socket_actual.js'
import paintBase from './bases.js'
import init_map from './init_map.js'
import {computePaths} from './drawFunctions.js'
export default assetBank;

var assetTypes = {

}

// setInterval(saveData, 1000)


class Container {
  constructor(asset, start, end, team = 1, assetType = 'plane') {
    //computed
    this.currentPath = null;
    this.asset = asset;
    this.start = start;
    this.end = end;
    this.routeAssets = [];
    this.radarAsset = null;
    this.attackAsset = null;
    this.isReoriented = false;
    this.currentPathProgress = null;
    //saved
    this.team = team;
    this.paths = [];
    this.totalFlightTime = 0;
    this.ismoving = false;
    this.assetType = assetType
    this.input_latlngs = [];
  }

  containerSave() {
    let savedPaths = []
    this.paths.forEach((path) => {
      savedPaths.push({ start: path.start, end: path.end })
    })
    let saveObj = {
      currentPath: this.currentPath.id,
      currentPathProgress: null,
      team: this.team,
      paths: savedPaths,
      ismoving: this.ismoving,
    }
    console.log(saveObj)
    return saveObj
  }

  addPath(path) {
    path.id = this.paths.length
    this.paths.push(path)
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
    let currentPath = this.currentPath;
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
  }

  end_movement() {
    this.asset.setLatLng(this.currentPath.end);
    this.isReoriented = false;
    for (let i = 0; i < 1000; i++) {
      let path = this.paths[i]
      if (path.id == this.currentPath.id) {
        if (this.paths.length - 1 == i) {
          this.currentPath = null;
          this.ismoving = false
          this.paths.length = 0;
          return true
        }
        else {
          this.currentPath = this.paths[i + 1]
          this.currentPath.startFlight()
          return false
        }
      }
    }
    //get next path
  }

  pause_movement() {
    this.ismoving = false;
    this.currentPath.paused_time = Date.now() / 1000
  }

  continue_movement() {
    let timeElapsed = ((Date.now()) / 1000) - this.currentPath.paused_time
    this.currentPath.endTime += timeElapsed;
    console.log(timeElapsed, this.currentPath.endTime)
    this.ismoving = true;
  }

  start_movement() {
    if (this.paths.length == 0) {
      return
    }
    this.currentPath.startFlight();
    this.ismoving = true;
  }

  init_movement(current_path_int = null) {
    if (this.currentPath === null) {
      this.currentPath = this.paths[0];
    }
    else {
      this.currentPath = this.paths[current_path_int];
    }
    this.totalFlightTime = 0;
    if (this.paths.length == 0) {
      return;
    }
    let totalFlightTime = 0;
    this.paths.forEach((path) => {
      let start = path.start;
      let end = path.end;
      //distance is in meters
      //TODO paths
      var distance = start.distanceTo(end) / 1000;
      path.distance = distance;
      //TODO hardcoded speed
      var flightTime = distance / 1000;
      path.flightTime = flightTime;
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
    this.start_movement()
    socket.emit('commitAction', `Plane X is moving to coordinates {${this.end.lat.toFixed(2)}, ${this.end.lng.toFixed(2)}}.`)
  }
}


socket.on("continueAction", (data) => {
  console.log('CONTINUE ACTION')
  // testPlane.continue_movement()
})




document.addEventListener("DOMContentLoaded", function () {
  function x(e) {
    let point = e.latlng.wrap();
    input_latlngs.push(point)
  }
  map = init_map();
  map.on("click", x)
  console.log(map)

  paintBase(map)
  let bankedAssets = store.get("data")
  bankedAssets.forEach((asset) => {
    console.log(asset)
    let team = asset.team
    let input_latlngs = []
    let initPoint = asset.paths[0]
    input_latlngs.push(new L.LatLng(initPoint.start.lat, initPoint.start.lng))
    asset.paths.forEach((latlngString) => {
      let newPath = new L.LatLng(latlngString.end.lat, latlngString.end.lng)
      input_latlngs.push(newPath)
    })
    createAssets(input_latlngs, team, asset.currentPath);
  })
})


setInterval(updateAssets, 100);

function dumpContainers() {
  let dump = []
  assetBank.forEach((asset) => {
    dump.push(asset.containerSave())
  })
  store.remove("data")
  store("data", dump);
  console.log("DUMPED")
}

document.addEventListener("keyup", (event) => {
  if (event.code === "X") {
    dumpContainers()
  
  }
  else if (event.code === "Enter") {
    console.log(input_latlngs)
    createAssets(input_latlngs, 1);
    input_latlngs.length = 0
  }
  else if (event.code === "Space") {
    let testPlane = assetBank[0]
    if (testPlane.ismoving) {
      console.log('PAUSE')
      testPlane.pause_movement()
    }
    else {
      testPlane.continue_movement()
    }
    // simulateArmagedon();
  }
})


function spawnGoons() {
  for (let i = 0; i < 300; i++) {
    var latBounds = [-50, 50];
    var lngBounds = [-180, 180];
    var lat = Math.random() * (latBounds[1] - latBounds[0] + 1) + latBounds[0];
    var lng = Math.random() * (lngBounds[1] - lngBounds[0] + 1) + lngBounds[0];
    var latlng = L.latLng(lat, lng);
    var container = new Container(null, latlng, null, null, Math.ceil(Math.random() * 5));
    createAssets(map, assetBank, container);
  }
}

function simulateArmagedon() {
  for (let i = 0; i < 300; i++) {
    var latBounds = [-50, 50];
    var lngBounds = [-180, 180];
    var container = new Container(null, null, null, null);
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

function countryToggle(event, country) {
  var truthiness = event.srcElement.checked ? true : false;
  assetBank.forEach((asset) => {
    if (asset.team == country || asset.team == country * 2) {
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




function createAssets(lat_lngs_array, team = 1, current_path = null) {
  let container = new Container(null, null, null, team)
  container.input_latlngs = lat_lngs_array
  if (container.input_latlngs.length > 0) {
    var latlngs = container.input_latlngs;
    container.start = latlngs[0];
    for (let i = 0; i < latlngs.length; i++) {
      if (i + 1 == latlngs.length) {
        container.end = latlngs[i];
        break;
      }
      var paths = computePaths(latlngs[i], latlngs[i + 1]);
      paths.forEach((path) => { container.addPath(path) })
    }
    container.add_routeAssets(map);
  }
  assetBank.push(container);
  container.paintOnMap();
  //contains check whether has path or not
  if (container.input_latlngs.length > 0) {
    container.init_movement(current_path);
  }

}

function updateAssets() {
  assetBank.forEach((assetContainer) => {
    var assetMarker = assetContainer.asset;
    if (!assetContainer.ismoving) {
      return;
    }
    let path = assetContainer.currentPath
    var currentTime = Date.now() / 1000;
    var progress = 1 - (path.endTime - currentTime) / path.flightTime;
    // reached destination
    if (progress >= 1) {
      if (assetContainer.end_movement()) {
        assetContainer.clear_RouteAssets();
      }
    }
    else {
      if (!assetContainer.isReoriented) {
        assetContainer.orientAsset();
      }
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
    }

    return
    assetBank.forEach((otherAssetContainer) => {
      // if (otherAssetContainer.team == 1) {
      //   return;
      // }
      assetContainer.collisionCheck(otherAssetContainer)
      otherAssetContainer.set_AssetsOpaque(
        assetContainer.can_detectContainer(otherAssetContainer)
      );
    });
  });
}


function midpoint(lat1, long1, lat2, long2, per) {
  return [lat1 + (lat2 - lat1) * per, long1 + (long2 - long1) * per];
}
