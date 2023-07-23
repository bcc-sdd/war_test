import assetBank from './war.js'


function countryToggle(event, country) {
    var truthiness = event.srcElement.checked ? true : false;
    assetBank.forEach((asset) => {
      if (asset.team == country || asset.team == country * 2) {
        asset.set_AssetsOpaque(truthiness);
      }
    });
  }