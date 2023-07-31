// import paintBase from "./bases.js";
import socket from "./socket_actual.js";
import init_map from "./init_map.js";
import { computePaths } from "./drawFunctions.js";
import { collision_detection } from "./collision_detection.js";
import {
  pullAssets,
  pullAttackIdAssets,
  pushCollision,
  pushMovementDone,
} from "./database.js";
import { VisibilityClass } from "./visibility_class.js";
import {
  orientAsset,
  paintAsset,
  paintCircle,
  paintExplosion,
} from "./painter.js";
import { EventLogger } from "./logger.js";

var map = null;
var input_latlngs = [];
let dummy_id_last = 0;
let this_team = "CHINA";
var eventLogger = new EventLogger();

class AssetBank {
  constructor() {
    this.assets = [];
  }

  add_asset(asset) {
    this.assets.push(asset);
  }

  get_asset(asset_id) {
    let len = this.assets.length;
    for (let i = 0; i < len; i++) {
      if (this.assets[i].id == asset_id) {
        return this.assets[i];
      }
    }
  }
  get_asset_by_attack_id(attackId) {
    let len = this.assets.length;
    for (let i = 0; i < len; i++) {
      if (this.assets[i].attackId == attackId) {
        return this.assets[i];
      }
    }
  }

  get_assets() {
    return this.assets;
  }

  get_last_asset() {
    return this.assets[this.assets.length - 1];
  }
}

var asset_bank = new AssetBank();
var stationary_asset_bank = new AssetBank();

let visibility_controller = new VisibilityClass(
  asset_bank,
  stationary_asset_bank,
  map
);

function visibilityToggler(event, asset, country = null) {
  switch (asset) {
    case "country":
      visibility_controller.countryToggle(event, country);
      break;
    case "radars":
      visibility_controller.toggleRadars(event, country);
      break;
    case "routes":
      visibility_controller.toggleRoute(event, country);
      break;
    case "all":
      visibility_controller.toggleAllAids(event, country);
      break;
  }
}
window.visibilityToggler = visibilityToggler;

class MapAsset {
  constructor(team, lat = null, lng = null, image, name, id) {
    this.radarAsset = null;
    this.attackAsset = null;
    this.asset = null;
    this.current_lat = lat;
    this.current_lng = lng;
    this.team = team;
    this.image = image;
    this.name = name;
    this.id = id;
  }
}

class Base extends MapAsset {
  constructor(team, lat, lng, id, image, name) {
    super(team, lat, lng, image, name, id);
    this.children_assets = [];
    // asset_bank.forEach((asset) => this.add_child_asset(asset))
  }

  add_child_asset(asset) {
    this.children_assets.push(asset);
    let children_assets_str = this.asset.getTooltip().getContent();
    children_assets_str += `<div>${asset.image}</div>`;
    this.asset.getTooltip().setContent(children_assets_str);
  }

