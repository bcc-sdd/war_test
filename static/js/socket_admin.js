var site_url = '122.53.86.62/'
const socket_admin = io(`${site_url}:3000`);
// const socket_admin = socket;

var collisionCodes = {}
// import {eventCollision, eventVisibility} from './event_manager.js'

function drawRow(id, event, aggressor, aggressor_asset, target, target_asset, decision = null, finalize = null) {

    var table = document.getElementById("main-table");
    let row = table.insertRow();
    let cellId = row.insertCell();
    let cellEvent = row.insertCell();
    let cellAggressor = row.insertCell();
    let cellTarget = row.insertCell();
    let cellDecision = row.insertCell();
    let cellFinalize = row.insertCell();

    cellId.innerHTML = id;
    cellId.classList.add("new-data");

    cellEvent.innerHTML = event;
    cellEvent.classList.add("new-data");


    cellAggressor.innerHTML = `<div>${aggressor}</div><div>${aggressor_asset}</div>`;
    cellAggressor.classList.add("new-data");



    cellTarget.innerHTML = `<div>${target}</div><div>${target_asset}</div>`;
    cellTarget.classList.add("new-data");


    cellDecision.innerHTML = decision;
    cellDecision.classList.add("new-data");


    cellFinalize.innerHTML = finalize;
    cellFinalize.classList.add("new-data");
}

socket_admin.on("connect", () => {
    console.log(socket_admin.id); // x8WIv7-mJelg7on_ALbx
    socket_admin.emit("setAdmin")
});



async function pushMovementDone(assetId, lat, lng) {
    const formData = new FormData();
    formData.append('ingameAssetId', assetId);
    let endpoint = 'Map_Controller/updatePosition'
    pushData(endpoint, formData)
}

async function pushData(url, data) {
    const request = new XMLHttpRequest();
    request.open("POST", `http://122.53.86.62:1945/${url}`);
    request.send(data);
    request.onload = function () {
        if (request.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            console.log(request.response)
        }
    };

    request.onerror = function () {
        alert("Request failed");
    };
}

function makeRequest(url, data) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(data);
    });
}


let events = 0

function getSliderEntityHtml(name, quantity, id_array, code, idx, is_aggressor = true) {
    let idA = `event_${is_aggressor ? 'agg' : 'targ'}_${code}`
    let labelId = `label-${idA}-${idx}`
    let sliderId = `${idA}-${idx}`
    return `<label for="${sliderId}" class="form-label" id="${labelId}" data-label="${name}">
            ${name} (${quantity} ► ${Math.ceil(quantity / 2)})
        </label>
        <input type="range" class="form-range" min="0" max="${quantity}" step="1" id="${sliderId}"
            onchange=slider(event)
            data-collision="${code}" data-entities="${JSON.stringify(id_array)}" data-type="target"
        >`
}

function getEntityHtml(entities, entity_array) {
    let htmlString = ''
    Object.entries(entities).forEach((entries) => {
        entity_array.push({ quantity: entries[1].length, name: entries[0], entities: entries[1] })
        htmlString += `<div>${entries[1].length} ${entries[0]}</div>`
    })
}

function getAcceptButonHtml(event) {
    return `
    <button type="button" class="btn btn-light" onclick="${event}(event, true)">Accept</button>
    <button type="button" class="btn btn-dark" onclick="${event}(event, false)">Decline</button>
    `

}

