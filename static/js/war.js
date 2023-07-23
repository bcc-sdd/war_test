var map = null;
var assetBank = [];
var stationaryAssetBank = [];
var input_latlngs = [];
var existingPoints = 0;
import socket from "./socket_actual.js";
import paintBase from "./bases.js";
import init_map from "./init_map.js";
import { computePaths } from "./drawFunctions.js";
export default assetBank;

var assetTypes = {};

// setInterval(saveData, 1000)

class MapAsset {
  constructor(asset) {
    this.radarAsset = null;
    this.attackAsset = null;
    this.asset = asset;
  }
}

class Base extends MapAsset {
  constructor(asset, team, assetType = "base") {
    super(asset);
    this.assetType = assetType;
    this.team = team;
  }

  add_persistentAssets(map) {
    let coords = this.asset.getLatLng();
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
}

class Container extends MapAsset {
  constructor(asset, start, end, team = 1, assetType = "plane") {
    super(asset);
    //computed
    this.currentPath = null;
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
    this.assetType = assetType;
    this.input_latlngs = [];
  }

  containerSave() {
    let savedPaths = [];
    this.paths.forEach((path) => {
      savedPaths.push({ start: path.start, end: path.end });
    });
    let saveObj = {
      currentPath: this.currentPath.id,
      currentPathProgress: null,
      team: this.team,
      paths: savedPaths,
      ismoving: this.ismoving,
    };
    console.log(saveObj);
    return saveObj;
  }

  addPath(path) {
    path.id = this.paths.length;
    this.paths.push(path);
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
    let headingAngle = computeAngle(
      currentPath.start.lat,
      currentPath.start.lng,
      currentPath.end.lat,
      currentPath.end.lng
    );
    if (currentPath.length == 2) {
      this.asset.setRotationAngle(
        currentPath.start.lng < currentPath.end.lng ? 180 : headingAngle
      );
    } else {
      this.asset.setRotationAngle(
        currentPath.start.lng > currentPath.end.lng
          ? headingAngle - 180
          : headingAngle
      );
    }
    this.isReoriented = true;
  }

  end_movement() {
    this.asset.setLatLng(this.currentPath.end);
    this.isReoriented = false;
    for (let i = 0; i < 1000; i++) {
      let path = this.paths[i];
      if (path.id == this.currentPath.id) {
        if (this.paths.length - 1 == i) {
          this.currentPath = null;
          this.ismoving = false;
          this.paths.length = 0;
          return true;
        } else {
          this.currentPath = this.paths[i + 1];
          this.currentPath.startFlight();
          return false;
        }
      }
    }
    //get next path
  }

  pause_movement() {
    this.ismoving = false;
    this.currentPath.paused_time = Date.now() / 1000;
  }

  continue_movement() {
    let timeElapsed = Date.now() / 1000 - this.currentPath.paused_time;
    this.currentPath.endTime += timeElapsed;
    console.log(timeElapsed, this.currentPath.endTime);
    this.ismoving = true;
  }

  start_movement() {
    if (this.paths.length == 0) {
      return;
    }
    this.currentPath.startFlight();
    this.ismoving = true;
  }

