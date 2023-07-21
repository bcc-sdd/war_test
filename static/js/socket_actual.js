console.log("hello from socketactual");
const socket = io("http://localhost:8000/");

socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("receiveMessage", (data) => {
  console.log(socket.id, data); // x8WIv7-mJelg7on_ALbx
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
