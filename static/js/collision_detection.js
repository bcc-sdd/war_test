export function collision_detection(
    asset,
    asset_bank,
    socket,
    collisionFnc,
    movementDoneFnc
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
        data.agg_team = asset.team;
        data.targ_team = collided[0].team
        data.aggressor = {}
        data.target = {}
        let DBaggressors = []
        let DBtargets = []
        asset.subAssets.forEach((subasset) => {
            if (data.aggressor.hasOwnProperty(subasset.name)) {
                data.aggressor[subasset.name].push(subasset.id)
            }
            else {
                data.aggressor[subasset.name] = [subasset.id]
            }
            DBaggressors.push(subasset.id)
        })

        //TODO Target Country
        collided.forEach((entity)=> {
            entity.subAssets.forEach((subasset) => {
                if (data.target.hasOwnProperty(subasset.name)) {
                    data.target[subasset.name].push(subasset.id)
                }
                else {
                    data.target[subasset.name] = [subasset.id]
                }
                DBtargets.push(subasset.id)
            })
        })
        inputData.data = data
        inputData.code = '123456'
        inputData.event = 'collision'
        //SEND DATA
        // console.log(asset.attackId, DBaggressors, DBtargets)
        socket.emit("mapEvent", inputData);
        collisionFnc(asset.attackId, DBaggressors, DBtargets)
    }
    else {
        asset.getsubAssets().forEach(subasset => {
            movementDoneFnc(subasset.id)
        })
    }

}

//COLLISION
function collisionCheck(origin, container) {
    if (origin.id == container.id) {
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