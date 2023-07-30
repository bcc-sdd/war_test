export function collision_detection(asset, asset_bank, socket) {
    return 
    let collided = []
    asset_bank.get_assets().forEach((otherAsset) => {
        if (collisionCheck(asset, otherAsset)) {
            collided.push(otherAsset)
        };
    })
    console.log(asset.team)
    if (collided.length > 0) {
        let name = 'Foxhounds';
        let agg_ids = [1, 2, 3, 4]
        let nameTarg1 = 'Russian Subs'
        let agg_team = 'US';
        let targ_ids1 = [5, 6, 7]
        let nameTarg2 = 'ILYUSHIN II-80'
        let targ_ids2 = [8, 9, 10]
        let targ_team = 'China'
        socket.emit("mapEvent", {
            event: "collision",
            code: '12312312asd',
            data: {
                agg_team: agg_team,
                aggressor: [{ name: name, ids: agg_ids }],
                target: [{ name: nameTarg1, ids: targ_ids1 }, { name: nameTarg2, ids: targ_ids2 }],
                targ_team: targ_team
            }
        });
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