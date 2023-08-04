var crosshairLat = null;
var crosshairLng = null;
var map = null;

export default function init_map() {
    document.getElementById('map').style.cursor = 'pointer'
    init_map_action();
    // spawnGoons();
    
    map.on("mousemove", onMouseMove);
    return map;
}


function onMouseMove(e) {
    crosshairLat.setLatLngs([new L.LatLng(e.latlng.lat, -180).wrap(), new L.LatLng(e.latlng.lat, 180).wrap()]);
    crosshairLng.setLatLngs([new L.LatLng(-90, e.latlng.lng).wrap(), new L.LatLng(90, e.latlng.lng).wrap()]);
}

function init_map_action() {
    var maxBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
    map = L.map("map", {
        attributionControl: false,
        minZoom: 2,
        maxZoom: 6,
        maxBounds: maxBounds,
    }).setView([30, 0], 2);
    let mapUrlARCGIS = 'http://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
    let mapUrlOSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    L.tileLayer(mapUrlOSM).addTo(
        map
    );
    let options = {
        color: "green",
        weight: 1,
        opacity: 1,
        smoothFactor: 1,
        noWrap: false,
    }
    let options1 = {
        color: "red",
        weight: 0.5,
        opacity: 1,
        bubblingMouseEvents: false,
        // smoothFactor: 1,
        // noWrap: false,
    }
    //init lines for IDL and PM
    var pointA = new L.LatLng(90, 180.0);
    var pointB = new L.LatLng(-90, 180.0);
    var pointList = [pointA, pointB];
    var idl = new L.polyline(pointList, options);
    idl.addTo(map);
    var pointA = new L.LatLng(90, -180.0);
    var pointB = new L.LatLng(-90, -180.0);
    var pointList = [pointA, pointB];
    var idl2 = new L.polyline(pointList, options);
    idl2.addTo(map);
    // paintTestIcon(map, assetBank);
    crosshairLat = new L.polyline([new L.LatLng(0, -180), new L.LatLng(0, 180)], options1);
    crosshairLng = new L.polyline([new L.LatLng(90, 0), new L.LatLng(-90, 0)], options1);
    let newLayer = new L.layerGroup([crosshairLat, crosshairLng], { interactive: false })
    newLayer.addTo(map)
}
