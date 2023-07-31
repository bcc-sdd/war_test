export class VisibilityClass {
    constructor(assets, bases, map) {
        this.assets = assets;
        this.bases = bases;
        this.map = map
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

    showRoutes() {
        return this.show_routes
    
    }

    showRadars() {
        return this.show_radars
    }

    showDangerCircles() {
        return this.show_danger_circle
    }

    asset_is_visible(asset) {
        return this.show_countries[asset.team]
    }

    set_AssetsOpaque(val, container) {
        if (val) {
            console.log(container.asset)
            container.asset.addTo(this.map)
        }
        else {
            this.map.removeLayer(container.asset)
        }
        // val = val ? 0.2 : 0;
        // var val2 = val ? 1 : 0;
        // container.asset.setOpacity(val2);
        // container.attackAsset.setStyle({ fillOpacity: val, weight: val2 });
        // base.radarAsset.setStyle({ fillOpacity: val, weight: val2 });
      }

    countryToggle(event, country) {
        var truthiness = event.srcElement.checked ? true : false;
        this.assets.get_assets().forEach((asset) => {
            if (asset.team == country) {
                this.set_AssetsOpaque(truthiness, asset);
                this.toggle_RADARS(asset, truthiness)
                this.toggle_ROUTE(asset, truthiness)
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
            asset.add_persistentAssets(asset.asset.getLatLng())
        }
        else {
            asset.clear_persistentAssets(map)
        }
    }

    toggleAllAids(event) {
        var truthiness = event.srcElement.checked ? true : false;
        this.show_danger_circle = truthiness
        this.show_radars = truthiness
        this.show_routes = truthiness
        this.assets.get_assets().forEach((asset) => {
            this.toggle_ROUTE(asset, truthiness)
            this.toggle_RADARS(asset, truthiness)
        })
    }

    toggleRoute(event) {
        var truthiness = event.srcElement.checked ? true : false;
        this.show_routes = truthiness
        this.assets.get_assets().forEach((asset) => {
            this.toggle_ROUTE(asset, truthiness)
        })
    }

    toggleRadars(event) {
        var truthiness = event.srcElement.checked ? true : false;
        this.show_danger_circle = truthiness
        this.show_radars = truthiness
        this.assets.get_assets().forEach((asset) => {
            this.toggle_RADARS(asset, truthiness)
        })
    }
  
}