  paintOnMap() {
    var greenIcon = L.icon({
      iconUrl: this.image
        ? `http://122.53.86.62:1945/assets/images/GameAssets/${this.image}`
        : "http://122.53.86.62:1945/assets/images/GameAssets.png",
      // shadowUrl: 'leaf-shadow.png',
      // shadowSize: [50, 64], // size of the shadow

      iconSize: [60, 60], // size of the icon
      iconAnchor: [30, 30], // point of the icon which will correspond to marker's location
      // shadowAnchor: [4, 62],  // the same for the shadow
      // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    let initCoords = new L.LatLng(this.current_lat, this.current_lng);
    var assetMarker = L.marker(initCoords, {
      icon: greenIcon,
      opacity: 1,
      rotationAngle: 0,
    });
    assetMarker.addTo(map);
    assetMarker.bindTooltip(`
    <div style="font-size: 16px">
      <div style="font-weight: bold">${this.name}</div>
      <div>Country: ${this.team}</div>
      <div>Asset ID: ${this.id}</div>
    </div>`);
    // assetMarker.openTooltip()
    this.asset = assetMarker;
  }
}

class SingleAsset {
  constructor(data) {
    this.id = data.ingameId;
    this.name = data.name;
    this.team = data.country;
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
    name,
    attackId,
    subassets = null,
    data = null,
    paused_times = null
  ) {
    super(team, null, null, image, name, id);
    this.attackId = attackId;
    this.data = data;
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
    (this.parentId = homebase), (this.mode = mode);
    this.status = status;
    this.paths = [];
    this.totalFlightTime = 0;
    this.ismoving = false;
    this.input_latlngs = [];
    this.startTime = null;
    this.movementStatus = movementStatus;
    this.done = false;
    this.paused_times = paused_times
      ? paused_times
      : [null, null, null, null, null, null];
    this.subAssets = subassets ? subassets : [];
  }

  setPosition(coordinates) {
    this.current_lat = coordinates[0];
    this.current_lng = coordinates[1];
  }

  //SUBASSET
  addsubAsset(asset) {
    this.subAssets.push(asset);
  }

  getsubAssets() {
    return this.subAssets;
  }

  setTooltips(set = false) {
    let subAssets = {};
    this.subAssets.forEach((subasset) => {
      if (subAssets.hasOwnProperty(subasset.name)) {
        subAssets[subasset.name].push(subasset.id);
      } else {
        subAssets[subasset.name] = [subasset.id];
      }
    });
    let assetString = ``;
    Object.entries(subAssets).forEach((subasset) => {
      assetString += `<div style="border: 1px solid black; margin-bottom: 2px">${subasset[0]}: ${subasset[1].length}</div>`;
    });
    // this.subAssets.forEach(subasset => { subAssets.push(subasset.id) })
    let dateObj = new Date(this.startTime);
    let htmlString = `
    <div style="font-size: 16px">
      <div style="font-weight: bold">ASSET GROUP</div>
      <div>Movement status: ${
        this.movementStatus == "arrived" ? "Arrived" : "Moving"
      }</div>
      <div>Speed: ${this.speed}</div>
      <div>Homebase: ${this.parentId}</div>
      <div>Flighttime: ${this.totalFlightTime.toFixed(2)} secs</div>
      <div>Start Time: ${dateObj.getHours()}:${dateObj.getMinutes()}</div>
      <div>Team: ${this.team}</div>
      <div>Attack ID: ${this.attackId}</div>
      <div>Subassets: ${assetString}</div>
    </div>`;
    if (set) {
      this.asset.bindTooltip(htmlString);
    } else {
      let tooltip = this.asset.getTooltip();
      tooltip.setContent(htmlString);
    }
  }

  explodesubAsset(subassetId) {
    let exploded = null
    let index = null;
    let len = this.subAssets.length;
    for (let i = 0; i < len; i++) {
      if (this.subAssets[i].id == subassetId) {
        exploded = this.subAssets[i]
        index = i;
        break;
      }
    }
    this.subAssets.splice(index, 1);
    this.setTooltips(false);
    if (this.subAssets.length == 0) {
      paintExplosion([this.current_lat, this.current_lng], map);
      map.removeLayer(this.asset);
      this.clear_RouteAssets();
      this.clear_persistentAssets();
    }
    return exploded
  }

  addPath(path) {
    path.id = this.paths.length;
    this.paths.push(path);
  }

  getCurrentCoords() {
    if (this.paused_times[3] && !this.paused_times[4]) {
      return [this.paused_times[1], this.paused_times[2]];
    }
    if (!this.ismoving) {
      return this.end;
    }
    return [this.current_lat, this.current_lng];
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
    // let iconUrl = `http://122.53.86.62:1945/assets/images/GameAssets/${this.image}`
    let iconUrl = `./static/images/tri${this.team.toLowerCase()}.png`;
    let initCoords = this.getCurrentCoords();
    this.asset = paintAsset(initCoords, iconUrl, map);
    this.setTooltips(true);
    this.add_persistentAssets(initCoords);
    orientAsset(this);
  }

  add_routeAssets() {
    console.log(visibility_controller.showRoutes());
    if (!visibility_controller.showRoutes()) {
      return;
    }
    this.paths.forEach((path) => {
      this.routeAssets.push(path.polyline);
      path.polyline.addTo(map);
    });
    let startCircle = paintCircle(this.start, map);
    let endCircle = paintCircle(this.end, map, "red");
    this.routeAssets.push(startCircle, endCircle);
  }

  clear_RouteAssets() {
    this.routeAssets.forEach((asset) => map.removeLayer(asset));
  }

  add_persistentAssets(coords) {
    if (!visibility_controller.showRadars()) {
      return;
    }
    let attackAsset = paintCircle(coords, map, "red", 500000);
    this.attackAsset = attackAsset;
    //TODO drone only
    // var radarAsset = L.circle(coords, {
    //   color: "green",
    //   // fillColor: "#212",
    //   // fillOpacity: 0.5,
    //   weight: 0.5,
    //   radius: 2000000,
    // });
    // radarAsset.addTo(map);
    // this.radarAsset = radarAsset;
  }

  clear_persistentAssets() {
    map.removeLayer(this.attackAsset);
    this.radarAsset ? map.removeLayer(this.radarAsset) : null;
  }

  update_persistentAssets(coords) {
    if (!visibility_controller.showRadars()) {
      return;
    }
    this.radarAsset ? this.radarAsset.setLatLng(coords) : null;
    this.attackAsset.setLatLng(coords);
  }

  //LOGIC for radar
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
      return;
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
    this.paused_times[5] = this.currentPath.getProgress();
  }

  continue_movement() {
    let path = this.currentPath;
    let progress = this.paused_times[5];
    let currentTime = Date.now() / 1000;
    let startTime = currentTime - path.flightTime * progress;
    path.startFlight(startTime);
    this.paused_times[4] = Date.now() / 1000;
    this.ismoving = true;
  }

  getProgress() {
    let time_travelled_sofar = 0;
    let pl = this.paths.length;
    if (this.done) {
      return 1;
    }
    for (let i = 0; i < pl; i++) {
      let path = this.paths[i];
      if (this.currentPath.id != i) {
        time_travelled_sofar += path.flightTime;
      } else if (this.paused_times[3] && !this.paused_times[4]) {
        time_travelled_sofar += this.paused_times[5] * path.flightTime;
        break;
      } else {
        time_travelled_sofar += path.getProgress() * path.flightTime;
        break;
      }
    }
    let progress = time_travelled_sofar / this.totalFlightTime;
    return progress >= 1 ? 1 : progress;
  }

  start_movement(database_init) {
    let startTime;
    if (this.paused_times[4] || this.paused_times[3]) {
      let path = this.paths[this.paused_times[0]];
      let progress = this.paused_times[5];
      let currentTime = Date.now() / 1000;
      if (this.paused_times[4]) {
        startTime = this.paused_times[4] - path.flightTime * progress;
      } else {
        // to remove if buggy
        console.log("BUGGY");
        startTime = currentTime;
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
          return;
        }
        if (path.endTime >= currentTime) {
          // found current path, break computation
          this.startWaypoint(path);
          return;
        }
        startTime += path.flightTime;
      }
      //iterated through all paths
      //meaning movement is done
      this.completedAllWaypoints();
      return;
    } else if (this.startTime === null || this.startTime === undefined) {
      /// this is created from input rather than reading data
      startTime = Date.now() / 1000;
      this.startTime = startTime;
    } else {
      startTime = Date.parse(this.startTime) / 1000;
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
        this.startWaypoint(path);
        return;
      }
      startTime += path.flightTime;
    }
    //iterated through all paths
    //meaning movement is done
    this.completedAllWaypoints(database_init);
  }

  startWaypoint(path) {
    this.ismoving = true;
    this.currentPath = path;
    this.done = false;
  }

  //REACHDEST
  //database_init is to disable collision detection during initial map draw
  completedAllWaypoints(database_init) {
    this.currentPath = null;
    this.ismoving = false;
    this.clear_RouteAssets();
    this.paths.length = 0;
    this.done = true;
    let len = this.paused_times.length - 1;
    for (let i = 0; i <= len; i++) {
      this.paused_times[i] = null;
    }
    //WRITE DATABASE
    if (!database_init) {
      collision_detection(
        this,
        asset_bank,
        socket,
        pushCollision,
        pushMovementDone,
        eventLogger
      );
    }
  }

  init_movement(database_init = false) {
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
    this.start_movement(database_init);
    if (this.ismoving) {
      this.add_routeAssets();
      socket.emit(
        "commitAction",
        `Plane X is moving to coordinates {${this.end.lat.toFixed(
          2
        )}, ${this.end.lng.toFixed(2)}}.`
      );
    } else if (this.paused_times[1]) {
      console.log("here");
      this.add_routeAssets();
    }
  }
}

