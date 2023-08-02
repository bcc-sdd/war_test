export function collision_detection(
    asset,
    asset_bank,
    socketFnc,
    pushCollision,
    movementDoneFnc,
    eventLogger
) {
    let collided = []
    asset_bank.get_assets().forEach((otherAsset) => {
        if (collisionCheck(asset, otherAsset)) {
            collided.push(otherAsset)
        };
    })
    if (collided.length > 0) {
        let DBaggressors = []
        let DBtargets = []
        asset.subAssets.forEach((subasset) => {
            DBaggressors.push(subasset.id)
        })

        //TODO Target Country
        collided.forEach((entity)=> {
            entity.subAssets.forEach((subasset) => {
                DBtargets.push(subasset.id)
            })
        })
        //SEND DATA
        console.log(asset.attackId, DBaggressors, DBtargets)
        // socketFnc(asset, collided, '123456')
        let cbkdata = [asset, collided, null, false];
        pushCollision(asset.attackId, DBaggressors, DBtargets, socketFnc, cbkdata)
        // eventLogger.add_event('collision', Date.now())
    }
}

//COLLISION
function collisionCheck(origin, container) {
    // if (origin.id == container.id || origin.team == container.team) {
    //     return false
    // }
    if (origin.id == container.id) {
        return false
    }
    console.log(origin.getLatLng(), container.getLatLng())
    let distance = origin.getLatLng().distanceTo(container.getLatLng())
    let radius = origin.attack_radius + container.attack_radius
    if (distance <= radius) {
        container.pause_movement();
        return true
    }
    return false

}