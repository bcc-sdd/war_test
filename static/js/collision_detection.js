export function collision_detection(
    asset,
    asset_bank,
    socket,
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
        let inputData = {}
        let data = {};
        data.aggressor = {}
        data.target = {}
        let DBaggressors = []
        let DBtargets = []
        asset.subAssets.forEach((subasset) => {
            let name = `${subasset.name}_${subasset.team}`
            if (data.aggressor.hasOwnProperty(name)) {
                data.aggressor[name].push(subasset.id)
            }
            else {
                data.aggressor[name] = [subasset.id]
            }
            DBaggressors.push(subasset.id)
        })

        //TODO Target Country
        collided.forEach((entity)=> {
            entity.subAssets.forEach((subasset) => {
                let name = `${subasset.name}_${subasset.team}`
                if (data.target.hasOwnProperty(name)) {
                    data.target[name].push(subasset.id)
                }
                else {
                    data.target[name] = [subasset.id]
                }
                DBtargets.push(subasset.id)
            })
        })
        inputData.data = data
        inputData.code = '123456'
        inputData.event = 'collision'
        //SEND DATA
        console.log(asset.attackId, DBaggressors, DBtargets, inputData)
        // socket.emit("mapEvent", inputData);
        // collisionFnc(asset.attackId, DBaggressors, DBtargets)
        eventLogger.add_event('collision', Date.now())
    }
    else {
        asset.getsubAssets().forEach(subasset => {
            // movementDoneFnc(subasset.id)
            // eventLogger.add_event('movement_done', Date.now(), container)
        })
    }

}

//COLLISION
function collisionCheck(origin, container) {
    if (origin.id == container.id || origin.team == container.team) {
        return false
    }
    let distance = origin.asset.getLatLng().distanceTo(container.asset.getLatLng())
    let radius = origin.attackAsset.getRadius() + container.attackAsset.getRadius()
    if (distance <= radius) {
        origin.pause_movement();
        container.pause_movement();
        return true
    }
    return false

}