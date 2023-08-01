export class VisibilityClass {
    constructor(assets, bases, map) {
        this.team = localStorage.getItem("saved_team") || 'CHINA'
        this.assets = assets;
        this.bases = bases;
        this.map = map
        this.show_radars = true;
        this.show_routes = true;
        this.show_danger_circle = true;
        let team = localStorage.getItem('country')
        this.show_countries = {
            'US': team == 'US',
            'CHINA': team == 'CHINA',
            'RUSSIA': team == 'RUSSIA',
            'INDIA': team == 'INDIA'
        }
    }

    
    asset_is_visible(asset) {
        return this.show_countries[asset.team]
    }

    showRoutes(asset) {
        return this.show_routes && this.asset_is_visible(asset)
    
    }

    showRadars(asset) {
        return this.show_radars && this.asset_is_visible(asset)
    }

    showDangerCircles(asset) {
        return this.show_danger_circle && this.asset_is_visible(asset)
    }


    set_AssetsOpaque(val, container) {
        if (val) {
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
                if (!truthiness && asset.isHidden) {
                    return
                }
                if (!truthiness && !asset.isHidden) {
                    asset.isHidden = true
                }
                else if (truthiness && asset.isHidden) {
                    asset.isHidden = false
                }
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
            asset.clear_RouteAssets();
        }
    }

    toggle_RADARS(asset, boolval) {
        if (boolval) {
            asset.add_persistentAssets(asset.asset.getLatLng())
        }
        else {
            asset.clear_persistentAssets()
        }
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