function createAssetFromDatabase(asset, subassets = null) {
  if (!asset.attackId) {
    console.log("NO ATTACK ID");
    return;
  }
  let paths = [];
  asset.path.forEach((path) => {
    let [lat, lng] = path.coordinates.split(",");
    paths.push(new L.LatLng(lat, lng));
  });
  let createdAsset = createAssets(
    paths, //       input_latlngs,
    asset.country, //    team,
    asset.status, //       status,
    asset.mode, //         mode,
    asset.movementStatus, //movementStatus
    asset.timeDeparted, // asset.startTime,
    asset.speed,
    asset.parentId,
    asset.ingameId,
    asset.image,
    asset.name,
    typeof asset.attackId == "string"
      ? parseInt(asset.attackId)
      : asset.attackId,
    subassets,
    true
  );
  return createdAsset;
}

//DATA PULL
async function databaseInit() {
  console.log("Database init");
  // let assets = await pullAssets();
  // console.log(assets)
  // store('dbvalues', assets);
  let assets = store.get("dbvalues");
  let missionAssets = {};
  assets.forEach((asset) => {
    if (asset.attackId == "" || asset.speed == 0 || asset.speed == "0") {
      let base = createBase(
        asset.country,
        asset.startLat,
        asset.startLong,
        asset.assetId,
        asset.image,
        asset.name
      );
    } else {
      if (missionAssets.hasOwnProperty(asset.attackId)) {
        missionAssets[asset.attackId].push(asset);
      } else {
        missionAssets[asset.attackId] = [asset];
      }
    }
  });
  //create asset container
  Object.values(missionAssets).forEach((assets) => {
    let subassets = [];
    assets.forEach((asset) => {
      let newAsset = new SingleAsset(asset);
      subassets.push(newAsset);
    });
    var newContainer = createAssetFromDatabase(assets[0], subassets);
    console.log(newContainer);
  });
  return;
}

