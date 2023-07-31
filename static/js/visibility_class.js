export class VisibilityClass {
    constructor(assets, bases) {
        this.assets = assets;
        this.bases = bases;
        this.show_radars = true;
        this.show_routes = true;
        this.show_danger_circle = true;
        this.show_countries = {
            'US': true,
            'CHINA': true,
            'RUSSIA': true,
            'INDIA': true
        }
    }



    countryToggle(event, country) {
        console.log(this)
        return
        var truthiness = event.srcElement.checked ? true : false;
        console.log(this)
        this.assets.get_assets().forEach((asset) => {
            if (asset.team == country || asset.team == country * 2) {
                set_AssetsOpaque(truthiness, asset);
            }
        });
    }

    toggle_ROUTE(asset, boolval,) {
        if (boolval) {
            asset.add_routeAssets()
        }
        else {
            asset.clear_RouteAssets(map);
        }
    }

    toggle_RADARS(asset, boolval) {
        if (boolval) {
            asset.add_persistentAssets(map, asset.asset.getLatLng())
        }
        else {
            asset.clear_persistentAssets(map)
        }
    }

    toggleAllAids(event) {
        var truthiness = event.srcElement.checked ? true : false;
        this.assets.get_assets().forEach((asset) => {
            toggle_ROUTE(asset, truthiness)
            toggle_RADARS(asset, truthiness)
        })
    }

    toggleRoute(event) {
        var truthiness = event.srcElement.checked ? true : false;
        this.assets.get_assets().forEach((asset) => {
            toggle_ROUTE(asset, truthiness)
        })
    }

    toggleRadars(event) {
        var truthiness = event.srcElement.checked ? true : false;
        this.assets.get_assets().forEach((asset) => {
            toggle_RADARS(asset, truthiness)
        })
    }
  
}