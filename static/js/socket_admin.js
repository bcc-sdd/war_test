const socket = io("http://localhost:8000/");
// import {eventCollision, eventVisibility} from './event_manager.js'

function drawRow(id, event, aggressor, aggressor_asset, target, target_asset, decision = null, finalize = null) {

    var table = document.getElementById("main-table");
    let row = table.insertRow();
    let cellId = row.insertCell();
    let cellEvent = row.insertCell();
    let cellAggressor = row.insertCell();
    let cellAggressorAsset = row.insertCell();

    let cellTarget = row.insertCell();
    let cellTargetAsset = row.insertCell();

    let cellDecision = row.insertCell();
    let cellFinalize = row.insertCell();

    cellId.innerHTML = id;
    cellId.classList.add("new-data");

    cellEvent.innerHTML = event;
    cellEvent.classList.add("new-data");


    cellAggressor.innerHTML = aggressor;
    cellAggressor.classList.add("new-data");

    cellAggressorAsset.innerHTML = aggressor_asset;
    cellAggressorAsset.classList.add("new-data");


    cellTarget.innerHTML = target;
    cellTarget.classList.add("new-data");

    cellTargetAsset.innerHTML = target_asset;
    cellTargetAsset.classList.add("new-data");


    cellDecision.innerHTML = decision;
    cellDecision.classList.add("new-data");


    cellFinalize.innerHTML = finalize;
    cellFinalize.classList.add("new-data");
}

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
    socket.emit("setAdmin")
});


function eventCollision_admin(event) {
    socket.emit("eventCollision_dec")
    removeData(event)
}


function eventVisibility_admin(event) {
    socket.emit("eventVisibility_dec")
    removeData2(event)
}

socket.on("eventCollision_admin", (data) => {
    let idA = 'skirmish1-a'
    let idB = 'skirmish1-b'
    let htmlString = `
    <label for="${idA}" class="form-label">Aggresor qty: 5</label>
    <input type="range" class="form-range" min="0" max="100" step="0.5" id="${idA}">
    <label for="${idB}" class="form-label">Target qty: 5</label>
    <input type="range" class="form-range" min="0" max="100" step="0.5" id="${idB}">
    `
    let finalize = `
    <button type="button" class="btn btn-light" onclick="eventCollision_admin(event)">Accept</button>
    `
    drawRow(5, 'Skirmish', data[0], data[1], data[2], data[3], htmlString, finalize)
})

socket.on("eventCityTarget_admin", (data) => {
    console.log(data)
    let id = 'city6'
    let htmlString = `
    <label for="${id}" class="form-label">Population killed</label>
    <input type="range" class="form-range" min="0" max="100" step="0.5" id="${id}">

    `
    let finalize = `
    <button type="button" class="btn btn-light" onclick="removeData(event)">Accept</button>
    `
    drawRow(6, 'City Attack', data[0], data[1], data[2], data[3], htmlString, finalize)
})

// let htmlString = `
// <div class="btn-group">
//     <button type="button" class="btn btn-light" onclick="removeData(event)">Accept</button>
//     <button type="button" class="btn btn-dark">Reject</button>
// </div>
// `
socket.on("eventVisibility_admin", (data) => {
    let idA = 'visiA'
    let idB = 'visiB'
    let htmlString = `
    <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="${idA}">
        <label class="form-check-label" for="${idA}">Reveal asset</label>
    </div>
    <div class="form-check form-switch">
        <input class="form-check-input" type="checkbox" role="switch" id="${idB}" checked>
        <label class="form-check-label" for="${idB}">Reveal asset type</label>
    </div>
    `
    let finalize = `
    <div class="btn-group">
        <button type="button" class="btn btn-light" onclick="eventVisibility_admin(event)">Accept</button>
        <button type="button" class="btn btn-dark" onclick="eventVisibility_admin(event)">Reject</button>
    </div>    `
    drawRow(7, 'Radar Detect', data[0], data[1], data[2], data[3], htmlString, finalize)
})

socket.on("broadcastAction", (data) => {
    console.log(data)
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx


});

function removeData(event) {
    event.srcElement.parentElement.parentElement.remove()
    socket.emit("result", "ok")
}


function removeData2(event) {
    event.srcElement.parentElement.parentElement.parentElement.remove()
    socket.emit("result", "ok")
}

window.removeData = removeData
