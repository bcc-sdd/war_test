export function collision_detection(
  asset,
  asset_bank,
  socketFnc,
  pushCollision
) {
  let collided = [];
  asset_bank.get_assets().forEach((otherAsset) => {
    if (collisionCheck(asset, otherAsset)) {
      collided.push(otherAsset);
    }
  });
  if (collided.length > 0) {
    let DBtargets = [];

    collided.forEach((entity) => {
      entity.subAssets.forEach((subasset) => {
        DBtargets.push(subasset.id);
      });
    });

    //SEND DATA
    // socketFnc(asset, collided, '123456')
    // socketFnc(asset, collided.concat(collided_base), 12345, 'missile_attack')
    let cbkdata = [asset, collided, null, "skirmish"];
    pushCollision(
      asset.attackId,
      asset.getsubAssetIds(),
      DBtargets,
      "skirmish",
      socketFnc,
      cbkdata
    );
  }
}

export function base_collision_detection(
  asset,
  asset_bank,
  base_asset_bank,
  socketFnc,
  pushCollision,
  movementDoneFnc,
  eventLogger
) {
  //TODO DETERMINE IF MISSILE
  if (false) {
  }
  let collided = [];
  let collided_base = [];
  asset_bank.get_assets().forEach((otherAsset) => {
    if (collisionCheck(asset, otherAsset)) {
      collided.push(otherAsset);
    }
  });
  console.log(base_asset_bank);
  base_asset_bank.get_assets().forEach((otherAsset) => {
    if (collisionBaseCheck(asset, otherAsset)) {
      collided_base.push(otherAsset);
    }
  });
  console.log(collided_base, collided);
  if (collided.length + collided_base.length > 0) {
    let DBtargets = asset.targetId ? [asset.targetId] : [] ;

    //TODO Target Country
    collided.forEach((entity) => {
      entity.subAssets.forEach((subasset) => {
        DBtargets.push(subasset.id);
      });
    });

    collided_base.forEach((base) => {
      DBtargets.push(base.id);
    });
    let event_name = 'missile_attack'
    //TODO
    let target = stationary_asset_bank.get_asset(asset.targetId)
    
    //SEND DATA
    let targets = collided.concat(collided_base);
    // socketFnc(asset, targets, 12345, 'missile_attack')
    pushCollision(
      this.attackId,
      asset.getsubAssetIds(),
      DBtargets,
      event_name,
      (collisionCode) => {
        let formData = new FormData();
        formData.append("collisionCode", collisionCode);
        formData.append("assetId", this.id);
        pushData(endpoints.pushExplode, formData);
        collisionTransmit(this, targets, collisionCode, event_name);
      },
      null
    );
  }
}

function collisionBaseCheck(origin, base) {
  if (origin.id == base.id || origin.team == base.team) {
    return false;
  }
  let distance = origin.getLatLng().distanceTo(base.getLatLng());
  let radius = origin.attack_radius;
  if (distance <= radius) {
    return true;
  }
  return false;
}

function collisionCheck(origin, container) {
  if (origin.id == container.id || origin.team == container.team) {
    return false;
  }
  let distance = origin.getLatLng().distanceTo(container.getLatLng());
  let radius = origin.attack_radius + container.attack_radius;
  if (distance <= radius) {
    container.pause_movement();
    return true;
  }
  return false;
}
