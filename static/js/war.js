/*
///////////////////////////////////////////////////////////////
 __ _ ___ _____ __    __ _    ___ _  _                        /
/  |_) | (_  | (_    /  / \|\| | |_)/ \|                      /
\__| \_|___)_|___)   \__\_/| | | | \\_/|__                    / 
MAP CODE                          _____          _ ___ _  _   / 
VERSION 6.23                     (_  | |V|| ||  |_| | / \|_)  /
                                 __)_|_| ||_||__| | | \_/| \  /
*/ ////////////////////////////////////////////////////////////

const settings = {
  drawBases: true,
  load_db: true,
  load_store: true,
  paint_population: false
}

const paint_settings = {
  mapIconSize: 36
}


class Event {
  constructor(time, event) {
    this.time = time;
    this.event = event;
  }
}

class DestroyEvent extends Event{
  constructor (time, event, location, aggressor, target, ) {
    super(time, event)
  }
}

class RepositionEvent {
  constructor (time, event, details) {

  }
}

class DeployEvent {
  constructor() {
    
  }
}

class EventManager {
  constructor() {
    this.events = []
  }
}

///////////////////////////////////////////////////////////////


import { socket, collisionTransmit } from "./socket_actual.js";
import init_map from "./init_map.js";
import { computePaths } from "./drawFunctions.js";
import { collision_detection, base_collision_detection } from "./collision_detection.js";
import {
  pullAssets,
  pullAttackIdAssets,
  pushCollision,
  pushMovementDone,
  pushPauseMovement,
  pushResumeMovement,
  resetTargetId
} from "./database.js";
import { VisibilityClass } from "./visibility_class.js";
import {
  orientAsset,
  paintAsset,
  paintCircle,
  paintExplosion,
  paintBase,
  getExplodedIcon
} from "./painter.js";
import { EventLogger } from "./logger.js";
import { endpoints } from "./endpoints.js";


var map = null;
var input_latlngs = [];
let this_team = "CHINA";
var eventLogger = new EventLogger();

class AssetBank {
  constructor() {
    this.assets = [];
    this.dummy_id_last = 84;
    this.asset_dict = {};
  }

  remove_asset(assetId) {
    //untested
    let len = this.assets.length
    for (let i=0; i<len; i++) {
      let asset = this.assets[i]
      if (asset.id == assetId) {
        this.assets.splice(i, 1)
      }
     }
    console.log('w -> Remove asset: null')
  }

  get_dummy_id() {
    this.dummy_id_last += 1;
    return this.dummy_id_last - 1;
  }

  add_asset(asset) {
    this.assets.push(asset);
  }