// window.addEventListener("load", (e) => {
//   let ele = document.getElementById("exampleModal")
//   let myModal = new bootstrap.Modal(ele);
//   myModal.show()
// });

document.addEventListener("DOMContentLoaded", async function () {
  function updateCoords(e) {
    let point = e.latlng.wrap();
    let ele = document.getElementById("coords-bottom");
    ele.textContent = `Coordinates: |${point.lat.toFixed(
      2
    )},${point.lng.toFixed(2)}| Team: ${this_team}`;
  }
  function x(e) {
    let point = e.latlng.wrap();
    input_latlngs.push(point);
  }
  map = init_map();
  map.on("mousemove", updateCoords);
  map.on("click", x);
  visibility_controller.map = map;
  await databaseInit();
});

function createBase(team, lat, lng, id, image, name) {
  let base = new Base(team, lat, lng, id, image, name);
  stationary_asset_bank.add_asset(base);
  base.paintOnMap();
  console.log("BASE CREATED");
  return base;
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
  name,
  attack_id,
  subassets,
  database_init = false,
  paused_times = null
) {
  if (lat_lngs_array.length == 1) {
    console.log("Insufficient amount of waypoints. Supplied: 1");
    return;
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
    image,
    name,
    attack_id,
    subassets
    // paused_times,
    // data
  );
  container.startTime = startTime;
  container.input_latlngs = lat_lngs_array;
  // has paths
  if (container.input_latlngs.length > 0) {
    var latlngs = container.input_latlngs;
    container.start = latlngs[0];
    container.current_lat = latlngs[0].lat;
    for (let i = 0; i < latlngs.length; i++) {
      if (i + 1 == latlngs.length) {
        container.end = latlngs[i];
        container.current_lat = latlngs[0].lng;
        break;
      }
      var paths = computePaths(latlngs[i], latlngs[i + 1]);
      paths.forEach((path) => {
        container.addPath(path);
      });
    }
  } else {
    container.done = true;
  }
  container.init_movement(database_init);
  asset_bank.add_asset(container);
  let path = container.currentPath;
  var progress = path.getProgress();
  var newPosition = midpoint(
    path.start.lat,
    path.start.lng,
    path.end.lat,
    path.end.lng,
    progress
  );
  container.setPosition(newPosition);
  container.paintOnMap();
  console.log("ASSET CREATED");
  // stationary_asset_bank.get_asset(parentId).add_child_asset(container)
  return container;
}