function getHtml(incomingData, code) {
    /*
    incomingData
        event: "collision",
        data: {
        agg_team: 'India',
        aggressor: {'Raptor': [1, 2, 3, 4, 5] },
        target: {'Plane': [12, 1, 2, 3, 5], 'Tank': [12, 1, 2, 3, 5] },
        targ_team: 'Russia'
        }

    
    */
    let data = incomingData.data;
    let agg_team = `<img src="http://122.53.86.62:1945/assets/images/GameAssets/${countryConverter(data.agg_team)}.png">`
    let targ_team = `<img src="http://122.53.86.62:1945/assets/images/GameAssets/${countryConverter(data.targ_team)}.png">`
    let aggressor = []
    let target = []
    let aggressorHTML = getEntityHtml(data.aggressor, aggressor)
    let targetHTML = getEntityHtml(data.target, target)
    let idx = 0;
    let htmlString = `<div class="row"><div class="col" style="border-right: 1px solid grey">`
    aggressor.forEach((agg) => {
        htmlString += getSliderEntityHtml(agg.name, agg.quantity, agg.entities, code, idx, true)
        idx += 1;
    })
    htmlString += `</div>`
    idx = 0;
    htmlString += `<div class="col">`
    target.forEach((targ) => {
        htmlString += getSliderEntityHtml(targ.name, targ.quantity, targ.entities, code, idx, false)
        idx += 1;
    })
    htmlString += `</div></div>`
    let finalize = getAcceptButonHtml('eventCollision_admin')
    return [agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize]
}

//BTNFNC
async function eventCollision_admin(event, dec) {
    if (!dec) {
        return
    }
    let endpoint = 'Map_Controller/updateExplodedAsset'
    let collisionCode = event.srcElement.parentElement.parentElement.cells[0].innerHTML
    let eles = document.querySelectorAll(`[data-collision='${collisionCode}']`)
    eles.forEach((ele) => {
        let entities = JSON.parse(ele.dataset["entities"])
        let dead = ele.max - ele.value
        if (ele.dataset["type"] == 'aggressor') {
            entities.slice(0, dead).forEach((id) => {
                let formData = new FormData();
                formData.append('collisionCode', collisionCode)
                formData.append('assetId', id)
                console.log(`attempting to write agg exploded id:${id}`)
                socket_admin.emit('destroyedAsset', id)
                pushData(endpoint, formData)
            })
            entities.slice(dead).forEach((id) => {
                let formData = new FormData();
                console.log(`attempting to write agg movement done id:${id}`)
                // pushMovementDone(id)
            })
        }
        else {
            entities.slice(0, dead).forEach((id) => {
                let formData = new FormData();
                formData.append('collisionCode', collisionCode)
                formData.append('assetId', id)
                pushData(endpoint, formData)
                console.log(`attempting to write targ exploded id:${id}`)
                socket_admin.emit('destroyedAsset', id)

            })
        }
    })
    event.srcElement.parentElement.parentElement.remove()
}
window.eventCollision_admin = eventCollision_admin

socket_admin.on("event_admin_city_attack", (incomingData) => {
    let code = incomingData.code
    let event_name = 'City Attack'
    let [agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize] = getHtml(incomingData, code, false)
    drawRow(5, event_name, agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize)
})

socket_admin.on("event_admin_city_attack", (incomingData) => {
    console.log(incomingData)
})


socket_admin.on("event_admin_collision", (incomingData) => {
    let event_name = 'Skirmish'
    let code = incomingData.code
    console.log(incomingData, 'asdasd')
    let [agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize] = getHtml(incomingData, code)
    drawRow(code, event_name, agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize)
})

function countryConverter(team) {
    switch (team) {
        case 'US': case 'us': case 'USA': case 'usa': return 'us';
        case 'China': case 'CHINA': return 'cn';
        case 'Russia': case 'RUSSIA': return 'ru';
        case 'India': case 'INDIA': return 'in';
        case undefined: return 'aq'
    }

}

function slider(event) {
    let val = event.srcElement.value
    let max = event.srcElement.max
    let ele = document.getElementById(`label-${event.srcElement.id}`)
    let eleLabel = ele.dataset["label"]
    ele.innerHTML = `${eleLabel} (${max} ► ${val})`
}

// let htmlString = `
// <div class="btn-group">
//     <button type="button" class="btn btn-light" onclick="removeData(event)">Accept</button>
//     <button type="button" class="btn btn-dark">Reject</button>
// </div>
// `


socket_admin.on("broadcastAction", (data) => {
    console.log(data)
    console.log(socket_admin.id); // x8WIv7-mJelg7on_ALbx


});



async function pullData(url) {
    const fetchPromise = await fetch(`${siteUrl}${url}`);
    console.log(fetchPromise)
    return await fetchPromise.json()
}


