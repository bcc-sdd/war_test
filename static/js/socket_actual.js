console.log("hello from socketactual");
const socket = io("http://localhost:8000/");


window.addEventListener("load", (e) => {
  let ele = document.getElementById("exampleModal")
  let myModal = new bootstrap.Modal(ele);
  myModal.show()
});

function loginTeam() {
  let ele = document.getElementById("input-team").value
  console.log(ele)
  socket.emit("setTeam", ele)

}

var team = null;
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
  socket.emit("sendMessage", message);
}
