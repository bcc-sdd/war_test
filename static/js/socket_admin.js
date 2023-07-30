const socket = io("http://localhost:8000/");
// import {eventCollision, eventVisibility} from './event_manager.js'

// /'updateExplodedAsset'

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
