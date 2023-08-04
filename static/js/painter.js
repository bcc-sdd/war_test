var usaicon = L.icon({
  iconUrl: "http://122.53.86.62:1945/assets/images/GameAssets/Mushroom Cloud USA.png",
  iconSize: [30, 30], // size of the icon
  iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
  // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var chinaicon = L.icon({
  iconUrl: "http://122.53.86.62:1945/assets/images/GameAssets/Mushroom Cloud CHINA.png",
  iconSize: [30, 30], // size of the icon
  iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
  // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var ruicon = L.icon({
  iconUrl: "http://122.53.86.62:1945/assets/images/GameAssets/Mushroom Cloud RUSSIA.png",
  iconSize: [30, 30], // size of the icon
  iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
  // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

var inicon = L.icon({
  iconUrl: "http://122.53.86.62:1945/assets/images/GameAssets/Mushroom Cloud INDIA.png",
  iconSize: [30, 30], // size of the icon
  iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
  // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
});

let mushicons = {
  'USA': usaicon,
  'CHINA': chinaicon,
  'RUSSIA': ruicon,
  'INDIA': inicon
}

export function getExplodedIcon(country) {
  return mushicons[country]
}

export function paintBase(asset, country) {
  asset.setIcon(mushicons[country])
}

export function paintExplosion(coords, map, country) {
  function clearExplosion(explosionAsset, map) {
    map.removeLayer(explosionAsset);
  }
  var icon = mushicons[country]
  var assetMarker = L.marker(coords, {
    icon: icon,
    opacity: 1,
    rotationAngle: 0,
  });
  assetMarker.addTo(map);
  setTimeout(clearExplosion, 5000, assetMarker, map)
  return assetMarker;
}

export function paintAsset(coords, iconUrl, map, hidden=false, iconvar=null) {
  console.log(coords)
  var icon = L.icon({
    iconUrl: iconUrl,
    iconSize: [18, 18], // size of the icon
    iconAnchor: [9, 9], // point of the icon which will correspond to marker's location
    // popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
  });
  var assetMarker = L.marker(coords, {
    icon: icon,
    opacity: 1,
    rotationAngle: 0,
  });
  if (!hidden) {
    assetMarker.addTo(map);
  }
  return assetMarker;
}

export function paintCircle(
  coords,
  map,
  color = "green",
  radius = 5000,
  fillOpacity = 0.2
) {
  var circleObject = L.circle(coords, {
    color: color,
    fillOpacity: fillOpacity,
    radius: radius,
    weight: 0.5,
  });
  circleObject.addTo(map);
  return circleObject;
}

export function orientAsset(toOrientAsset) {
  function computeAngle(aLat, aLng, bLat, bLng) {
    return (Math.atan2(bLng - aLng, bLat - aLat) * 180) / Math.PI - 90;
  }
  if (toOrientAsset.currentPath === null) {
    return;
  }
  let currentPath = toOrientAsset.currentPath;
  // console.log("REORIENT ME");
  // if (toOrientAsset.done) {
  // }
  // else {
  //   currentPath = ;
  // }
  let headingAngle = computeAngle(
    currentPath.start.lat,
    currentPath.start.lng,
    currentPath.end.lat,
    currentPath.end.lng
  );
  // if (currentPath.length == 2) {
  //   toOrientAsset.asset.setRotationAngle(
  //     currentPath.start.lng < currentPath.end.lng ?  headingAngle : 180
  //   );
  // } else {
  //   toOrientAsset.asset.setRotationAngle(
  //     currentPath.start.lng > currentPath.end.lng ? 180 : headingAngle
  //   );
  // }
  if (currentPath.length == 2) {
    toOrientAsset.asset.setRotationAngle(
      currentPath.start.lng < currentPath.end.lng ? 180 : headingAngle
    );
  } else {
    toOrientAsset.asset.setRotationAngle(
      currentPath.start.lng > currentPath.end.lng ? headingAngle : headingAngle
    );
  }
  toOrientAsset.isReoriented = true;
}
