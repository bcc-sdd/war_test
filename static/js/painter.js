

export function paintExplosion(coords, map) {
  function clearExplosion(explosionAsset, map) {
    map.removeLayer(explosionAsset);
  }
  let asset = paintAsset(coords, "./static/images/Mushroom Cloud.png", map);
  setTimeout(clearExplosion, 5000, asset, map);
}

export function paintAsset(coords, iconUrl, map, hidden=false) {
  var icon = L.icon({
    iconUrl: iconUrl,
    iconSize: [30, 30], // size of the icon
    iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
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
