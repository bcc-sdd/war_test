var siteUrl = 'http://122.53.86.62:1945/'
let testUrl = `http://122.53.86.62:1945/Map_Controller/getAssignedAsset`

async function pullData(url) {
    const fetchPromise = await fetch(`${siteUrl}${url}`);
    return await fetchPromise.json()
}

async function pullAssets() {
    let data = await pullData('Map_Controller/getAssignedAsset');
    return data
}

async function pushLocation(assets) {
    let endpoint = 'Map_Controller/updatePosition'
}


async function pushAssets(assets) {
    let endpoint = 'Map_Controller/updatePosition'
}