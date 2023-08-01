import { pullAttackIdAssets } from "./database.js";
// const socket = io("http://localhost:3000/");
let socket_url = '122.53.86.62:3000/'
export const socket = io(socket_url);
// const socket = io("http://localhost:8000/");

// window.addEventListener("load", (e) => {
//   let ele = document.getElementById("exampleModal")
//   let myModal = new bootstrap.Modal(ele);
//   myModal.show()
// });

// let test_data = pullAttackIdAssets("20230730111207507")
// console.log(test_data)

socket.on("connect", () => {
  console.log('Socket connected', socket_url, socket.id); // x8WIv7-mJelg7on_ALbx
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
  console.log('message send', message)
  socket.emit("sendMessage", message);
}

window.sendMessage = sendMessage;



function loginTeam() {
  let ele = document.getElementById("input-team").value
  console.log(ele)
  socket.emit("setTeam", ele)

}

window.loginTeam = loginTeam;

export function collisionTransmit(aggressor, target, code) {
  //data 
  //int collisionCode
  //event 'collision'
  let inputData = {}
  let data = {};
  data.aggressor = {}
  data.target = {}
  aggressor.subAssets.forEach((subasset) => {
    let name = `${subasset.name}_${subasset.team}`
    if (data.aggressor.hasOwnProperty(name)) {
      data.aggressor[name].push(subasset.id)
    }
    else {
      data.aggressor[name] = [subasset.id]
    }
  })
  target.forEach((entity) => {
    entity.subAssets.forEach((subasset) => {
      let name = `${subasset.name}_${subasset.team}`
      if (data.target.hasOwnProperty(name)) {
        data.target[name].push(subasset.id)
      }
      else {
        data.target[name] = [subasset.id]
      }
    })
  })
  inputData.data = data
  inputData.code = code
  inputData.event = 'collision'
  console.log(inputData)
  // socket.emit("mapEvent", inputData);
  // console.log('transmitted collision to admin')
}

export function baseAttackTransmit(data, code) {
  let inputData = {}
  inputData.event = 'base_attack'
  socket.emit("mapEvent", inputData);
}


export function cityAttackTransmit(data, code) {
  let inputData = {}
  inputData.event = 'city_attack'
  socket.emit("mapEvent", inputData);
}