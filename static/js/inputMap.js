import init_map from "./init_map.js";
import { drawPoint, drawPaths, computePaths } from "./drawFunctions.js"
var map = null;
var waypoints = []

async function pullData(lat, lng) {
    const fetchPromise = await fetch(`http://localhost:3000/search/reverse/raw?lat=${lat}&lon=${lng}`);
    return await fetchPromise.json()
}

async function displayCoordsData(e) {
    console.log(e)
    let lat = e.latlng.wrap().lat;
    let lng = e.latlng.wrap().lng;
    let data;
    try {
        data = await pullData(lat, lng);
        data = data.features[0].properties.geonunit;
    }
    catch {
        data = 'Body of Water'
    }
    // let data = 'To implement'
    console.log(data)
    // const data = await response2.json();
    // console.log(data)


    let point = e.latlng.wrap();
    let pointObj = drawPoint(map, point, true)
    waypoints.push({
        pointObj: pointObj,
        path: null,
        point: point
    })
    let pointsLength = waypoints.length;
    if (pointsLength > 1) {
        let start = waypoints[pointsLength - 2].point
        let end = waypoints[pointsLength - 1].point
        let paths = computePaths(start, end)
        drawPaths(map, paths)
        waypoints[pointsLength - 1].path = paths
    }
    let htmlString = `
        <div class="btn-group">
            <button type="button" class="btn btn-light" onclick="removeData(event)">Accept</button>
            <button type="button" class="btn btn-dark">Reject</button>
        </div>
    `
    var table = document.getElementById("main-table");
    let row = table.insertRow();
    let cell1 = row.insertCell();
    let cell2 = row.insertCell();
    let cell3 = row.insertCell();
    cell1.innerHTML = point.lat.toFixed(2);
    cell2.innerHTML = point.lng.toFixed(2);
    cell3.innerHTML = data;
}


document.addEventListener("DOMContentLoaded", async function () {
    map = init_map();
    // const response = await fetch("http://localhost:8000/geojson");
    // const geojsonFeature = await response.json();
    // L.geoJSON(geojsonFeature).addTo(map);
    // const response2 = await fetch("http://localhost:8000/geojson_coastline");
    // const geojsonFeature_coastline = await response2.json();
    // L.geoJSON(geojsonFeature_coastline).addTo(map);
    map.on("click", displayCoordsData)

})


function purgeWaypoints() {
    for (let i = waypoints.length; i--; i >= 0) {
        undoAddWaypoint()
    }
}
window.purgeWaypoints = purgeWaypoints

function undoAddWaypoint() {
    if (waypoints.length == 0) {
        return
    }
    var table = document.getElementById("main-table").deleteRow(waypoints.length);
    let data = waypoints.pop()
    map.removeLayer(data.pointObj)
    data.path.forEach((path) => {
        map.removeLayer(path.polyline)
    })

}
window.undoAddWaypoint = undoAddWaypoint

