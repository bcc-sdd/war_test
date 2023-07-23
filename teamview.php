<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Map</title>
    <style>
        #map {
            height: 100vh;
        }
    </style>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src='https://unpkg.com/@turf/turf@6/turf.min.js'></script>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.css" />

</head>

<body>
    <div id="map"></div>
    <script src='https://unpkg.com/@turf/turf@6/turf.min.js'></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js"></script>

    <script>
        var assets = []; // Declare assets as a global variable
        var map; // Declare map as a global variable
        var markers = [];
        var animationTimers = [];
        var isUpdatingAssets = false;

        var explosionIcon = L.icon({
            iconUrl: "<?php echo base_url('assets/images/GameAssets/Mushroom Cloud.png'); ?>", // Replace with your explosion icon URL
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });
        document.addEventListener("DOMContentLoaded", function () {
            function initMap() {
                var maxBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));

                map = L.map('map', {
                    minZoom: 2,
                    maxZoom: 6,
                    maxBounds: maxBounds,
                }).setView([30, 0], 2);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
                }).addTo(map);

                updateAssets(); // Call the function once to initialize the assets
                setInterval(updateAssets, 1000); // Update assets every second
            }

            initMap();

            function updateAssets() {
                if (isUpdatingAssets) {
                    return; // Exit the function if an update is already in progress
                }

                isUpdatingAssets = true; // Set the flag to indicate an update is in progress

                $.ajax({
                    type: "POST",
                    url: "<?php echo site_url('Map_Controller/getAssignedAsset'); ?>",
                    dataType: "json",
                    data: {},
                    success: function (data) {
                        var markerGroup = L.layerGroup(); // Create a new layer group to hold the markers

                        // Clear the markerGroup from the map
                        map.removeLayer(markerGroup);

                        // Update existing assets and create new assets
                        for (var x = 0; x < data.length; x++) {
                            var newAssetData = data[x];

                            var existingAsset = assets.find(function (a) {
                                return a.id === newAssetData["ingameId"];
                            });

                            if (existingAsset) {
                                // Update existing asset properties
                                existingAsset.end = [newAssetData["endLat"], newAssetData["endLong"]];
                                existingAsset.movementStatus = newAssetData["movementStatus"];
                                existingAsset.status = newAssetData["status"];
                                existingAsset.start = [existingAsset.marker.getLatLng().lat, existingAsset.marker.getLatLng().lng];

                                if (existingAsset.movementStatus === "moving" && !existingAsset.isMoving) {
                                    existingAsset.isMoving = true;
                                    
                                    moveMarker(existingAsset.marker, existingAsset.start, existingAsset.end, existingAsset.speed,"left");
                                }
                            } else {
                                var newStart = null;
                                if (new Date() > new Date(newAssetData["timeDeparted"]) && new Date() < new Date(newAssetData["timeArrival"])) {
                                    newStart = calculateCurrentPosition(newAssetData["startLat"], newAssetData["startLong"], newAssetData["endLat"], newAssetData["endLong"],
                                        newAssetData["timeDeparted"], newAssetData["speed"])
                                } else {
                                    newStart = [newAssetData["startLat"], newAssetData["startLong"]]
                                }
                                $status = "";
                                if (newAssetData["status"] == "Alive") {
                                    $status = "<?php echo base_url('assets/images/GameAssets/'); ?>" + newAssetData["image"];
                                } else {
                                    $status = "<?php echo base_url('assets/images/GameAssets/Mushroom Cloud.png'); ?>";
                                }
                                // Create new asset
                                var newAsset = {
                                    start: newStart,
                                    end: [newAssetData["endLat"], newAssetData["endLong"]],
                                    speed: newAssetData["speed"],
                                    status: newAssetData["status"],//Alive or exploded
                                    country: newAssetData["country"],
                                    id: newAssetData["ingameId"],
                                    assetId: newAssetData["assetId"],
                                    radius: newAssetData["radius"],
                                    image: $status,
                                    mode: newAssetData["mode"],
                                    movementStatus: newAssetData["movementStatus"],//arrived or moving
                                    canDefeat: newAssetData["canDefeat"],
                                    departureTime: newAssetData["timeDeparted"],//when it depart
                                    arrivalTime: newAssetData["timeArrival"],// when will it reach its destination
                                    name: newAssetData["name"],// when will it reach its destination
                                };

                                var markerIcon = L.icon({
                                    iconUrl: newAsset.image,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 20],
                                });

                                var marker = L.marker(newAsset.start, { icon: markerIcon, asset: newAsset });
                                markerGroup.addLayer(marker); // Add the marker to the markerGroup
                                markers.push(marker);

                                
                                // Create a circle marker representing the radius of the asset
                                //var circle = L.circle(newAsset.start, { radius: newAsset.radius, color: 'red', opacity: 0.5 });
                                var circle = L.circleMarker(newAsset.start, { radius: getCircleRadius(newAsset.radius), color: 'red', opacity: 0.5 });
                                markerGroup.addLayer(circle); // Add the circle marker to the markerGroup
                                marker.options.circle = circle; // Associate the circle marker with the marker

                                // Position the circle marker on top of the marker
                                circle.bringToFront();
                                
                                newAsset.isMoving = false; // Add an isMoving flag to track if the asset is currently moving

                                newAsset.marker = marker; // Store the marker reference in the asset object
                                assets.push(newAsset);

                                if (newAsset.movementStatus === "moving" && !newAsset.isMoving) {
                                    newAsset.isMoving = true;
                                    moveMarker(marker, newAsset.start, newAsset.end, newAsset.speed,"left");
                                }
                            }
                        }
                        // Add the markerGroup to the map
                        markerGroup.addTo(map);
                        isUpdatingAssets = false; // Reset the flag after the update is complete
                    },
                    error: function (err) {
                        console.log(err);
                        isUpdatingAssets = false; // Reset the flag if an error occurs
                    },
                });
            }
            // Function to calculate the circle marker radius based on the radius value in meters
            function getCircleRadius(radius) {
                var zoom = map.getZoom();
                var metersPerPixel = 40075016.686 / Math.pow(2, zoom + 8);
                return radius / metersPerPixel;
            }
            
            function moveMarker(marker, start, end, speed) {
                var startTime = new Date().getTime();
                var totalDistance = L.latLng(start).distanceTo(L.latLng(end));
                var duration = (totalDistance / (speed * 1000 / 3600)) * 1000;
                var step = 100; // Update marker position every 100 milliseconds

                function animateMarker() {
                    var currentTime = new Date().getTime() - startTime;
                    var progress = currentTime / duration;
                    if (marker.options.asset.status === "Alive" && marker.options.asset.movementStatus == "moving") {
                        var newPosition = calculateIntermediatePosition(start, end, progress, speed);
                        if (newPosition !== null) {
                            marker.setLatLng(newPosition);
                            marker.options.asset.start = newPosition; // Update the start position with the current marker position

                            // Move the associated circle along with the marker
                            marker.options.circle.setLatLng(newPosition);
                        }
                    }

                    if (progress < 1 && marker.options.asset.movementStatus !== "arrived") {
                        setTimeout(animateMarker, step);
                        checkCollisions(marker); // Check for collisions at each step of the animation
                    } else {
                        marker.options.asset.movementStatus = "arrived";
                        if (checkCollisions(marker) !== true) {
                            updatePosition(marker.options.asset.end, marker.options.asset.id);
                        }
                    }
                    //console.log("ID: "+marker.options.asset.id+", Radius: "+marker.options.asset.radius);
                }
                if (marker.options.asset.status === "Alive") {
                    animateMarker();
                }
            }
            function calculateIntermediatePosition(start, end, progress) {
                var lat = start[0] + (end[0] - start[0]) * progress;
                var lng = start[1] + (end[1] - start[1]) * progress;
                if (lat <= -180) {
                    lat = 180
                }
                console.log(lat, lng)
                return [lat, lng];
            }

            function calculateCurrentPosition(startLat, startLng, endLat, endLng, departureTime, speed) {
                var startTime = new Date(departureTime).getTime();
                var totalDistance = L.latLng(startLat, startLng).distanceTo(L.latLng(endLat, endLng));
                var duration = (totalDistance / (speed * 1000 / 3600)) * 1000;
                var currentTime = new Date().getTime();
                var elapsed = currentTime - startTime;

                if (elapsed <= 0) {
                    return [startLat, startLng]; // Return the start position if the current time is before the departure time
                } else if (elapsed >= duration) {
                    return [endLat, endLng]; // Return the end position if the current time is after the total duration
                }

                var progress = elapsed / duration;

                var currentLat = startLat + (endLat - startLat) * progress; // Calculate the current latitude
                var currentLng = startLng + (endLng - startLng) * progress; // Calculate the current longitude

                return [currentLat, currentLng];
            }
            //successful arrival
            function updatePosition(end, id) {
                $.ajax({
                    type: "POST",
                    url: "<?php echo site_url('Map_Controller/updatePosition'); ?>",
                    dataType: "json",
                    data: {
                        ingameAssetId: id,
                        latitude: end[0],
                        longitude: end[1]
                    },
                    success: function (data) {
                        console.log("One asset successfully re-positioned!");
                        updateAssets();
                    }, error(err) {
                        console.log(err);
                    }
                });
            }
            //successful arrival
            function updateExplodedPosition(end, id, country, asset) {
                $.ajax({
                    type: "POST",
                    url: "<?php echo site_url('Map_Controller/updateExplodedPosition'); ?>",
                    dataType: "json",
                    data: {
                        ingameAssetId: id,
                        latitude: end[0],
                        longitude: end[1]
                    },
                    success: function (data) {
                        console.log(asset + " of " + country + " was destroyed!");
                        updateAssets();
                    }, error(err) {
                        console.log(err);
                    }
                });
            }
            function checkCollisions(marker) {
                markers.forEach(function (otherMarker) {
                    if (
                        otherMarker !== marker &&
                        otherMarker.options.asset.country !== marker.options.asset.country &&
                        marker.options.asset.status === "Alive" &&
                        otherMarker.options.asset.status === "Alive"
                    ) {
                        var canDefeatOther = marker.options.asset.canDefeat.includes(otherMarker.options.asset.assetId);
                        var canBeDefeatedByOther = otherMarker.options.asset.canDefeat.includes(marker.options.asset.assetId);

                        var markerRadius = marker.options.asset.radius;
                        var otherMarkerRadius = otherMarker.options.asset.radius;
                        // var markerRadius = getCircleRadius(marker.options.asset.radius);
                        // var otherMarkerRadius = getCircleRadius(otherMarker.options.asset.radius);

                        var markerLatLng = marker.getLatLng();
                        var otherMarkerLatLng = otherMarker.getLatLng();

                        //var distance = markerLatLng.distanceTo(otherMarkerLatLng);
                        var pixelDistance = markerLatLng.distanceTo(otherMarkerLatLng);
                        var zoomLevel = map.getZoom();
                        var metersPerPixel = 40075016.686 * Math.abs(Math.cos(markerLatLng.lat * Math.PI / 180)) / Math.pow(2, zoomLevel + 8);

                        var distance = pixelDistance / metersPerPixel;

                        if (canDefeatOther && !canBeDefeatedByOther && distance <= markerRadius + otherMarkerRadius) {
                            if (marker.options.asset.mode != "Re-Position") {
                                otherMarker.options.asset.status = "exploded";
                                otherMarker.setIcon(explosionIcon);
                                clearTimeout(animationTimers[otherMarker.options.asset.id]);
                                updateExplodedPosition(otherMarker.options.asset.start, otherMarker.options.asset.id, otherMarker.options.asset.country, otherMarker.options.asset.name);
                                return true;
                            }
                        } else if (canBeDefeatedByOther && !canDefeatOther && distance <= markerRadius + otherMarkerRadius) {
                            if (otherMarker.options.asset.mode != "Re-Position") {
                                marker.options.asset.status = "exploded";
                                marker.setIcon(explosionIcon);
                                clearTimeout(animationTimers[marker.options.asset.id]);
                                updateExplodedPosition(marker.options.asset.start, marker.options.asset.id, marker.options.asset.country, marker.options.asset.name);
                                return true;
                            }
                        } else if (canDefeatOther && canBeDefeatedByOther && distance <= markerRadius + otherMarkerRadius) {
                            if (otherMarker.options.asset.mode != "Re-Position" && marker.options.asset.mode == "Re-Position") {
                                marker.options.asset.status = "exploded";
                                marker.setIcon(explosionIcon);
                                clearTimeout(animationTimers[marker.options.asset.id]);
                                updateExplodedPosition(marker.options.asset.start, marker.options.asset.id, marker.options.asset.country, marker.options.asset.name);
                                return true;
                            } else if (otherMarker.options.asset.mode == "Re-Position" && marker.options.asset.mode != "Re-Position") {
                                otherMarker.options.asset.status = "exploded";
                                otherMarker.setIcon(explosionIcon);
                                clearTimeout(animationTimers[otherMarker.options.asset.id]);
                                updateExplodedPosition(otherMarker.options.asset.start, otherMarker.options.asset.id, otherMarker.options.asset.country, otherMarker.options.asset.name);
                                return true;
                            } else {
                                marker.options.asset.status = "exploded";
                                marker.setIcon(explosionIcon);
                                clearTimeout(animationTimers[marker.options.asset.id]);
                                updateExplodedPosition(marker.options.asset.start, marker.options.asset.id, marker.options.asset.country, marker.options.asset.name);

                                otherMarker.options.asset.status = "exploded";
                                otherMarker.setIcon(explosionIcon);
                                clearTimeout(animationTimers[otherMarker.options.asset.id]);
                                updateExplodedPosition(otherMarker.options.asset.start, otherMarker.options.asset.id, otherMarker.options.asset.country, otherMarker.options.asset.name);
                                return true;
                            }
                        }
                    }
                });
            }


            function updateAssetsPeriodically() {
                updateAssets();
                setTimeout(updateAssetsPeriodically, 500); // Update assets every second
            }

            updateAssetsPeriodically();
            //Add event listener for map zoom change
            map.on('zoomend', function () {
                updateMarkerRadius();
            });

            // Function to update the marker radius based on the current zoom level
            function updateMarkerRadius() {
                var zoom = map.getZoom();

                markers.forEach(function (marker) {
                    var radius = marker.options.asset.radius;
                    var metersPerPixel = 40075016.686 / Math.pow(2, zoom + 8);
                    var circleRadius = radius / metersPerPixel;

                    marker.options.circle.setRadius(circleRadius);
                });
            }
        });
    </script>
</body>

</html>
