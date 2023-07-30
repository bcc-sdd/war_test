var siteUrl = 'http://122.53.86.62:1945/'
let testUrl = `http://122.53.86.62:1945/Map_Controller/getAssignedAsset`


async function pullData(url) {
    const fetchPromise = await fetch(`${siteUrl}${url}`);
    return await fetchPromise.json()
}


async function pullDataBody(url, data) {
    const request = new XMLHttpRequest();
    request.open("POST", `${siteUrl}${url}`);
    request.send(data);
    request.onload = function() {
        if (request.status != 200) { // analyze HTTP status of the response
          alert(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            return request.response
        }
      };
}


function makeRequest(url, data) {
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
    request.onload = function() {
        if (request.status != 200) { // analyze HTTP status of the response
          alert(`Error ${request.status}: ${request.statusText}`); // e.g. 404: Not Found
        } else { // show the result
            console.log(request.response)
        }
      };
      
    request.onerror = function() {
        alert("Request failed");
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
    let data = await makeRequest(url, formData)
    return data;
}

export async function pushLocation(id, lat, long) {
    const formData = new FormData();
    formData.append('ingameAssetId', id)
    formData.append('latitude', lat)
    formData.append('longitude', long)
    let endpoint = 'Map_Controller/updatePosition'
    pushData(endpoint, { ingameAssetId: id, latitude: lat, longitude: long })
}


async function pushAssets(assets) {
    let endpoint = 'Map_Controller/updatePosition'
}

export async function pushCollision(attackId, aggressorIds, targetIds) {
    let aggressors = ''
    let targets = ''
    aggressorIds.forEach((id) => aggressors += `${id},`)
    targetIds.forEach((id) => targets += `${id},`)

    // console.log(data)
    const formData = new FormData();
    formData.append('attackId', attackId)
    formData.append('aggressorId', aggressors)
    formData.append('targetId', targets)
    let endpoint = 'Facilitator_Controller/saveCollision'
    pushData(endpoint, formData)
}