document.addEventListener("DOMContentLoaded", async function () {
    const fetchPromise = await fetch(`http://122.53.86.62:1945/Facilitator_Controller/collisionRequests`);

    let assetProperties = {}
    let data = await fetchPromise.json()





    data.forEach((subdata) => {
        if (!collisionCodes.hasOwnProperty(subdata.collisionCode)) {
            let collisionObject = {}
            /* {
                collisionCode
                attackId: int
                collisionStatus: pending/?approved
                target: array[int]
                aggressor: array[int]
            }*/
            collisionObject.collisionCode = subdata.collisionCode;
            collisionObject.attackId = subdata.attackId;
            collisionObject.collisionStatus = subdata.collisionStatus;
            collisionObject.target = [subdata.targetId];
            collisionObject.aggressor = [subdata.aggressorId];
            collisionCodes[subdata.collisionCode] = collisionObject;
            assetProperties[subdata.aggressorId] = subdata.aggressorProperties;
            assetProperties[subdata.targetId] = subdata.targetProperties;

        }
        else {
            let collisionObject = collisionCodes[subdata.collisionCode]
            if (!collisionObject.target.includes(subdata.targetId)) {
                console.log('target', subdata.targetId)
                collisionObject.target.push(subdata.targetId)
                assetProperties[subdata.targetId] = subdata.targetProperties;
            }
            if (!collisionObject.aggressor.includes(subdata.aggressorId)) {
                console.log('aggresor', subdata.aggressorId)
                collisionObject.aggressor.push(subdata.aggressorId)
                assetProperties[subdata.aggressorId] = subdata.aggressorProperties;
            }
        }
    })
    console.log(collisionCodes)
    Object.values(collisionCodes).forEach((collisionObject) => {
        /*
        incomingData
            {
            event: "collision",
            code: '123123123',
            data: {
                agg_team: 'India',
                aggressor: {attack_id_xxx:, country: us, entities: [{assetname: 'Raptor', ids: [1, 2, 3, 4, 5]} }},
                target: { 'Plane': [12, 1, 2, 3, 5], 'Tank': [12, 1, 2, 3, 5] },
                targ_team: 'Russia'
            }
        */
        console.log(collisionObject)
        let data = {
            event: 'Skirmish',
            data: {
                agg_team: null,
                aggressor: {},
                targ_team: null,
                target: {}
            }

        }
        //TODO group according to type
        collisionObject.target.forEach((subtargetID) => {
            //subtarget is int ID
            let subtargetProperty = assetProperties[subtargetID]
            let name = subtargetProperty[1] || 'unknown'
            // console.log(assetProperties, subtargetID, subtargetProperty, name)
            if (!data.data.target.hasOwnProperty(name)) {
                data.data.target[name] = [subtargetID]
            }
            else {
                data.data.target[name].push(subtargetID)
            }
            if (!data.data.agg_team) {
                data.data.agg_team = assetProperties[subtargetID][2]
            }
        })
        collisionObject.aggressor.forEach((subtargetID) => {
            //subtarget is int ID
            let subtargetProperty = assetProperties[subtargetID]
            let name = subtargetProperty[1] || 'unknown'

            if (!data.data.aggressor.hasOwnProperty(name)) {
                data.data.aggressor[name] = [subtargetID]
            }
            else {
                data.data.aggressor[name].push(subtargetID)
            }
            if (!data.data.targ_team) {
                data.data.targ_team = assetProperties[subtargetID][2]
            }
        })
        // data.data.agg_team = assetProperties[data.data.aggressor[0]]?.[2];
        // data.data.targ_team = assetProperties[data.data.target[0]]?.[2];
        collisionCodes[collisionObject.collisionCode].target_grouped = data.data.target
        collisionCodes[collisionObject.collisionCode].aggressor_grouped = data.data.aggressor

        let [agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize] = getHtml(data, collisionObject.collisionCode)
        drawRow(collisionObject.collisionCode, data.event, agg_team, aggressorHTML, targ_team, targetHTML, htmlString, finalize)
    })

})
