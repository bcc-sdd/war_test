var siteUrl = 'http://122.53.86.62:1945/'
let testUrl = `http://122.53.86.62:1945/Map_Controller/getAssignedAsset`
var thisTeam = null

async function pullData(url) {
    const fetchPromise = await fetch(`${siteUrl}${url}`);
    return await fetchPromise.json()
}




function pullDataBody(url, data) {
    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", `${siteUrl}${url}`);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send(data);
    });
}

async function pushData(url, data) {
    const request = new XMLHttpRequest();
    request.open("POST", `${siteUrl}${url}`);
    request.send(data);
    request.onload = function () {
        if (request.status != 200) { // analyze HTTP status of the response
            alert(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            console.log(request.response)
        }
    };

    request.onerror = function () {
        console.log("Request failed");
    };



}


export async function pullAssets() {
    let data = await pullData('Map_Controller/getAssignedAsset');
    return data;
}

export async function pullAttackIdAssets(attackId) {
    let url = 'Map_Controller/getAssignedAssetByAttackId'
    console.log('getting attack id asset', attackId)
    const formData = new FormData();
    formData.append('attackId', attackId.status)
    let data = await pullDataBody(url, formData)
    return data;
}


export async function pushCollision(attackId, aggressorIds, targetIds) {
    let aggressors = ''
    let targets = ''
    aggressorIds.forEach((id) => aggressors += `${id},`)
    targetIds.forEach((id) => targets += `${id},`)
    // console.log(data)
    const formData = new FormData();
    formData.append('attackId', attackId)
    formData.append('aggressorId', aggressors.slice(0, -1))
    formData.append('targetId', targets.slice(0, -1))
    let endpoint = 'Facilitator_Controller/saveCollision'
    pushData(endpoint, formData)
}


export function pushExplosion(collisionCode, id) {
    let endpoint = 'Map_Controller/updateExplodedAsset'
    collisionCode = '64c6272d4808f'
    id =20
    let formData = new FormData();
    formData.append('collisionCode', collisionCode)
    formData.append('assetId', id)
    pushData(endpoint, formData)
}



export function pushMovementDone(assetId) {
    const formData = new FormData();
    formData.append('ingameAssetId', assetId);
    let endpoint = 'Map_Controller/updatePosition'
    pushData(endpoint, formData)
}