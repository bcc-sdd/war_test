var siteUrl = 'http://122.53.86.62:1945/'
let testUrl = `http://122.53.86.62:1945/Map_Controller/getAssignedAsset`

//tblMovement 

// updatePosition
//     ingameAssetId
//     latitude


async function pullData(url) {
    const fetchPromise = await fetch(`${siteUrl}${url}`);
    console.log(fetchPromise)
    return await fetchPromise.json()
}


function pullDataBody(url, data) {
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


export function pullAttackIdAssets(attackId) {
    const formData = new FormData();
    formData.append('attackId', attackId)
    let data = pullDataBody('Map_Controller/getAssignedAssetByAttackId', formData);
    console.log(data)
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