function updateAssets() {
  asset_bank.get_assets().forEach((assetContainer) => {
    if (!assetContainer.ismoving) {
      return;
    }
    let path = assetContainer.currentPath;
    var progress = path.getProgress();
    // reached destination
    if (progress >= 1) {
      if (assetContainer.end_movement()) {
        assetContainer.clear_RouteAssets();
      }
    } else {
      if (!assetContainer.isReoriented) {
        orientAsset(assetContainer);
      }
      // console.log(`${progress * 100}%`, progress, path.end.lat, assetContainer.end.lng)
      var newPosition = midpoint(
        path.start.lat,
        path.start.lng,
        path.end.lat,
        path.end.lng,
        progress
      );
      assetContainer.setPosition(newPosition);
      assetContainer.update_persistentAssets(newPosition);
      assetContainer.asset.setLatLng(newPosition);
      // let ele = document.querySelector(`[aria-describedby='leaflet-tooltip-${assetContainer.asset._leaflet_id}']`)
    }
  });
}

setInterval(updateAssets, 100);

//HELPERS
function midpoint(lat1, long1, lat2, long2, per) {
  return [lat1 + (lat2 - lat1) * per, long1 + (long2 - long1) * per];
}

function targetedAttack() {
  socket.emit("mapEvent", {
    event: "targeted_attack",
    data: {
      agg_team: "US",
      aggressor: [{ name: "Raptor", ids: [1, 2, 3, 4, 5] }],
      target: [{ name: "Beijing", ids: [12] }],
      targ_team: "China",
    },
  });
}

function skirmishAttack() {
  let attackId = 1;
  let aggressors = [1, 2, 3, 4, 5];
  let targets = [6, 7, 8, 9, 10];
  pushCollision(attackId, aggressors, targets);
  socket.emit("mapEvent", {
    event: "collision",
    code: "123123123",
    data: {
      agg_team: "India",
      aggressor: { Raptor: [1, 2, 3, 4, 5] },
      target: { Plane: [12, 1, 2, 3, 5], Tank: [12, 1, 2, 3, 5] },
      targ_team: "Russia",
    },
  });
}

function createDummy() {
  let country = document.getElementById('debug-flag-change').value
  let name = document.getElementById('debug-asset-change').value
  let subasset1 = new SingleAsset({
    ingameId: 229,
    name: name,
    country: country,
  });
  let subasset2 = new SingleAsset({
    ingameId: 230,
    name: name,
    country: country,
  });

  createAssets(
    input_latlngs,
    country,
    null,
    null,
    null,
    null,
    null,
    179,
    69420 + dummy_id_last,
    null,
    null,
    12345,
    [subasset1, subasset2]
  );
  dummy_id_last += 1;
}

function dummyExplosion() {
  let x = BigInt(12345);
  let container = asset_bank.get_asset_by_attack_id(x);
  container.explodesubAsset(229);
  container.explodesubAsset(230);
}

function kaboom() {
  paintExplosion([0, 0], map);
}

//DEBUG
document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "KeyQ":
      kaboom();
      break;
    case "KeyD":
      dumpContainers();
      break;
    case "KeyX":
      targetedAttack();
      break;
    case "KeyY":
      skirmishAttack();
      break;
    case "KeyL":
      pullAttackIdAssets("20230728111959330");
      break;
    case "KeyM":
      dummyExplosion();
      break;
    case "Enter": {
      createDummy();
      input_latlngs.length = 0;
      break;
    }
    case "Space": {
      let testPlane = asset_bank.get_last_asset();
      if (testPlane.paths.length == 0) {
        return;
      }
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

//SOCKETS

socket.on("approveMovement", async (data) => {
  //query assets using attack data
  console.log(data);
  let new_data = await pullAttackIdAssets(data);
  new_data = JSON.parse(new_data);
  let subassets = [];
  new_data.forEach((subdata) => {
    let newAsset = new SingleAsset(subdata);
    subassets.push(newAsset);
  });
  createAssetFromDatabase(new_data[0], subassets);
});

socket.on("destroyedAsset", (data) => {
  let asset_containers = asset_bank.get_assets();
  let len1 = asset_containers.length;
  for (let i = 0; i < len1; i++) {
    var container = asset_containers[i];
    var subassets = container.getsubAssets();
    let len2 = subassets.length;
    for (let j = 0; j < len2; j++) {
      if (subassets[j].id == data) {
        console.log(container, data);
        container.explodesubAsset(data);
        return;
      }
    }
  }
});

socket.on("destroyedAssets", (data) => {
  eventLogger.add_event('explosion', Date.now(), `Asset `)
})
