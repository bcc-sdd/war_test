var map = null;
var stationaryAssetBank = [];
var input_latlngs = [];

import socket from "./socket_actual.js";
import paintBase from "./bases.js";
import init_map from "./init_map.js";
import { computePaths } from "./drawFunctions.js";
import { pullAssets, pushCollision, pushLocation, pullAttackIdAssets} from "./database.js";


// setInterval(saveData, 1000)

class AssetBank {
  constructor() {
    this.assets = []
  }

  add_asset(asset) {
    this.assets.push(asset);
  }

  get_asset(asset_id) {
    return this.assets[asset_id]
  }

  get_assets() {
    return this.assets
  }

  get_last_asset() {
    return this.assets[this.assets.length - 1]
  }
}

var asset_bank = new AssetBank();
var stationary_asset_bank = new AssetBank();

class MapAsset {
  constructor(team, lat = null, lng = null, image = null) {
    this.radarAsset = null;
    this.attackAsset = null;
    this.asset = null;
    this.id = null;
    this.current_lat = lat;
    this.current_lng = lng;
    this.team = team;
    this.image = image
  }
}

class Base extends MapAsset {
  constructor(team, lat, lng, id, image = null) {
    super(team, lat, lng, image)
    this.team = null;
    this.has_routeAssets = false;
    this.has_radarAssets = false;
    this.children_assets = []
    // asset_bank.forEach((asset) => this.add_child_asset(asset))
  }


  add_child_asset(asset) {
    this.children_assets.push(asset)
    let children_assets_str = this.asset.getTooltip().getContent();
    children_assets_str += `<div>${asset.image}</div>`
    this.asset.getTooltip().setContent(children_assets_str)
  }

