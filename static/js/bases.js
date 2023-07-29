
export default function paintBase(map) {
    let pulsingIcon = L.icon.pulse({iconSize:[10,10],color:'red'});
    console.log('TO PAINT BASE')
    let coords = [45, -104]
    var greenIcon = L.icon({
        iconUrl: "./static/images/bio.png",
        // shadowUrl: 'leaf-shadow.png',
        // shadowSize: [50, 64], // size of the shadow

        iconSize: [60, 60], // size of the icon
        iconAnchor: [30, 30], // point of the icon which will correspond to marker's location
        // shadowAnchor: [4, 62],  // the same for the shadow
        // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
    });
    var assetMarker = L.marker(coords, {
        // icon: greenIcon,
        icon: pulsingIcon,
        opacity: 1,
        rotationAngle: 0,
    });
    assetMarker.addTo(map);
    // assetMarker.bindPopup("Content Test").openPopup();
    return assetMarker;
}