  init_movement(current_path_int = null) {
    if (this.currentPath === null) {
      try {
        this.currentPath = this.paths[0];
      } catch {}
    } else {
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
    this.start_movement();
    socket.emit(
      "commitAction",
      `Plane X is moving to coordinates {${this.end.lat.toFixed(
        2
      )}, ${this.end.lng.toFixed(2)}}.`
    );
  }
}

socket.on("continueAction", (data) => {
  console.log("CONTINUE ACTION");
  // testPlane.continue_movement()
});

document.addEventListener("DOMContentLoaded", function () {
  function x(e) {
    let point = e.latlng.wrap();
    input_latlngs.push(point);
  }
  map = init_map();
  map.on("click", x);
  console.log(map);
  let newBase = new Base(paintBase(map), 2);
  newBase.add_persistentAssets(map);
  stationaryAssetBank.push(newBase);
  let bankedAssets = store.get("data");
  bankedAssets.forEach((asset) => {
    console.log(asset);
    let team = asset.team;
    let input_latlngs = [];
    let initPoint = asset.paths[0];
    input_latlngs.push(new L.LatLng(initPoint.start.lat, initPoint.start.lng));
    asset.paths.forEach((latlngString) => {
      let newPath = new L.LatLng(latlngString.end.lat, latlngString.end.lng);
      input_latlngs.push(newPath);
    });
    createAssets(input_latlngs, team, asset.currentPath);
  });
});

setInterval(updateAssets, 200);

function dumpContainers() {
  let dump = [];
  assetBank.forEach((asset) => {
    dump.push(asset.containerSave());
  });
  store.remove("data");
  store("data", dump);
  console.log("DUMPED");
}

document.addEventListener("keyup", (event) => {
  console.log(event.code);
  if (event.code === "KeyX") {
    console.log("DUMPDUMPDUMP");
    dumpContainers();
  } else if (event.code === "KeyS") {
    spawnGoons();
  } else if (event.code === "Enter") {
    console.log(input_latlngs);
    createAssets(input_latlngs, 1);
    input_latlngs.length = 0;
  } else if (event.code === "Space") {
    let testPlane = assetBank[0];
    if (testPlane.ismoving) {
      console.log("PAUSE");
      testPlane.pause_movement();
    } else {
      testPlane.continue_movement();
    }
    // simulateArmagedon();
  }
});

function spawnGoons(add_path = false) {
  for (let i = 0; i < 100; i++) {
    let lat_lngs_array = [];
    var latBounds = [-50, 50];
    var lngBounds = [-180, 180];
    var lat = Math.random() * (latBounds[1] - latBounds[0] + 1) + latBounds[0];
    var lng = Math.random() * (lngBounds[1] - lngBounds[0] + 1) + lngBounds[0];
    var latlng = L.latLng(lat, lng);
    if (add_path) {
      for (let i = 0; i < 4; i++) {
        var lat =
          Math.random() * (latBounds[1] - latBounds[0] + 1) + latBounds[0];
        var lng =
          Math.random() * (lngBounds[1] - lngBounds[0] + 1) + lngBounds[0];
        var latlng = L.latLng(lat, lng);
        lat_lngs_array.push(latlng);
      }
    }
    let team = Math.ceil(Math.random() * 5);
    createAssets(lat_lngs_array, team, null, latlng);
  }
}

function countryToggle(event, country) {
  var truthiness = event.srcElement.checked ? true : false;
  assetBank.forEach((asset) => {
    if (asset.team == country || asset.team == country * 2) {
      set_AssetsOpaque(truthiness, asset);
    }
  });
}

window.countryToggle = countryToggle;

function createAssets(lat_lngs_array, team = 1, current_path = null, stationary_start = null) {
  let container = new Container(null, null, null, team);
  container.input_latlngs = lat_lngs_array;
  if (container.input_latlngs.length > 0) {
    var latlngs = container.input_latlngs;
    container.start = latlngs[0];
    for (let i = 0; i < latlngs.length; i++) {
      if (i + 1 == latlngs.length) {
        container.end = latlngs[i];
        break;
      }
      var paths = computePaths(latlngs[i], latlngs[i + 1]);
      paths.forEach((path) => {
        container.addPath(path);
      });
    }
    container.add_routeAssets(map);
  }
  else {
    container.start = stationary_start
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
    let path = assetContainer.currentPath;
    var currentTime = Date.now() / 1000;
    var progress = 1 - (path.endTime - currentTime) / path.flightTime;
    // reached destination
    if (progress >= 1) {
      if (assetContainer.end_movement()) {
        assetContainer.clear_RouteAssets();
      }
    } else {
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
  });
}

function visibilityCheck() {
  assetBank.forEach((assetContainer) => {
    stationaryAssetBank.forEach((otherAssetContainer) => {
      if (otherAssetContainer.team == 1) {
        return;
      }
      // assetContainer.collisionCheck(otherAssetContainer);
      set_AssetsOpaque(
        assetContainer.can_detectContainer(otherAssetContainer),
        otherAssetContainer
      );
    });
  });
}

// setInterval(visibilityCheck, 500);

function midpoint(lat1, long1, lat2, long2, per) {
  return [lat1 + (lat2 - lat1) * per, long1 + (long2 - long1) * per];
}

function computeAngle(aLat, aLng, bLat, bLng) {
  return (Math.atan2(bLng - aLng, bLat - aLat) * 180) / Math.PI - 90;
}

function set_AssetsOpaque(val, container) {
  val = val ? 0.2 : 0;
  var val2 = val ? 1 : 0;
  container.asset.setOpacity(val2);
  container.radarAsset.setStyle({ fillOpacity: val, weight: val2 });
  container.attackAsset.setStyle({ fillOpacity: val, weight: val2 });
}
