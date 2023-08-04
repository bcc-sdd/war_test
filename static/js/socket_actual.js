import { pullAttackIdAssets } from "./database.js";
// let socket_url = "http://localhost:8000"
let socket_url = "122.53.86.62:3000/";
export const socket = io(socket_url);
// const socket = io("http://localhost:8000/");

// window.addEventListener("load", (e) => {
//   let ele = document.getElementById("exampleModal")
//   let myModal = new bootstrap.Modal(ele);
//   myModal.show()
// });

socket.on("connect", () => {
  console.log("Socket connected", socket_url, socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("receiveMessage", (data) => {
  const newDiv = document.createElement("div");
  newDiv.textContent = data;
  //   newDiv.classList.add("custom-class");
  const parentDiv = document.getElementById("chat-box");
  // Append the new div as a child of the parent div
  parentDiv.appendChild(newDiv);
});

socket.on("disconnect", () => {
  console.log(socket.id); // undefined
});

function sendMessage() {
  let chatInputEle = document.getElementById("chat-input");
  let message = chatInputEle.value;
  chatInputEle.value = "";
  console.log("message send", message);
  socket.emit("sendMessage", message);
}

window.sendMessage = sendMessage;

function loginTeam() {
  let ele = document.getElementById("input-team").value;
  console.log(ele);
  socket.emit("setTeam", ele);
}

window.loginTeam = loginTeam;

export function collisionTransmit(
  aggressor,
  targets,
  code,
  event_type = null,
) {
  console.log('ATTEMPT SOCKET TRANSMIT: COLLISION')
  console.log(targets)
  let inputData = {};
  let data = {};
  data.aggressor = [aggressor.getSquadron()];
  inputData.event = event_type;
  if (event_type == 'base_attack') {
    data.target = [{
      country: targets.team,
      assets: {
        [targets.name]: [targets.id]
      },
      is_base: true,
      type: targets.is_people ? 'population':'base'
    }]
  } else if (event_type == 'missile_attack') {
    data.target = []
    targets.forEach( target => {
      if (target.hasOwnProperty('is_base')) {
        let val = {
          country: target.team,
          is_base: true,
          assets: {
            [target.name]: [target.id]
          },
        }
        data.target.push(val)
      }
      else {
        data.target.push(target.getSquadron())
      }
    })
  }
  else {
    data.target = [];
    targets.forEach((target) => data.target.push(target.getSquadron()));
  }
  inputData.data = data;
  inputData.code = code;
  console.log(inputData);
  socket.emit("mapEvent", inputData);
  console.log('transmitted collision to admin')
}

export function baseAttackTransmit(data, code) {
  let inputData = {};
  inputData.event = "base_attack";
  socket.emit("mapEvent", inputData);
}

export function cityAttackTransmit(data, code) {
  let inputData = {};
  inputData.event = "city_attack";
  socket.emit("mapEvent", inputData);
}