  paintOnMap() {
    var greenIcon = L.icon({
      iconUrl: this.image ? `./static/images/GameAssets/${this.image}` : "./static/images/plane.png",
      // shadowUrl: 'leaf-shadow.png',
      // shadowSize: [50, 64], // size of the shadow

      iconSize: [60, 60], // size of the icon
      iconAnchor: [30, 30], // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    // let initCoords = this.getCurrentCoords();
    let initCoords = new L.LatLng(this.current_lat, this.current_lng)
    var assetMarker = L.marker(initCoords, {
      icon: greenIcon,
      opacity: 1,
      rotationAngle: 0,
    });
    assetMarker.addTo(map);
    assetMarker.bindTooltip(`
    <div>
      <div>Movement status: ${this.movementStatus}</div>
      <div>Speed: ${this.speed}</div>
      <div>Homebase: ${this.parentId}</div>
    </div>`);
    // assetMarker.openTooltip()
    this.asset = assetMarker;
    this.add_persistentAssets(map, initCoords);
  }

  add_persistentAssets(map) {
    let coords = this.asset.getLatLng();
    var attackAsset = L.circle(coords, {
      color: "red",
      // fillColor: "#212",
      // fillOpacity: 0.5,
      weight: 1,
      radius: 500000,
    });
    this.attackAsset = attackAsset;
    attackAsset.addTo(map);
    return
    var radarAsset = L.circle(coords, {
      color: "green",
      // fillColor: "#212",
      // fillOpacity: 0.5,
      weight: 0.5,
      radius: 2000000,
    });
    radarAsset.addTo(map);
    this.radarAsset = radarAsset;
  }
}

class Container extends MapAsset {
  constructor(
    team,
    status,
    mode,
    movementStatus,
    speed,
    homebase,
    id,
    image,
    data = null,
    paused_times = null,
  ) {
    super(team, null, null, image)
    this.data = data
    //computed
    this.currentPath = null;
    this.start = null;
    this.end = null;
    this.routeAssets = [];
    this.radarAsset = null;
    this.attackAsset = null;
    this.isReoriented = false;
    this.currentPathProgress = null;
    //saved
    this.speed = speed;
    this.parentId = homebase,
      this.mode = mode;
    this.status = status;
    this.paths = [];
    this.totalFlightTime = 0;
    this.ismoving = false;
    this.input_latlngs = [];
    this.startTime = null;
    this.movementStatus = movementStatus;
    this.done = false;
    this.id = id;
    this.paused_times = paused_times
      ? paused_times
      : [null, null, null, null, null, null];
  }

  //DATA
  containerSave() {
    let savedPaths = [];
    this.paths.forEach((path) => {
      savedPaths.push({ start: path.start, end: path.end });
    });
    let saveObj = {
      currentPath: this.done ? null : this.currentPath.id,
      //OK
      startTime: this.startTime,
      currentPathProgress: null,
      team: this.team,
      ismoving: this.ismoving,
      start: this.start,
      end: this.end,
      paused_times: this.paused_times,
      //TODO
      paths: savedPaths,
    };
    return saveObj;
  }

  addPath(path) {
    path.id = this.paths.length;
    this.paths.push(path);
  }

  getCurrentCoords() {
    console.log(this)
    if (this.paused_times[3] && !this.paused_times[4]) {
      return [this.paused_times[1], this.paused_times[2]]
    }
    if (!this.ismoving) {
      return this.end;
    }
    let path = this.currentPath;
    var progress = path.getProgress();
    var newPosition = midpoint(
      path.start.lat,
      path.start.lng,
      path.end.lat,
      path.end.lng,
      progress
    );
    return newPosition;
  }

  //GFX
  paintOnMap() {
    console.log(this.image)

    var greenIcon = L.icon({
      iconUrl: this.image ? `./static/images/GameAssets/${this.image}` : "./static/images/plane.png",
      // shadowUrl: 'leaf-shadow.png',
      // shadowSize: [50, 64], // size of the shadow

      iconSize: [60, 60], // size of the icon
      iconAnchor: [30, 30], // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    let initCoords = this.getCurrentCoords();
    var assetMarker = L.marker(initCoords, {
      icon: greenIcon,
      opacity: 1,
      rotationAngle: 0,
    });
    assetMarker.addTo(map);
    assetMarker.bindTooltip(`
    <div>
      <div>Movement status: ${this.movementStatus == 'arrived' ? 'Arrived' : 'Moving'}</div>
      <div>Speed: ${this.speed}</div>
      <div>Homebase: ${this.parentId}</div>
    </div>`);
    // assetMarker.openTooltip()
    this.asset = assetMarker;
    this.add_persistentAssets(map, initCoords);
    this.orientAsset();
  }


  clear_RouteAssets(map) {
    this.routeAssets.forEach((asset) => map.removeLayer(asset));
    this.has_routeAssets = false;
  }

  add_routeAssets() {
    if (this.has_routeAssets) {
      return
    }
    this.paths.forEach((path) => {
      this.routeAssets.push(path.polyline);
      path.polyline.addTo(map);
    });

    var startCircle = L.circle(this.start, {
      color: "red",
      fillColor: "#f03",
      fillOpacity: 0.5,
      radius: 100000,
    });
    startCircle.addTo(map);
    var endCircle = L.circle(this.end, {
      color: "green",
      fillColor: "#212",
      fillOpacity: 0.5,
      radius: 100000,
    });
    endCircle.addTo(map);
    this.routeAssets.push(startCircle, endCircle);
    this.has_routeAssets = true;
  }

  clear_persistentAssets(map) {
    map.removeLayer(this.radarAsset);
    map.removeLayer(this.attackAsset);
    this.has_radarAssets = false;
    this.has_routeAssets = false;
  }

  add_persistentAssets(map, coords) {
    if (this.has_radarAssets) {
      return
    }
    // this.asset
    //   .bindPopup(`<p>Team ${this.team}</p><p>Raptor-II</p>`)
    //   .openPopup();
    var attackAsset = L.circle(coords, {
      color: "red",
      // fillColor: "#212",
      // fillOpacity: 0.5,
      weight: 1,
      radius: 500000,
    });
    this.attackAsset = attackAsset;
    attackAsset.addTo(map);
    return
    var radarAsset = L.circle(coords, {
      color: "green",
      // fillColor: "#212",
      // fillOpacity: 0.5,
      weight: 0.5,
      radius: 2000000,
    });
    radarAsset.addTo(map);
    this.has_radarAssets = true;
    this.radarAsset = radarAsset;
  }

  update_persistentAssets(coords) {
    if (this.has_radarAssets) {
      this.radarAsset.setLatLng(coords);

    }
    this.attackAsset.setLatLng(coords);
  }


  orientAsset() {
    if (this.currentPath === null) {
      return;
    }
    let currentPath = this.currentPath;
    // console.log("REORIENT ME");
    // if (this.done) {
    // }
    // else {
    //   currentPath = ;
    // }
    let headingAngle = computeAngle(
      currentPath.start.lat,
      currentPath.start.lng,
      currentPath.end.lat,
      currentPath.end.lng
    );
    if (currentPath.length == 2) {
      this.asset.setRotationAngle(
        currentPath.start.lng < currentPath.end.lng ? 180 : 0
      );
    } else {
      this.asset.setRotationAngle(
        currentPath.start.lng > currentPath.end.lng ? 180 : 0
      );
    }
    // if (currentPath.length == 2) {
    //   this.asset.setRotationAngle(
    //     currentPath.start.lng < currentPath.end.lng ? 180 : headingAngle
    //   );
    // } else {
    //   this.asset.setRotationAngle(
    //     currentPath.start.lng > currentPath.end.lng
    //       ? headingAngle - 180
    //       : headingAngle
    //   );
    // }
    this.isReoriented = true;
  }

  //LOGIC
  can_detectContainer(container) {
    return (
      this.asset.getLatLng().distanceTo(container.asset.getLatLng()) <=
      this.radarAsset.getRadius() + container.attackAsset.getRadius()
    );
  }

  //MOVEMENT
  end_movement() {
    this.asset.setLatLng(this.currentPath.end);
    this.isReoriented = false;
    this.currentPath.done = true;
    for (let i = 0; i < 1000; i++) {
      let path = this.paths[i];
      if (path.id == this.currentPath.id) {
        if (this.paths.length - 1 == i) {
          //completed all waypoints
          this.completedAllWaypoints();
          return true;
        } else {
          this.currentPath = this.paths[i + 1];
          let startTime = Date.now() / 1000;
          this.currentPath.startFlight(startTime);
          return false;
        }
      }
    }
    //get next path
  }

  pause_movement() {
    if (!this.ismoving) {
      return
    }
    this.ismoving = false;
    this.currentPath.paused_time = Date.now() / 1000;
    //pathid int
    this.paused_times[0] = this.currentPath.id;
    //posi
    this.paused_times[1] = this.asset.getLatLng().lat;
    this.paused_times[2] = this.asset.getLatLng().lng;
    //time pause
    this.paused_times[3] = Date.now() / 1000;
    //time resume
    this.paused_times[4] = null;
    //progress
    this.paused_times[5] = this.currentPath.getProgress()
  }

  continue_movement() {
    let path = this.currentPath
    let progress = this.paused_times[5]
    let currentTime = Date.now() / 1000;
    let startTime = currentTime - (path.flightTime * progress)
    path.startFlight(startTime)
    this.paused_times[4] = Date.now() / 1000;
    this.ismoving = true;
  }

  getProgress() {
    let time_travelled_sofar = 0
    let pl = this.paths.length
    if (this.done) {
      return 1
    }
    for (let i = 0; i < pl; i++) {
      let path = this.paths[i];
      if (this.currentPath.id != i) {
        time_travelled_sofar += path.flightTime
      }
      else if (this.paused_times[3] && !this.paused_times[4]) {
        time_travelled_sofar += (this.paused_times[5] * path.flightTime)
        break;
      }
      else {
        time_travelled_sofar += (path.getProgress() * path.flightTime)
        break;
      }
    }
    let progress = time_travelled_sofar / this.totalFlightTime
    return progress >= 1 ? 1 : progress
  }


  start_movement() {
    let startTime;
    if (this.paused_times[4] || this.paused_times[3]) {
      let path = this.paths[this.paused_times[0]]
      let progress = this.paused_times[5]
      let currentTime = Date.now() / 1000;
      if (this.paused_times[4]) {
        startTime = this.paused_times[4] - (path.flightTime * progress)
      }
      else {
        // to remove if buggy
        console.log('BUGGY')
        startTime = currentTime
      }
      for (let i = this.paused_times[0]; i < 1000; i++) {
        path = this.paths[i];
        if (path === undefined) {
          break;
        }
        path.startFlight(startTime);
        if (this.paused_times[3] && !this.paused_times[4]) {
          this.currentPath = path;
          this.currentPath.paused_time = this.paused_times[3];
          this.ismoving = false;
          return
        }
        if (path.endTime >= currentTime) {
          // found current path, break computation
          this.startWaypoint(path)
          return;
        }
        startTime += path.flightTime;
      }
      //iterated through all paths
      //meaning movement is done
      this.completedAllWaypoints();
      return
    }
    else if (this.startTime === null || this.startTime === undefined) {
      /// this is created from input rather than reading data
      startTime = Date.now() / 1000;
      this.startTime = startTime;
    } else {
      startTime = this.startTime;
    }
    let currentTime = Date.now() / 1000;
    for (let i = 0; i < 1000; i++) {
      var path = this.paths[i];
      if (path === undefined) {
        break;
      }
      path.startFlight(startTime);
      if (path.endTime >= currentTime) {
        // found current path, break computation
        this.startWaypoint(path)
        return;
      }
      startTime += path.flightTime;
    }
    //iterated through all paths
    //meaning movement is done
    this.completedAllWaypoints();
  }

  startWaypoint(path) {
    this.ismoving = true;
    this.currentPath = path;
    this.done = false;
  }

  completedAllWaypoints() {

    this.currentPath = null;
    this.ismoving = false;
    this.paths.length = 0;
    this.done = true;
    let len = this.paused_times.length - 1
    for (let i = 0; i <= len; i++) {
      this.paused_times[i] = null;
    }
    // socket.emit("mapEvent", { event: "attack_target_reach", data: { id: this.id } })
    // pushLocation(40, this.asset.getLatLng().lat, this.asset.getLatLng().lng)
  }

  init_movement() {
    this.totalFlightTime = 0;
    if (this.paths.length == 0) {
      return;
    }
    //compute flight Times for all paths
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
    // get total flight from start to end
    this.totalFlightTime = totalFlightTime;
    //ADD TOOLTIP
    // let tooltip = L.tooltip()
    //   .setLatLng(this.end)
    //   .setContent(`Remain: ${totalFlightTime.toFixed(2)}`)
    //   .addTo(map);
    // tooltip.openOn(map);
    // this.routeAssets.push(tooltip);
    this.start_movement();
    if (this.ismoving) {
      this.add_routeAssets();
      socket.emit(
        "commitAction",
        `Plane X is moving to coordinates {${this.end.lat.toFixed(
          2
        )}, ${this.end.lng.toFixed(2)}}.`
      );
    }
    else if (this.paused_times[1]) {
      console.log('here')
      this.add_routeAssets();
    }
  }
}


//DATA PULL
async function databaseInit() {
  console.log('ENTER HERE')
  let assets = await pullAssets();
  console.log(assets)
  assets.forEach((asset) => {
    let start = new L.LatLng(asset.startLat, asset.startLong)
    let end = new L.LatLng(asset.endLat, asset.endLong)
    let name = asset.name
    if (asset.speed == 0 || asset.speed == '0') {
      console.log(asset)
      createBase(asset.countryId, asset.startLat, asset.startLong, asset.assetId, asset.image)
    }
    else {
      createAssets(
        [start, end],//       input_latlngs,
        asset.countryId,//    team,
        asset.status,//       status,
        asset.mode,//         mode,
        asset.movementStatus,//movementStatus
        asset.timeDeparted,// asset.startTime,
        asset.speed,
        asset.parentId,
        asset.assetId,
        asset.image
      )
    }
  })

}

document.addEventListener("DOMContentLoaded", async function () {
  function updateCoords(e) {
    let point = e.latlng.wrap();
    let ele = document.getElementById("coords-bottom");
    ele.textContent = `Coordinates: |${point.lat.toFixed(
      2
    )},${point.lng.toFixed(2)}|`;
  }
  function x(e) {
    let point = e.latlng.wrap();
    input_latlngs.push(point);
  }
  map = init_map();
  map.on("mousemove", updateCoords);
  map.on("click", x);
  await databaseInit()

  //LOAD DATABASE


  //  CREATE TEST BASE
  // let newBase = new Base(paintBase(map), 2);
  // newBase.add_persistentAssets(map);
  // stationaryAssetBank.push(newBase);

  // LOAD LOCAL STORAGE DATA
  // let bankedAssets = store.get("data");
  // bankedAssets.forEach((asset) => {
  //   let team = asset.team;
  //   let input_latlngs = [];
  //   let initPoint = asset.paths[0];
  //   if (asset.paths.length >= 1) {
  //     input_latlngs.push(
  //       new L.LatLng(initPoint.start.lat, initPoint.start.lng)
  //     );
  //     asset.paths.forEach((latlngString) => {
  //       let newPoint = new L.LatLng(latlngString.end.lat, latlngString.end.lng);
  //       input_latlngs.push(newPoint);
  //     });
  //   }
  //   let paused_times = asset.paused_times;
  //   createAssets(
  //     input_latlngs,
  //     team,
  //     null,
  //     asset.startTime,
  //     asset.start,
  //     asset.end,
  //     paused_times
  //   );
  // });
});
function createBase(team, lat, lng, id) {
  let base = new Base(team, lat, lng, id)
  stationary_asset_bank.add_asset(base)
  base.paintOnMap()
  console.log('BASE CREATED')
}

function createAssets(
  lat_lngs_array,
  team,
  status,
  mode,
  movementStatus,
  startTime,
  speed,
  parentId,
  id,
  image,
  paused_times = null,
) {
  if (lat_lngs_array.length == 1) {
    console.log('Insufficient amount of waypoints. Supplied: 1')
    return
  }
  let container;
  container = new Container(
    team,
    status,
    mode,
    movementStatus,
    speed,
    parentId,
    id,
    image
    // paused_times,
    // data
  )
  container.startTime = startTime;
  container.input_latlngs = lat_lngs_array;
  // has paths
  if (container.input_latlngs.length > 0) {
    var latlngs = container.input_latlngs;
    container.start = latlngs[0];
    for (let i = 0; i < latlngs.length; i++) {
      if (i + 1 == latlngs.length) {
        container.end = latlngs[i];
        break;
      }
      var paths = computePaths(latlngs[i], latlngs[i + 1]);
      console.log(paths)
      paths.forEach((path) => {
        container.addPath(path);
      });

    }
  }
  else {
    container.done = true;
  }
  container.init_movement();
  asset_bank.add_asset(container)
  container.paintOnMap();
  console.log('ASSET CREATED')
  // stationary_asset_bank.get_asset(parentId).add_child_asset(container)
  return container;
}

function updateAssets() {

  asset_bank.get_assets().forEach((assetContainer) => {
    var assetMarker = assetContainer.asset;
    if (!assetContainer.ismoving) {
      return;
    }
    let path = assetContainer.currentPath;
    var progress = path.getProgress();
    // reached destination
    if (progress >= 1) {
      if (assetContainer.end_movement()) {
        assetContainer.clear_RouteAssets(map);
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

setInterval(updateAssets, 100);

var collision_test_done = false
var opaque_test_done = false


//COLLISION
function collisionCheck(origin, container) {
  if (collision_test_done) {
    return
  }
  if (origin.movementStatus == 'COLLISION') {
    return
  }
  let distance = origin.asset.getLatLng().distanceTo(container.asset.getLatLng())
  let radius = origin.attackAsset.getRadius() + container.attackAsset.getRadius()
  if (distance <= radius) {
    origin.pause_movement();
    container.pause_movement();
    origin.movementStatus = 'COLLISION'
    container.movementStatus = 'COLLISION'
    console.log(origin)
    let name = 'Foxhounds';
    let agg_ids = [1, 2, 3, 4]
    let nameTarg1 = 'Russian Subs'
    let agg_team = 'US';
    let targ_ids1 = [5, 6, 7]
    let nameTarg2 = 'ILYUSHIN II-80'
    let targ_ids2 = [8, 9, 10]
    let targ_team = 'China'

    socket.emit("mapEvent", {
      event: "collision",
      data: {
        agg_team: agg_team,
        aggressor: [{ name: name, ids: agg_ids }],
        target: [{ name: nameTarg1, ids: targ_ids1 }, { name: nameTarg2, ids: targ_ids2 }],
        targ_team: targ_team
      }
    });
  };
}

socket.on("eventCollision_aftermath", () => {
  let data = [0, 1]
  let origin = asset_bank.get_asset(data[0]);
  origin.continue_movement()
  origin.movementStatus = null;
  let container = asset_bank.get_asset(data[1]);
  container.continue_movement()
  container.movementStatus = null;
  collision_test_done = true;
})

//VISIBILITY

socket.on("eventVisibility_aftermath", () => {
  let origin = asset_bank.get_asset(0);
  origin.continue_movement()
  origin.movementStatus = null;
  opaque_test_done = true;
})

function set_AssetsOpaque(val, base, container) {
  if (opaque_test_done) {
    return
  }
  if (container.movementStatus == 'COLLISION') {
    return
  }
  val = val ? 0.2 : 0;
  var val2 = val ? 1 : 0;
  base.asset.setOpacity(val2);
  base.radarAsset.setStyle({ fillOpacity: val, weight: val2 });
  base.attackAsset.setStyle({ fillOpacity: val, weight: val2 });
  if (val) {
    console.log(container)
    container.pause_movement();
    container.movementStatus = 'COLLISION'
    socket.emit("eventVisibility", ['Manila', 'Flying Tanod', 'USA', 'M1 Abrams']);
  }
}

function visibilityCheck() {
  asset_bank.get_assets().forEach((assetContainer) => {
    asset_bank.get_assets().forEach((otherAssetContainer) => {
      if (assetContainer.id == otherAssetContainer.id) {
        return
      }
      collisionCheck(assetContainer, otherAssetContainer);
    })
    return
    stationaryAssetBank.forEach((otherAssetContainer) => {
      // if (otherAssetContainer.team == team) {
      //   return;
      // }
      set_AssetsOpaque(
        assetContainer.can_detectContainer(otherAssetContainer),
        otherAssetContainer, assetContainer
      );
    });
  });
}

setInterval(visibilityCheck, 500);


//HELPERS
function midpoint(lat1, long1, lat2, long2, per) {
  return [lat1 + (lat2 - lat1) * per, long1 + (long2 - long1) * per];
}

function computeAngle(aLat, aLng, bLat, bLng) {
  return (Math.atan2(bLng - aLng, bLat - aLat) * 180) / Math.PI - 90;
}



//HTML FUNCTIONS
function countryToggle(event, country) {
  var truthiness = event.srcElement.checked ? true : false;
  asset_bank.get_assets().forEach((asset) => {
    if (asset.team == country || asset.team == country * 2) {
      set_AssetsOpaque(truthiness, asset);
    }
  });
}

function toggle_ROUTE(asset, boolval,) {
  if (boolval) {
    asset.add_routeAssets()
  }
  else {
    asset.clear_RouteAssets(map);
  }
}

function toggle_RADARS(asset, boolval) {
  if (boolval) {
    asset.add_persistentAssets(map, asset.asset.getLatLng())
  }
  else {
    asset.clear_persistentAssets(map)
  }
}

function toggleAllAids(event) {
  var truthiness = event.srcElement.checked ? true : false;
  asset_bank.get_assets().forEach((asset) => {
    toggle_ROUTE(asset, truthiness)
    toggle_RADARS(asset, truthiness)
  })
}

function toggleRoute(event) {
  var truthiness = event.srcElement.checked ? true : false;
  asset_bank.get_assets().forEach((asset) => {
    toggle_ROUTE(asset, truthiness)
  })
}

function toggleRadars(event) {
  var truthiness = event.srcElement.checked ? true : false;
  asset_bank.get_assets().forEach((asset) => {
    toggle_RADARS(asset, truthiness)
  })
}


window.countryToggle = countryToggle;
window.toggleAllAids = toggleAllAids;
window.toggleRoute = toggleRoute;
window.toggleRadars = toggleRadars;
//
// DEBUGGING
//

function debugChangeTeam() {
  team = document.getElementById("debug-select-team").value;
}

window.debugChangeTeam = debugChangeTeam;


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
  }
}

function targetedAttack() {
  socket.emit("mapEvent", {
    event: "targeted_attack",
    data: {
      agg_team: 'US',
      aggressor: [{ name: 'Raptor', ids: [1, 2, 3, 4, 5] }],
      target: [{ name: 'Beijing', ids: [12] }],
      targ_team: 'China'
    }
  });
}


function skirmishAttack() {
  let attackId = 1
  let aggressors = [1,2,3,4,5]
  let targets = [6,7,8,9,10]
  pushCollision(attackId, aggressors, targets)
  socket.emit("mapEvent", {
    event: "collision",
    data: {
      agg_team: 'India',
      aggressor: [{ name: 'Raptor', ids: [1, 2, 3, 4, 5] }],
      target: [{ name: 'Plane', ids: [12, 1, 2, 3, 5] }, { name: 'Tank', ids: [12, 1, 2, 3, 5] }],
      targ_team: 'Russia'
    }
  });
}

//DEBUG
document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyW": socket.emit("eventCityTarget", ['Manila', 'Battle Jeeps', 'USA', 'Population']); break;
    case "KeyQ": socket.emit("eventCollision", ['Manila', 'Battle Trikes', 'USA', 'Sherman Tank']); break;
    case "KeyE": socket.emit("eventVisibility", ['Manila', 'Flying Tanod', 'USA', 'M1 Abrams']); break;
    case "KeyD": dumpContainers(); break;
    case "KeyX": targetedAttack(); break;
    case "KeyY": skirmishAttack(); break;
    case "KeyL": pullAttackIdAssets('20230728111959330'); break;

    case "Enter": createAssets(input_latlngs, 1, null, null, null, null, null, null, asset_bank.assets.length);
      input_latlngs.length = 0;
      break;
    case "KeyS": spawnGoons(); break;
    case "Space": {
      let testPlane = asset_bank.get_last_asset();
      console.log(testPlane)
      if (testPlane.ismoving) {
        console.log("PAUSE");
        testPlane.pause_movement();
      } else {
        testPlane.continue_movement();

      }
      break;
    }

  }
});


//DEBUG LOCAL STORAGE SAVE
function dumpContainers() {
  let dump = [];
  asset_bank.get_assets().forEach((asset) => {
    dump.push(asset.containerSave());
  });
  store.remove("data");
  store("data", dump);
  console.log("DUMPED", dump);
}