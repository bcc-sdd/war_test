export function collision_detection(
    asset,
    asset_bank,
    socketFnc,
    collisionFnc,
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
        socketFnc(asset, collided, '123456')
        // collisionFnc(asset.attackId, DBaggressors, DBtargets)
        // eventLogger.add_event('collision', Date.now())
    }
    else {
        asset.getsubAssets().forEach(subasset => {
            movementDoneFnc(subasset.id)
            // eventLogger.add_event('movement_done', Date.now(), container)
        })
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
    let radius = origin.attackAsset.getRadius() + container.attackAsset.getRadius()
    if (distance <= radius) {
        origin.pause_movement();
        container.pause_movement();
        return true
    }
    return false

}