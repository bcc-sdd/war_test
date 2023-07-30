import { pullAttackIdAssets } from "./database.js";

console.log("hello from socketactual");
// const socket = io("http://localhost:3000/");

const socket = io("122.53.86.62:3000/");
// const socket = io("http://localhost:8000/");
export default socket;

// window.addEventListener("load", (e) => {
//   let ele = document.getElementById("exampleModal")
//   let myModal = new bootstrap.Modal(ele);
//   myModal.show()
// });

let test_data = pullAttackIdAssets("20230730111207507")
console.log(test_data)

socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
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

const socket2 = io("http://122.53.86.62:3000/");

socket2.on("connect", ()=>{
  console.log('SOCKET 2 CONNECTED')
})
