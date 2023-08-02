var siteUrl = 'http://122.53.86.62:1945/'
let testUrl = `http://122.53.86.62:1945/Map_Controller/getAssignedAsset`
var thisTeam = null

async function pullData(url) {
    const fetchPromise = await fetch(`${siteUrl}${url}`);
    return await fetchPromise.json()
}



function pullDataBody(url, data,) {
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

async function pushData(url, data, callback=null, callback_data=null) {
    const request = new XMLHttpRequest();
    request.open("POST", `${siteUrl}${url}`);
    request.send(data);
    request.onload = function () {
        if (request.status != 200) { // analyze HTTP status of the response
            console.log(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            if (callback) {
                callback_data[2] = JSON.parse(request.response).collisionCode
                callback? callback(...callback_data) : null;
            }
            console.log(request.response)
        }
    };

    request.onerror = function () {
        console.log("Request failed");
    };



}
//used when loading map assets
export async function pullAssets() {
    let data = await pullData('Map_Controller/getAssignedAsset');
    return data;
}

//used when listening to socket event movementApproved
//which sends an attack id
export async function pullAttackIdAssets(attackId) {
    let url = 'Map_Controller/getAssignedAssetByAttackId'
    console.log('getting attack id asset', attackId)
    const formData = new FormData();
    formData.append('attackId', attackId.status)
    let data = await pullDataBody(url, formData)
    return data;
}

//triggered when collision is detected by collision function
export async function pushCollision(attackId, aggressorIds, targetIds, callback, callback_data) {
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
    pushData(endpoint, formData, callback, callback_data)
}

//triggered by admin collision page
export function pushExplosion(collisionCode, id) {
    let endpoint = 'Map_Controller/updateExplodedAsset'
    collisionCode = '64c6272d4808f'
    id =20
    let formData = new FormData();
    formData.append('collisionCode', collisionCode)
    formData.append('assetId', id)
    pushData(endpoint, formData)
}

//triggered by movement
export function pushMovementDone(assetId) {
    const formData = new FormData();
    formData.append('ingameAssetId', assetId);
    let endpoint = 'Map_Controller/updatePosition'
    pushData(endpoint, formData)
}

export function pushPauseMovement(pathId, position, progressPercentage, attackId, pauseTime, resumeTime) {
    let endpoint = `Map_Controller/addPause`
    const formData = new FormData()
    formData.append('pathId', pathId)
    formData.append('position', position)
    formData.append('progressPercentage', progressPercentage)
    formData.append('attackId', attackId)
    formData.append('pauseTime', pauseTime)
    formData.append('resumeTime', resumeTime)
    pushData(endpoint, formData)
}



export function pushResumeMovement(attackId, reset=false) {
    let endpoint = `Map_Controller/addResume`
    const formData = new FormData()
    formData.append('resumeTime', reset? null: Date.now() / 1000)
    formData.append('attackId', attackId)
    pushData(endpoint, formData)
}