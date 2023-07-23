const socket = io("http://localhost:8000/");

socket.on("connect", () => {
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});


socket.on("broadcastAction", (data) => {
    console.log(data)
    console.log(socket.id); // x8WIv7-mJelg7on_ALbx
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
    cell1.innerHTML = "1";
    cell1.classList.add("new-data");
    cell2.innerHTML = data;
    cell2.classList.add("new-data");

    cell3.innerHTML = htmlString;
    cell3.classList.add("new-data");

});

function removeData(event) {
    event.srcElement.parentElement.parentElement.parentElement.remove()
    socket.emit("result", "ok")
}

window.removeData = removeData
