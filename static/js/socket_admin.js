var site_url = "122.53.86.62/";

// const socket_admin = io("http://localhost:8000/");

const socket_admin = io(`${site_url}:3000`);
// const socket_admin = socket;

var collisionCodes = {};
// import {eventCollision, eventVisibility} from './event_manager.js'

function drawRow(id, event, decision, finalize) {
  var table = document.getElementById("main-table");
  let row = table.insertRow();
  let cellId = row.insertCell();
  let cellEvent = row.insertCell();
  let cellDecision = row.insertCell();
  let cellFinalize = row.insertCell();

  cellId.innerHTML = id;
  cellId.classList.add("new-data");

  cellEvent.innerHTML = event;
  cellEvent.classList.add("new-data");

  cellDecision.innerHTML = decision;
  cellDecision.classList.add("new-data");

  cellFinalize.innerHTML = finalize;
  cellFinalize.classList.add("new-data");
}

socket_admin.on("connect", () => {
  console.log(socket_admin.id); // x8WIv7-mJelg7on_ALbx
  socket_admin.emit("setAdmin");
});

async function pushData(url, data) {
  const request = new XMLHttpRequest();
  request.open("POST", `http://122.53.86.62:1945/${url}`);
  request.send(data);
  request.onload = function () {
    if (request.status != 200) {
      console.log(request.status, request.response);
    } else {
      console.log(request.response);
    }
  };
  request.onerror = function () {
    alert("Request failed");
  };
}

let events = 0;

function getSliderEntityHtml(
  name,
  quantity,
  id_array,
  code,
  idx,
  is_aggressor = true
) {
  let idA = `event_${is_aggressor ? "agg" : "targ"}_${code}`;
  let labelId = `label-${idA}-${idx}`;
  let sliderId = `${idA}-${idx}`;
  return `<label for="${sliderId}" class="form-label" id="${labelId}" data-label="${name}">
            ${name} (${quantity} ► ${Math.ceil(quantity / 2)})
        </label>
        <input type="range" class="form-range" min="0" max="${quantity}" step="1" id="${sliderId}"
            onchange=slider(event)
            data-collision="${code}" data-entities="${JSON.stringify(
    id_array
  )}" data-type="${is_aggressor ? "aggresor" : "target"}"
        >`;
}

function getSwitchHtml(name, country) {
  let htmlString = `
        <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault">
            <label class="form-check-label" for="flexSwitchCheckDefault">Default switch checkbox input</label>
        </div>`;
  return htmlString;
}

function getAcceptButonHtml(event) {
  return `
    <button type="button" class="btn btn-light" onclick="${event}(event, true)">Accept</button>
    <button type="button" class="btn btn-dark" onclick="${event}(event, false)">Decline</button>
    `;
}

function getToggle() {
  return `<input class="tgl tgl-flip" id="cb5" type="checkbox"/>
    <label class="tgl-btn" data-tg-off="Dead" data-tg-on="Alive" for="cb5"></label>`;
}

function getHtml(data, code, base_attack = false) {
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
  let idx = 0;
  let htmlString = `<div class="row"><div class="col" style="border-right: 1px solid grey">`;
  data.aggressor.forEach((agg) => {
    Object.entries(agg.assets).forEach((entries) => {
      let name = entries[0];
      let asset_ids = entries[1];
      htmlString += `<div><img src="http://122.53.86.62:1945/assets/images/GameAssets/${countryConverter(
        agg.country
      )}.png"></div>`;
      htmlString += getSliderEntityHtml(
        name,
        asset_ids.length,
        asset_ids,
        code,
        idx,
        true
      );
    });
    idx += 1;
  });
  htmlString += `</div>`;
  idx = 0;
  htmlString += `<div class="col">`;
  if (!base_attack) {
    data.target.forEach((agg) => {
      Object.entries(agg.assets).forEach((entries) => {
        let name = entries[0];
        let asset_ids = entries[1];
        htmlString += `<div><img src="http://122.53.86.62:1945/assets/images/GameAssets/${countryConverter(
          agg.country
        )}.png"></div>`;
        htmlString += getSliderEntityHtml(
          name,
          asset_ids.length,
          asset_ids,
          code,
          idx,
          false
        );
      });
      idx += 1;
    });
  } else {
    let targetData = data.target;
    let name = targetData.name;
    let country = targetData.country;
    htmlString += `<div><img src="http://122.53.86.62:1945/assets/images/GameAssets/${countryConverter(
      country
    )}.png"></div>`;
    htmlString += `<div>${name}</div>`;
    htmlString += getToggle();
  }
  htmlString += `</div></div>`;
  let finalize = getAcceptButonHtml("eventCollision_admin");
  return [htmlString, finalize];
}

