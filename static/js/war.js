document.addEventListener("DOMContentLoaded", function () {
    function initMap() {
        var maxBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

        map = L.map('map', {
            minZoom: 2,
            maxZoom: 6,
            maxBounds: maxBounds,
        }).setView([30, 0], 2);
        // var map = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        }).addTo(map);

        // updateAssets(); // Call the function once to initialize the assets
        // setInterval(updateAssets, 1000); // Update assets every second
    }
    initMap();
})