  get_asset(asset_id) {
    let len = this.assets.length
    for (let i=0; i<len; i++) {
      let asset = this.assets[i]
      if (asset.id == asset_id) {
        return asset
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
var single_asset_bank = new AssetBank();
var drone_asset_bank = new AssetBank();

let visibility_controller = new VisibilityClass(
  asset_bank,
  stationary_asset_bank,
  map
);

function visibilityToggler(event, asset, country = null) {
  switch (asset) {
    case "base":
      var truthiness = event.srcElement.checked ? true : false;
        stationary_asset_bank.get_assets().forEach(base => {
            truthiness ? (base.asset ? null: base.paintOnMap()) : base.destroyAssets()
        })
    break;
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
    this.subAssets = [];
    this.is_painted = false;
  }

  
  getLatLng() {
    // for distance computations
    return L.latLng(this.current_lat, this.current_lng);
  }

  getsubAssetIds() {
    let ids = [];
    this.subAssets.forEach((subasset) => ids.push(subasset.id));
    return ids;
  }

  addsubAsset(asset) {
    this.subAssets.push(asset);
  }

  getsubAssets() {
    return this.subAssets;
  }
}

class BaseRecord {
  constructor(asset) {
    this.name = asset.name;
    this.quantity = asset.childQuantity;
    this.destroyed = asset.destroyed;
    this.deployed = asset.deployed;
    this.image = asset.image;
    if (asset.destroyed > 0) {
    }
  }
}

class Base extends MapAsset {
  constructor(team, lat, lng, id, image, name, children, status) {
    super(team, lat, lng, image, name, id);
    this.is_people = false;
    this.baseRecords = [];
    this.status = status;
    this.is_base = true;
    if (this.status != 'exploded') {
      children?.forEach((child) => {
        /* {"assetParentId":494,"assetId":254,"parentId":866,"childQuantity":161
        575,"deployed":0,"destroyed":0,"assetRecId":254,"name":"People","description":"Russia","attackRadius":"0","speed":"0","image":"Rus_people.png",
        "transportationMode":"Land","type":"Population","class":"N\/A","country":6,"visibility":"Team"}
        */
        let record = new BaseRecord(child);
        this.baseRecords.push(record);
        if (child.type == "Population") {
          this.is_people = true;
        }
      });
    }
  }

  setTooltips(init = false) {
    let subAssets = {};
    this.subAssets.forEach((subasset) => {
      if (subAssets.hasOwnProperty(subasset.name)) {
        subAssets[subasset.name].push(subasset.id);
      } else {
        subAssets[subasset.name] = [subasset.id];
      }
    });
    let assetString = ``;
    let subassetString = ``;
    this.subAssets.forEach((subasset) => {
      subassetString += `${subasset.id},`;
    });
    Object.entries(subAssets).forEach((subasset) => {
      assetString += `<div style="border: 1px solid black; margin-bottom: 2px">${subasset[0]}: ${subasset[1].length}</div>`;
    });

    let recordsString = ``;
    if (this.is_people) {
      this.baseRecords.forEach((record) => {
        recordsString += `<div style="border: 1px solid black; margin-bottom: 2px">${record.name}: ${record.quantity} </div>`;
      });
    } else {
      this.baseRecords.forEach((record) => {
        recordsString += `<div style="border: 1px solid black; margin-bottom: 2px">${record.name}: ${record.quantity}/${record.destroyed}/${record.deployed}</div>`;
      });
    }

    let tooltip = `
      <div style="font-size: 16px">
        <div style="font-weight: bold">${this.name}</div>
        <div>Country: ${this.team}</div>
        <div>Asset ID: ${this.id}</div>
        <div>Subassets: ${assetString}</div>
        <div>Records: ${recordsString}</div>
        <div>Exploded: ${this.status == 'exploded' ? 'YES': 'No'}</div>

      </div>`;
    if (init) {
      this.asset.bindTooltip(tooltip);
    } else {
      let tooltip = this.asset.getTooltip();
      tooltip.setContent(htmlString);
    }
  }

  destroyAssets() {
    // for vibilitiy
    map.removeLayer(this.asset)
    this.asset = null
  }

  setVisibility(value) {
    this.visibility = value
    if (visibility == 'All') {
      this.isHidden = false
      if (!this.asset) {
        this.paintOnMap()
      }
      else {
        this.asset.addTo(map)
      }
    }
    else {
      this.isHidden = true
      try {
        map.removeLayer(this.asset)
      } catch (error) {
        console.log('Removing asset: no such asset.')
      }
    }
  }

  paintOnMap() {
    let size = paint_settings.mapIconSize
    var baseIcon;
    if (this.status == 'exploded') {
      var baseIcon = getExplodedIcon(this.team)
    }
    else {
      var baseIcon = L.icon({
        iconUrl: this.image
          ? `http://122.53.86.62:1945/assets/images/GameAssets/${this.image}`
          : "http://122.53.86.62:1945/assets/images/GameAssets.png",
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
      });
    }
    let initCoords = new L.LatLng(this.current_lat, this.current_lng);
    var assetMarker = L.marker(initCoords, {
      icon: baseIcon,
      opacity: 1,
      rotationAngle: 0,
    });
    if (settings.drawBases) {
      assetMarker.addTo(map);
      this.is_painted = true
    }
    this.asset = assetMarker;
    this.setTooltips(true);
  }

  explodeBase() {
    this.state = 'exploded';
    paintBase(this.asset, this.team)
    this.setTooltips(true)
    // map.removeLayer(this.asset)
  }

}

class SingleAsset {
  constructor(data, parentSquadron) {
    if (parentSquadron == null) {
      console.log(`ERROR: no parent squadron: ${data.ingameId}`);
    }
    this.id = data.ingameId;
    this.name = data.name;
    this.team = data.country;
    this.attackId = data.attackId;
    this.container = parentSquadron;
    this.image = data.image;
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
    targetId,
    data = null,
    is_drone = false,
    paused_times = null
  ) {
    super(team, null, null, image, name, id);
    //default
    this.subAssets = [];
    //inputed
    this.input_latlngs = [];
    this.attack_radius = 500000;
    this.radar_radius = 2000000;
    //computed
    this.currentPath = null;
    this.start = null;
    this.end = null;
    this.routeAssets = [];
    this.radarAsset = null;
    this.attackAsset = null;
    this.isReoriented = false;
    this.currentPathProgress = null;
    this.totalFlightTime = 0;
    this.ismoving = false;
    this.done = false;
    this.isHidden = false;
    //saved
    this.is_drone = is_drone;
    this.attackId = attackId;
    this.targetId = targetId === 0 ? null : targetId;
    this.speed = speed;
    this.parentId = homebase;
    this.mode = mode;
    this.status = status;
    this.paths = [];
    this.startTime = null;
    this.movementStatus = movementStatus;
    this.visibility = data?.visibility
    this.paused_times = paused_times
      ? paused_times
      : [null, null, null, null, null, null];
    if (data != null) {
      this.data = data;
      this.type = data.type;
      this.is_bomb = data.type == 'Missile' || data.type == 'Nuclear bomb'
      if (data.pausePosition) {
        let position = data.pausePosition.split(",");
        this.paused_times = [
          parseInt(data.pausePathId), // 0:pathId
          parseInt(position[0]), // 1,2position
          parseInt(position[1]),
          parseInt(data.pauseTime), // pauseTime
          parseInt(data.pauseResumeTime), // resume
          Number(data.pauseProgressPercentage), //progress
        ];
      }
    }
  }

  //ASSET MANAGEMENT
  destroyAsset() {
    asset_bank.remove_asset(this.id)
    map.removeLayer(this.asset)
    this.clear_RouteAssets();
    this.clear_persistentAssets();
    this.movementStatus = "destroyed";
    this.asset = null;
  }

  //SUBASSET MANAGEMENT

  addsubAsset(subasset) {
    this.subAssets.push(subasset);
  }

  removesubAsset(subassetId) {
    let index = null;
    let len = this.subAssets.length;
    let removedAsset = null;
    for (let i = 0; i < len; i++) {
      if (this.subAssets[i].id == subassetId.id) {
        removedAsset = this.subAssets[i];
        index = i;
        break;
      }
    }
    this.subAssets.splice(index, 1);
    this.setTooltips(false);
    return removedAsset;
  }

  detachsubAsset(subassetId) {
    this.removesubAsset(subassetId);
    if (this.subAssets.length == 0) {
      this.destroyAsset()
    }
  }


  explodesubAsset(subassetId) {
    let latObject = [this.current_lat, this.current_lng]
    paintExplosion(latObject, map, this.team);
    let exploded = this.removesubAsset(subassetId);
    if (this.subAssets.length == 0) {
      this.destroyAsset()
      map.removeLayer(this.asset);
      this.status = "exploded";
    }
    return exploded;
  }


  
  //GETTERS

  getCurrentCoords() {
    if (this.paused_times[3] && !this.paused_times[4]) {
      return [this.paused_times[1], this.paused_times[2]];
    }
    if (!this.ismoving) {
      return this.end;
    }
    return [this.current_lat, this.current_lng];
  }
  
  
  getSquadron() {
    let squadron = {};
    squadron.attackId = this.attackId;
    squadron.country = this.team;
    squadron.assets = {};
    this.subAssets.forEach((subasset) => {
      if (squadron.assets.hasOwnProperty(subasset.name)) {
        squadron.assets[subasset.name].push(subasset.id);
      } else {
        squadron.assets[subasset.name] = [subasset.id];
      }
    });
    return squadron;
  }
  
  //SETTERS

  addPath(path) {
    path.id = this.paths.length;
    this.paths.push(path);
  }

  
  setPosition(coordinates) {
    this.current_lat = coordinates[0];
    this.current_lng = coordinates[1];
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
    let subassetString = ``;
    this.subAssets.forEach((subasset) => {
      subassetString += `${subasset.id},`;
    });
    Object.entries(subAssets).forEach((subasset) => {
      assetString += `<div style="border: 1px solid black; margin-bottom: 2px">${subasset[0]}: ${subasset[1].length}</div>`;
    });
    // this.subAssets.forEach(subasset => { subAssets.push(subasset.id) })
    let dateObj = new Date(this.startTime);
    // <div>Mode: ${this.mode}</div>             //Attack, Re-Position
    // <div>Status: ${this.status}</div>         //alive, exploded
    // <div>Mvment Status: ${this.status}</div> //moving, arrived, destroyed
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
      <div>Subasset ids: ${subassetString}</div>
      <div>Mode: ${this.mode}</div>           
      <div>Status: ${this.status}</div>       
      <div>Mvment Status: ${this.movementStatus}</div>
      <div>TargetId: ${this.targetId}</div>
      <div>Paused times: ${this.paused_times}</div>
      <div>Bomb: ${this.is_bomb}</div>
    </div>`;
    if (set) {
      this.asset.bindTooltip(htmlString);
    } else if(this.asset) {
      let tooltip = this.asset.getTooltip();
      tooltip.setContent(htmlString);
    }
  }



  //GFX
  
  

  paintOnMap() {
    if (!visibility_controller.asset_is_visible(this) ) {
      if (!(this.visibility == 'All')) {
        this.isHidden = true;
      }
    }
    let iconUrl = `http://122.53.86.62:1945/assets/images/tri${this.team.toLowerCase()}.png`
    // let iconUrl = `./static/images/tri${this.team.toLowerCase()}.png`;
    let initCoords = this.getCurrentCoords();
    this.asset = paintAsset(initCoords, iconUrl, map, this.isHidden);
    this.setTooltips(true);
    this.add_persistentAssets(initCoords);
    orientAsset(this);
  }

  add_routeAssets() {
    if (!visibility_controller.showRoutes(this)) {
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
    if (!visibility_controller.showRadars(this)) {
      return;
    }
    let attackAsset = paintCircle(coords, map, "red", this.attack_radius);
    this.attackAsset = attackAsset;
    if (this.is_drone) {
      var radarAsset = L.circle(coords, {
        color: "green",
        // fillColor: "#212",
        // fillOpacity: 0.5,
        weight: 0.5,
        radius: this.radar_radius,
      });
      radarAsset.addTo(map);
      this.radarAsset = radarAsset;
    }
    //TODO drone only
  }

  clear_persistentAssets() {
    this.attackAsset ? map.removeLayer(this.attackAsset) : null;
    this.radarAsset ? map.removeLayer(this.radarAsset) : null;
  }

  update_persistentAssets(coords) {
    if (!visibility_controller.showRadars(this)) {
      return;
    }
    this.radarAsset ? this.radarAsset.setLatLng(coords) : null;
    this.attackAsset ? this.attackAsset.setLatLng(coords) : null;
  }


  //MOVEMENT
  end_movement() {
    // this.asset.setLatLng(this.currentPath.end);
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
  }

  pause_movement() {
    if (!this.ismoving) {
      return;
    }
    this.ismoving = false;
    this.currentPath.paused_time = Date.now() / 1000;
    let pathid = this.currentPath.id;
    let position = `${this.asset.getLatLng().lat},${
      this.asset.getLatLng().lng
    }`;
    let paused_time = Date.now() / 1000;
    let progressPercentage = this.currentPath.getProgress();

    //pathid int
    this.paused_times[0] = pathid;
    //posi
    this.paused_times[1] = this.asset.getLatLng().lat;
    this.paused_times[2] = this.asset.getLatLng().lng;
    //time pause
    this.paused_times[3] = paused_time;
    //time resume
    this.paused_times[4] = null;
    //progress
    this.paused_times[5] = progressPercentage;
    pushPauseMovement(
      this.currentPath.id,
      position,
      progressPercentage,
      this.attackId,
      paused_time,
      null
    );
  }

  continue_movement() {
    if (!this.paths.length) {
      return;
    }
    let path = this.currentPath;
    let progress = this.paused_times[5];
    let currentTime = Date.now() / 1000;
    let startTime = currentTime - path.flightTime * progress;
    path.startFlight(startTime);
    this.paused_times[4] = Date.now() / 1000;
    this.ismoving = true;
    pushResumeMovement(this.attackId);
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

  //wpreach
  //database_init is to disable collision detection during initial map draw
  completedAllWaypoints(database_init) {
    // <div>Mode: ${this.mode}</div>             //Attack, Re-position
    // <div>Status: ${this.status}</div>         //alive, exploded
    // <div>Mvment Status: ${this.status}</div> //moving, arrived, destroyed
    this.currentPath = null;
    this.ismoving = false;
    this.movementStatus = "arrived";
    this.clear_RouteAssets();
    this.paths.length = 0;
    this.done = true;
    let len = this.paused_times.length - 1;
    for (let i = 0; i <= len; i++) {
      this.paused_times[i] = null;
    }
    this.setTooltips()
    // if (localStorage.getItem("admin") != 'admin') {
    //   return
    // }
    //WRITE DATABASE
    pushMovementDone(this.id);
    //base attack
    if (this.is_bomb) {
        this.status = 'exploded'
        paintExplosion(this.getCurrentCoords(), map, this.team)
        // paintBase(this.asset, this.team)
        // this.asset.setRotationAngle(0)
        // this.setTooltips(true)
        this.destroyAsset()
      //TODO
      this.targetId = null
      resetTargetId(this.id)
    }
    else if (this.targetId) {
      let event_name = 'base_attack'
      let target = stationary_asset_bank.get_asset(this.targetId)
      let cbkdata = [this, target, null, event_name];
      pushCollision(
        this.attackId,
        this.getsubAssetIds(),
        [this.targetId],
        event_name,
        collisionTransmit,
        cbkdata
      );
      this.targetId = null;
      resetTargetId(this.id)
    }
    //collision attack 
    else if (!database_init) {
      collision_detection(
        this,
        asset_bank,
        collisionTransmit,
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
      var distance = start.distanceTo(end) / 1000;
      path.distance = distance;
      //TODO hardcoded speed
      var flightTime = distance / 300;
      path.flightTime = flightTime;
      totalFlightTime += flightTime;
    });
    // get total flight from start to end
    this.totalFlightTime = totalFlightTime;
    this.start_movement(database_init);
    if (this.ismoving || this.paused_times[1]) {
      this.add_routeAssets();
      // socket.emit(
      //   "commitAction",
      //   `Plane X is moving to coordinates {${this.end.lat.toFixed(
      //     2
      //   )}, ${this.end.lng.toFixed(2)}}.`
      // );
    }
  }
}

function createAssetFromDatabase(asset) {
  if (asset.status == "exploded") {
    return;
  }

  let paths = [];
  asset.path.forEach((path) => {
    let [lat, lng] = path.coordinates.split(",");
    paths.push(new L.LatLng(lat, lng));
  });

  let createdContainer = createAssets(
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
    asset.attackId,
    asset.targetId,
    asset,
    true
  );
  return createdContainer;
}

//attack: radius
//targetId -> assets
//reposition: no event
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DATA PULL
//DBINIT
async function databaseInit() {
  var assets;
  if (settings.load_db) {
    assets = await pullAssets();
    store("dbvalues", assets);
  }
  else if (settings.load_store) {
    assets = store.get("dbvalues");
  }
  let missionAssets = {};
  assets.forEach((asset) => {
    if (asset.children.length > 0) {
      let base = createBase(
        asset.country,
        asset.startLat,
        asset.startLong,
        asset.ingameId,
        asset.image,
        asset.name,
        asset.children,
        asset.status,
      );
      stationary_asset_bank.add_asset(base);
    } else {
      //GROUP BY ATTACK ID
      if (missionAssets.hasOwnProperty(asset.attackId)) {
        missionAssets[asset.attackId].push(asset);
      } else {
        missionAssets[asset.attackId] = [asset];
      }
    }
  });
  //create asset container
  Object.values(missionAssets).forEach((assets) => {
    if (assets[0].path.length == 0) {
      return
    }
    let container = createAssetFromDatabase(assets[0]);
    assets.forEach((asset) => {
      if (asset.status == 'exploded') {
        return
      }
      let newAsset;
      try {
        newAsset = new SingleAsset(asset, container);
        container.addsubAsset(newAsset);
        single_asset_bank.add_asset(newAsset);
      } catch (error) {
        console.log(error)
      }
      container.setTooltips()
      //TODO add motherbase
      // let motherbase = stationary_asset_bank.get_asset(asset.parentId)
      // motherbase.addsubAsset(newAsset)
    });
  });
  return;
}

// window.addEventListener("load", (e) => {
//   let ele = document.getElementById("exampleModal")
//   let myModal = new bootstrap.Modal(ele);
//   myModal.show()
// });

function updateSetup(e) {
  let point = e.latlng.wrap();
  let ele = document.getElementById("coords-bottom");
  ele.textContent = `Coordinates: |${point.lat.toFixed(
    2
  )},${point.lng.toFixed(2)}| Team: ${this_team}`;
}

function changeIconSizes (){
  stationary_asset_bank.get_assets().forEach(asset => {
    let zoom = map.getZoom() // min 2, max 6
    let icon = asset.asset.options.icon;
    icon.options.iconSize = [30 + ((zoom-2)*8), 30 + ((zoom-2)*8)];
    asset.asset.setIcon(icon);
  })
}

function debounce(fn, delay) {
  let timer = null

  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// De-bounce version of the clickHandler Function
const debouncedClickHandler = debounce(changeIconSizes, 750)

document.addEventListener("DOMContentLoaded", async function () {
  this_team = localStorage.getItem("country");
  function x(e) {
    let point = e.latlng.wrap();
    input_latlngs.push(point);
  }
  map = init_map();
  map.on("mousemove", updateSetup);
  map.on("click", x);
  // map.on('zoomend', debouncedClickHandler);
  visibility_controller.map = map;
  await databaseInit();
});

function createBase(team, lat, lng, id, image, name, children, status) {
  let base = new Base(team, lat, lng, id, image, name, children, status);
  stationary_asset_bank.add_asset(base);
  base.paintOnMap();
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
  targetId,
  data,
  database_init = false,
  is_drone = false,
) {
  if (lat_lngs_array.length == 1) {
    console.log("Insufficient amount of waypoints. Supplied: 1");
    return;
  }
  if (attack_id == null ) {
    console.log('NO ATTACK ID')
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
    image,
    name,
    attack_id,
    targetId,
    data,
    is_drone
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
  if (container.done) {
    container.setPosition([container.end]);
  } else {
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
  }
  if (is_drone) {
    drone_asset_bank.add_asset(container);
  }
  container.paintOnMap();
  //TODO add to parent
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
      var newPosition = midpoint(
        path.start.lat,
        path.start.lng,
        path.end.lat,
        path.end.lng,
        progress
      );
      assetContainer.setPosition(newPosition);
      assetContainer.asset ? assetContainer.asset.setLatLng(newPosition) : null;
      assetContainer.update_persistentAssets(newPosition);
      let is_moving = assetContainer.movementStatus != "moving";
      if (is_moving) {
        assetContainer.movementStatus = "moving";
        assetContainer.setTooltips();
      }
    }
  });
}

setInterval(updateAssets, 100);

//HELPERS
function midpoint(lat1, long1, lat2, long2, per) {
  return [lat1 + (lat2 - lat1) * per, long1 + (long2 - long1) * per];
}


function createDummy() {
  let country = document.getElementById("debug-flag-change").value;
  let name = document.getElementById("debug-asset-change").value;
  let base = createBase(
    'USA',
    0,
    0,
    131,
    './20230725020411.png',
    'DUMMY BASE',
    null
  );
  let data = {
    // is_bomb: true
  }
  let dummyContainer = createAssets(
    input_latlngs,
    country,
    "alive",
    "Attack",
    "moving",
    null,
    696969,
    179,
    69420 + asset_bank.get_dummy_id(),
    null,
    "DUMMY CONTAINER",
    12345, //attackId
    null, //targetId
    data,
    null,
    // localStorage.getItem("country") == country
    false,
  );
  let subasset1 = new SingleAsset(
    {
      ingameId: asset_bank.get_dummy_id(),
      name: name,
      country: country,
    },
    dummyContainer
  );
  let subasset2 = new SingleAsset(
    {
      ingameId: asset_bank.get_dummy_id(),
      name: name,
      country: country,
    },
    dummyContainer
  );
  single_asset_bank.add_asset(subasset1);
  single_asset_bank.add_asset(subasset2);
  dummyContainer.addsubAsset(subasset1);
  dummyContainer.addsubAsset(subasset2);
}

//DEBUG
document.addEventListener("keyup", (event) => {
  switch (event.code) {
    case "Enter": {
      createDummy();
      input_latlngs.length = 0;
      break;
    }
    case "KeyR": {
      asset_bank.get_assets().forEach((asset) => {
        asset.paused_times[3] && !asset.ismoving
          ? asset.continue_movement()
          : null;
      });
      break;
    }
    case "Space": {
      asset_bank.get_assets().forEach((asset) => {
        asset.ismoving ? asset.pause_movement() : null;
      });
      break;
    }
  }
});

//SOCKETS

socket.on("loadCountry", data => {
  localStorage.setItem('country', data.country)
})



socket.on("changeVisibility", data => {
  // visibility
  // attack id
  // in game id
  let visibility = data.visibility
  let attackId = data.attackId
  let inGameId = data.inGameId
  if (attackId) {
    let asset = asset_bank.get_asset_by_attack_id(attackId)
    asset.setVisibility(visibility)
  }
  if (inGameId) {
    let asset = stationary_asset_bank.get_asset(inGameId) 
    asset.setVisibility(visibility)
  }
})


socket.on("continueMovement", (data) => {
  single_asset_bank.get_asset(data[0]).container.continue_movement();
});

socket.on("approveMovement", async (data) => {
  //query assets using attack data
  let databaseData = await pullAttackIdAssets(data);
  databaseData = JSON.parse(databaseData);
  //determine if all siblings move with parent
  let flag = true
  let parent = null
  let len = databaseData.length
  for (let i=0; i< len; i++) {
    let old_subasset = single_asset_bank.get_asset(databaseData[i].ingameId);
    if (!old_subasset) {
      flag = false;
      break
    }
    if (parent == null) {
      parent = old_subasset.container
    }
    else if (parent.attackId != old_subasset.container.attackId) {
      flag = false;
      break;
    }
  }
  // if (flag) {
  //   parent.addPath(subdata)
  //   return
  // }
  
  let newContainer = createAssetFromDatabase(databaseData[0]);
  databaseData.forEach((subdata) => {
    let new_subasset;
    let old_subasset = single_asset_bank.get_asset(subdata.ingameId);
    // remove entities from previous attackId
    if (old_subasset) {
      old_subasset.container.detachsubAsset(subdata.ingameId);
      new_subasset = old_subasset;
      new_subasset.container = newContainer
    } else {
      //create subassets
      new_subasset = new SingleAsset(subdata, newContainer);
      single_asset_bank.add_asset(new_subasset);
    }
    newContainer.addsubAsset(new_subasset)
    newContainer.setTooltips()
  });
});

socket.on('collisionAlive', (data) => {
  let parents = []
  data.forEach(subdata => {
    let old_subasset = single_asset_bank.get_asset(subdata)
    let len = parents.length
    let flag = false
    for (let i = 0; i<len; i++) {
      if (parents[i].id == old_subasset.container.id) {
        flag = true;
        break;
      }
    }
    if (!flag) {
      parents.push(old_subasset.container)
    }
  })
  parents.forEach(parent => {
    parent.continue_movement()
  }
  )
})

socket.on("destroyedAsset", (data) => {
  data.assets.forEach(asset_id => {
    let old_subasset = single_asset_bank.get_asset(asset_id);
    old_subasset.container.explodesubAsset(old_subasset);
  })
  data.bases.forEach(asset_id => {
    let asset = stationary_asset_bank.get_asset(asset_id)
    asset.explodeBase();
  })
  return;

});


  //LOGIC for radar
function can_detectContainer(origin, container) {
    return (
      origin.getLatLng().distanceTo(container.getLatLng()) <=
      origin.radar_radius - container.attack_radius / 2
    );
  }

//TODO
function droneFunction() {
  drone_asset_bank.get_assets().forEach((drone) => {
    asset_bank.get_assets().forEach((asset) => {
      if (drone.id == asset.id) {
        return;
      }
      if (asset.isHidden && can_detectContainer(drone, asset) && !asset.asset) {
        let pulsingIcon = L.icon.pulse({ iconSize: [5, 5], color: "red" });
        let marker = L.marker([50, 15], { icon: pulsingIcon }).addTo(map);
        asset.asset = marker;
      } else if (
        asset.isHidden &&
        !can_detectContainer(drone, asset) &&
        asset.asset
      ) {
        map.removeLayer(asset.asset);
        asset.asset = null;
      }
    });
  });
}


setInterval(droneFunction, 100);