//BTNFNC
async function eventCollision_admin(event, dec) {
  if (!dec) {
    event.srcElement.parentElement.parentElement.remove();
    return;
  }
  let endpoint = "Map_Controller/updateExplodedAsset";
  let collisionCode =
    event.srcElement.parentElement.parentElement.cells[0].innerHTML;
  let eles = document.querySelectorAll(`[data-collision='${collisionCode}']`);
  eles.forEach((ele) => {
    let entities = JSON.parse(ele.dataset["entities"]);
    let dead = ele.max - ele.value;
    if (ele.dataset["type"] == "aggresor") {
      entities.slice(0, dead).forEach((id) => {
        let formData = new FormData();
        formData.append("collisionCode", collisionCode);
        formData.append("assetId", id);
        console.log(`attempting to write agg exploded id:${id}`);
        socket_admin.emit("destroyedAsset", id);
        pushData(endpoint, formData);
      });
      console.log(entities.slice(dead), entities, dead);
      socket_admin.emit("continueMovement", entities.slice(dead));
    } else {
      entities.slice(0, dead).forEach((id) => {
        let formData = new FormData();
        formData.append("collisionCode", collisionCode);
        formData.append("assetId", id);
        pushData(endpoint, formData);
        console.log(`attempting to write targ exploded id:${id}`);
        socket_admin.emit("destroyedAsset", id);
      });
      socket_admin.emit("continueMovement", entities.slice(dead));
    }
  });
  event.srcElement.parentElement.parentElement.remove();
}
window.eventCollision_admin = eventCollision_admin;

socket_admin.on("event_admin_city_attack", (incomingData) => {
  let event_name = "City Attack";
  let code = incomingData.code;
  console.log(incomingData, "asdasd");
  let [htmlString, finalize] = getHtml(incomingData.data, code, true);
  console.log(incomingData);
  drawRow(code, event_name, htmlString, finalize);
});

socket_admin.on("event_admin_base_attack", (incomingData) => {
  let event_name = "Base Attack";
  let code = incomingData.code;
  console.log(incomingData, "asdasd");
  let [htmlString, finalize] = getHtml(incomingData.data, code, true);
  console.log(incomingData, htmlString);
  drawRow(code, event_name, htmlString, finalize);
});

socket_admin.on("event_admin_collision", (incomingData) => {
  console.log("enter collision");
  let event_name = "Skirmish";
  let code = incomingData.code;
  let [htmlString, finalize] = getHtml(incomingData.data, code, false);
  drawRow(code, event_name, htmlString, finalize);
});

function countryConverter(team) {
  switch (team) {
    case "US":
    case "us":
    case "USA":
    case "usa":
      return "us";
    case "China":
    case "CHINA":
      return "cn";
    case "Russia":
    case "RUSSIA":
      return "ru";
    case "India":
    case "INDIA":
      return "in";
    case undefined:
      return "aq";
  }
}

function slider(event) {
  let val = event.srcElement.value;
  let max = event.srcElement.max;
  let ele = document.getElementById(`label-${event.srcElement.id}`);
  let eleLabel = ele.dataset["label"];
  ele.innerHTML = `${eleLabel} (${max} ► ${val})`;
}

// let htmlString = `
// <div class="btn-group">
//     <button type="button" class="btn btn-light" onclick="removeData(event)">Accept</button>
//     <button type="button" class="btn btn-dark">Reject</button>
// </div>
// `

socket_admin.on("broadcastAction", (data) => {
  console.log(data);
  console.log(socket_admin.id); // x8WIv7-mJelg7on_ALbx
});

async function pullData(url) {
  const fetchPromise = await fetch(`${siteUrl}${url}`);
  console.log(fetchPromise);
  return await fetchPromise.json();
}

document.addEventListener("DOMContentLoaded", async function () {
  return;
  const fetchPromise = await fetch(
    `http://122.53.86.62:1945/Facilitator_Controller/collisionRequests`
  );
  let data = await fetchPromise.json();
  data.forEach((subdata) => {
    if (!collisionCodes.hasOwnProperty(subdata.collisionCode)) {
      let collisionObject = {};
      /* {
                collisionCode
                attackId: int
                collisionStatus: pending/?approved
                target: array[int]
                aggressor: array[int]
            }*/
      collisionObject.collisionCode = subdata.collisionCode;
      collisionObject.collisionStatus = subdata.collisionStatus;
      //TODO
      let aggressor = {
        country: subdata.aggressorProperties[2],
        assets: {
          [subdata.aggressorProperties[1]]: [subdata.aggressorId],
        },
      };
      let target = {
        country: subdata.targetProperties[2],
        assets: {
          [subdata.targetProperties[1]]: [subdata.targetId],
        },
      };
      collisionObject.aggressor = [aggressor];
      collisionObject.target = [target];
      collisionCodes[subdata.collisionCode] = collisionObject;
      // assetProperties[subdata.aggressorId] = subdata.aggressorProperties;
      // assetProperties[subdata.targetId] = subdata.targetProperties;
    } else {
      let collisionObject = collisionCodes[subdata.collisionCode];
      let agglen = collisionObject.aggressor.length;
      for (i = 0; i < agglen; i++) {
        let aggressorObj = collisionObject.aggressor[i].assets;
        if (!aggressorObj.hasOwnProperty(subdata.aggressorProperties[1])) {
          aggressorObj[subdata.aggressorProperties[1]].push(
            subdata.aggressorId
          );
        } else {
          aggressorObj[subdata.aggressorProperties[1]] = [subdata.aggressorId];
        }
      }
      let targlen = collisionObject.target.length;
      for (i = 0; i < targlen; i++) {
        let targetObj = collisionObject.target[i].assets;
        if (!targetObj.hasOwnProperty(subdata.targetProperties[1])) {
          targetObj[subdata.targetProperties[1]].push(subdata.targetId);
        } else {
          targetObj[subdata.targetProperties[1]] = [subdata.targetId];
        }
      }
    }
  });
  Object.entries(collisionCodes).forEach((entry) => {
    let code = entry[0];
    let data = entry[1];

    let [htmlString, finalize] = getHtml(data, code);
    drawRow(code, "null", htmlString, finalize);
  });
});
