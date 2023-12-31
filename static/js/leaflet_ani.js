/*!
 *
 *  leaflet.motion - v0.3.2 (https://github.com/Igor-Vladyka/leaflet.motion#readme)
 *  Animation plugin for Leaflet.js
 *
 *  MIT (http://www.opensource.org/licenses/mit-license.php)
 *  (c) 2022  Igor Vladyka <igor.vladyka@gmail.com> (https://github.com/Igor-Vladyka/)
 *
 */ !(function (t) {
  var n = {};
  function i(e) {
    if (n[e]) return n[e].exports;
    var o = (n[e] = { i: e, l: !1, exports: {} });
    return t[e].call(o.exports, o, o.exports, i), (o.l = !0), o.exports;
  }
  (i.m = t),
    (i.c = n),
    (i.d = function (t, n, e) {
      i.o(t, n) || Object.defineProperty(t, n, { enumerable: !0, get: e });
    }),
    (i.r = function (t) {
      "undefined" != typeof Symbol &&
        Symbol.toStringTag &&
        Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }),
        Object.defineProperty(t, "__esModule", { value: !0 });
    }),
    (i.t = function (t, n) {
      if ((1 & n && (t = i(t)), 8 & n)) return t;
      if (4 & n && "object" == typeof t && t && t.__esModule) return t;
      var e = Object.create(null);
      if (
        (i.r(e),
        Object.defineProperty(e, "default", { enumerable: !0, value: t }),
        2 & n && "string" != typeof t)
      )
        for (var o in t)
          i.d(
            e,
            o,
            function (n) {
              return t[n];
            }.bind(null, o)
          );
      return e;
    }),
    (i.n = function (t) {
      var n =
        t && t.__esModule
          ? function () {
              return t.default;
            }
          : function () {
              return t;
            };
      return i.d(n, "a", n), n;
    }),
    (i.o = function (t, n) {
      return Object.prototype.hasOwnProperty.call(t, n);
    }),
    (i.p = ""),
    i((i.s = 0));
})([
  function (t, n, i) {
    i(1), i(2), i(3), i(4), i(5), i(6), (t.exports = i(7));
  },
  function (t, n) {
    (L.Motion = L.Motion || {
      Event: {
        Started: "motion-started",
        Paused: "motion-paused",
        Resumed: "motion-resumed",
        Section: "motion-section",
        Ended: "motion-ended",
      },
    }),
      (L.motion = L.motion || {}),
      (L.Motion.Animate = {
        options: {
          pane: "polymotionPane",
          attribution:
            "Leaflet.Motion © " + new Date().getFullYear() + " Igor Vladyka",
        },
        motionOptions: {
          auto: !1,
          easing: function (t) {
            return t;
          },
          speed: 0,
          duration: 0,
        },
        markerOptions: void 0,
        initialize: function (t, n, i, e) {
          L.Util.setOptions(this, n),
            i &&
              (this.motionOptions = L.Util.extend({}, this.motionOptions, i)),
            e && (this.markerOptions = L.Util.extend({}, e)),
            (this._bounds = L.latLngBounds()),
            (this._linePoints = this._convertLatLngs(t)),
            L.Motion.Utils.isFlat(this._linePoints) ||
              (this._linePoints = this._linePoints[0]),
            this._initializeMarker(),
            (this._latlngs = []),
            L.Util.stamp(this);
        },
        addLatLng: function (t, n) {
          return (
            (t = L.Motion.Utils.toLatLng(t)),
            this._linePoints.push(t),
            this._latlngs.length && this._latlngs.push(t),
            this
          );
        },
        beforeAdd: function (t) {
          t.getPane(this.options.pane) ||
            (t.createPane(this.options.pane).style.zIndex = 599),
            (this._renderer = t.getRenderer(this));
        },
        onAdd: function (t) {
          return (
            this._renderer._initPath(this),
            this._reset(),
            this._renderer._addPath(this),
            this.__marker &&
              this.markerOptions.showMarker &&
              (this.__marker.addTo(t),
              this.__marker._icon &&
                this.__marker._icon.children.length &&
                Array.from(this.__marker._icon.children).forEach(function (t) {
                  var n = t.getAttribute("motion-base");
                  n && (t.style.transform = "rotate(" + n + "deg)");
                })),
            this.motionOptions.auto && this.motionStart(),
            this
          );
        },
        onRemove: function (t) {
          this.motionStop(),
            this.__marker && t.removeLayer(this.__marker),
            this._renderer._removePath(this);
        },
        _motion: function (t) {
          var n = new Date().getTime() - t,
            i = 1;
          if (
            (this.motionOptions.duration &&
              (i = n / this.motionOptions.duration),
            i < 1)
          ) {
            i = this.motionOptions.easing(
              i,
              n,
              0,
              1,
              this.motionOptions.duration
            );
            var e = L.Motion.Utils.interpolateOnLine(
              this._map,
              this._linePoints,
              i
            );
            this.setLatLngs(e.traveledPath),
              this._drawMarker(e.latLng),
              (this.__ellapsedTime = n),
              (this.animation = L.Util.requestAnimFrame(function () {
                this._motion(t);
              }, this));
          } else this.motionStop(!0);
        },
        _drawMarker: function (t) {
          var n = this.getMarker();
          if (n) {
            var i = n.getLatLng(),
              e = this._linePoints[0];
            i.lat === e.lat && i.lng === e.lng
              ? (n.addTo(this._map), n.addEventParent(this))
              : n._icon &&
                n._icon.children.length &&
                Array.from(n._icon.children).forEach(function (n) {
                  var e = n.getAttribute("motion-base");
                  if (e) {
                    var o = 0;
                    e && !isNaN(+e) && (o = +e),
                      (n.style.transform =
                        "rotate(-" +
                        Math.round(L.Motion.Utils.getAngle(i, t) + o) +
                        "deg)");
                  }
                }),
              n.setLatLng(t);
          }
        },
        _removeMarker: function (t) {
          this.markerOptions &&
            this.__marker &&
            ((t && !this.markerOptions.removeOnEnd) ||
              this._map.removeLayer(this.__marker));
        },
        _initializeMarker: function () {
          this.markerOptions &&
            (this.__marker = L.marker(this._linePoints[0], this.markerOptions));
        },
        motionStart: function () {
          return (
            this._map &&
              !this.animation &&
              (this.motionOptions.duration ||
                (this.motionOptions.speed
                  ? (this.motionOptions.duration = L.Motion.Utils.getDuration(
                      this._map,
                      this._linePoints,
                      this.motionOptions.speed
                    ))
                  : (this.motionOptions.duration = 0)),
              this.setLatLngs([]),
              this._motion(new Date().getTime()),
              this.fire(L.Motion.Event.Started, { layer: this }, !1)),
            this
          );
        },
        motionStop: function (t) {
          return (
            this.motionPause(),
            this.setLatLngs(this._linePoints),
            (this.__ellapsedTime = null),
            this._removeMarker(t),
            this.fire(L.Motion.Event.Ended, { layer: this }, !1),
            this
          );
        },
        motionPause: function () {
          return (
            this.animation &&
              (L.Util.cancelAnimFrame(this.animation),
              (this.animation = null),
              this.fire(L.Motion.Event.Paused, { layer: this }, !1)),
            this
          );
        },
        motionResume: function () {
          return (
            !this.animation &&
              this.__ellapsedTime &&
              (this.motionOptions.duration ||
                (this.motionOptions.speed
                  ? (this.motionOptions.duration = L.Motion.Utils.getDuration(
                      this._map,
                      this._linePoints,
                      this.motionOptions.speed
                    ))
                  : (this.motionOptions.duration = 0)),
              this._motion(new Date().getTime() - this.__ellapsedTime),
              this.fire(L.Motion.Event.Resumed, { layer: this }, !1)),
            this
          );
        },
        motionToggle: function () {
          return (
            this.animation
              ? this.__ellapsedTime && this.motionPause()
              : this.__ellapsedTime
              ? this.motionResume()
              : this.motionStart(),
            this
          );
        },
        motionDuration: function (t) {
          var n = this.motionSpeed.duration;
          return (
            (this.motionOptions.duration = t || 0),
            this.animation &&
              n &&
              (this.motionPause(),
              (this.__ellapsedTime = this.__ellapsedTime * (n / t)),
              (this.motionOptions.duration = t),
              this.motionResume()),
            this
          );
        },
        motionSpeed: function (t) {
          var n = this.motionOptions.speed;
          return (
            (this.motionOptions.speed = t || 0),
            this.animation &&
              n &&
              (this.motionPause(),
              (this.__ellapsedTime = this.__ellapsedTime * (n / t)),
              (this.motionOptions.duration = L.Motion.Utils.getDuration(
                this._map,
                this._linePoints,
                this.motionOptions.speed
              )),
              this.motionResume()),
            this
          );
        },
        getMarker: function () {
          return this.__marker;
        },
        getMarkers: function () {
          return [this.getMarker()];
        },
      });
  },
  function (t, n) {
    L.Motion.Utils = {
      attachDistances: function (t, n) {
        if (n.length > 1)
          for (var i = 1; i < n.length; i++)
            n[i - 1].distanceToNextPoint = t.distance(n[i - 1], n[i]);
        return n;
      },
      interpolateOnLine: function (t, n, i) {
        if ((n = n instanceof L.Polyline ? n.getLatLngs() : n).length < 2)
          return null;
        for (var e = !0, o = 0; o < n.length - 1; o++)
          if (!n[o].distanceToNextPoint) {
            e = !1;
            break;
          }
        if (
          (e || this.attachDistances(t, n),
          0 === (i = Math.max(Math.min(i, 1), 0)))
        ) {
          var r = n[0] instanceof L.LatLng ? n[0] : L.latLng(n[0]);
          return { traveledPath: [r], latLng: r };
        }
        if (1 == i)
          return {
            traveledPath: n,
            latLng:
              n[n.length - 1] instanceof L.LatLng
                ? n[n.length - 1]
                : L.latLng(n[n.length - 1]),
          };
        for (var a = 0, s = 0; s < n.length - 1; s++)
          a += n[s].distanceToNextPoint;
        for (var u = a * i, h = 0, l = 0, c = 0; l < u; c++) {
          var m = n[c],
            f = n[c + 1];
          (h = l), (l += m.distanceToNextPoint);
        }
        if (null == m && null == f) (m = n[0]), (f = n[1]), (c = 1);
        var d = l - h != 0 ? (u - h) / (l - h) : 0,
          _ = this.interpolateOnLatLngSegment(m, f, d),
          p = n.slice(0, c);
        return p.push(_), { traveledPath: p, latLng: _ };
      },
      interpolateOnPointSegment: function (t, n, i) {
        return L.point(t.x * (1 - i) + i * n.x, t.y * (1 - i) + i * n.y);
      },
      interpolateOnLatLngSegment: function (t, n, i) {
        return L.latLng(
          t.lat * (1 - i) + i * n.lat,
          t.lng * (1 - i) + i * n.lng
        );
      },
      distance: function (t, n) {
        for (var i = 0, e = 1; e < n.length; e++)
          i += t.distance(n[e], n[e - 1]);
        return i;
      },
      getDuration: function (t, n, i) {
        return (
          L.Motion.Utils.distance(
            t,
            n.map(function (t) {
              return L.Motion.Utils.toLatLng(t);
            })
          ) /
          (i / 3600)
        );
      },
      toLatLng: function (t, n, i) {
        return t instanceof L.LatLng
          ? t
          : L.Util.isArray(t) && "object" != typeof t[0]
          ? 3 === t.length
            ? L.latLng(t[0], t[1], t[2])
            : 2 === t.length
            ? L.latLng(t[0], t[1])
            : null
          : null == t
          ? t
          : "object" == typeof t && "lat" in t
          ? L.latLng(t.lat, "lng" in t ? t.lng : t.lon, t.alt)
          : void 0 === n
          ? null
          : L.latLng(t, n, i);
      },
      getAngle: function (t, n) {
        var i = (180 * Math.atan2(n.lat - t.lat, n.lng - t.lng)) / Math.PI;
        return i < 0 && (i += 360), i;
      },
      isFlat: function (t) {
        return (
          !L.Util.isArray(t[0]) ||
          ("object" != typeof t[0][0] && void 0 !== t[0][0])
        );
      },
    };
  },
  function (t, n) {
    L.Motion.Ease = {
      linear: function (t) {
        return t;
      },
      swing: function (t) {
        return 0.5 - Math.cos(t * Math.PI) / 2;
      },
      easeInQuad: function (t, n, i, e, o) {
        return e * (n /= o) * n + i;
      },
      easeOutQuad: function (t, n, i, e, o) {
        return -e * (n /= o) * (n - 2) + i;
      },
      easeInOutQuad: function (t, n, i, e, o) {
        return (n /= o / 2) < 1
          ? (e / 2) * n * n + i
          : (-e / 2) * (--n * (n - 2) - 1) + i;
      },
      easeInCubic: function (t, n, i, e, o) {
        return e * (n /= o) * n * n + i;
      },
      easeOutCubic: function (t, n, i, e, o) {
        return e * ((n = n / o - 1) * n * n + 1) + i;
      },
      easeInOutCubic: function (t, n, i, e, o) {
        return (n /= o / 2) < 1
          ? (e / 2) * n * n * n + i
          : (e / 2) * ((n -= 2) * n * n + 2) + i;
      },
      easeInQuart: function (t, n, i, e, o) {
        return e * (n /= o) * n * n * n + i;
      },
      easeOutQuart: function (t, n, i, e, o) {
        return -e * ((n = n / o - 1) * n * n * n - 1) + i;
      },
      easeInOutQuart: function (t, n, i, e, o) {
        return (n /= o / 2) < 1
          ? (e / 2) * n * n * n * n + i
          : (-e / 2) * ((n -= 2) * n * n * n - 2) + i;
      },
      easeInQuint: function (t, n, i, e, o) {
        return e * (n /= o) * n * n * n * n + i;
      },
      easeOutQuint: function (t, n, i, e, o) {
        return e * ((n = n / o - 1) * n * n * n * n + 1) + i;
      },
      easeInOutQuint: function (t, n, i, e, o) {
        return (n /= o / 2) < 1
          ? (e / 2) * n * n * n * n * n + i
          : (e / 2) * ((n -= 2) * n * n * n * n + 2) + i;
      },
      easeInSine: function (t, n, i, e, o) {
        return -e * Math.cos((n / o) * (Math.PI / 2)) + e + i;
      },
      easeOutSine: function (t, n, i, e, o) {
        return e * Math.sin((n / o) * (Math.PI / 2)) + i;
      },
      easeInOutSine: function (t, n, i, e, o) {
        return (-e / 2) * (Math.cos((Math.PI * n) / o) - 1) + i;
      },
      easeInExpo: function (t, n, i, e, o) {
        return 0 == n ? i : e * Math.pow(2, 10 * (n / o - 1)) + i;
      },
      easeOutExpo: function (t, n, i, e, o) {
        return n == o ? i + e : e * (1 - Math.pow(2, (-10 * n) / o)) + i;
      },
      easeInOutExpo: function (t, n, i, e, o) {
        return 0 == n
          ? i
          : n == o
          ? i + e
          : (n /= o / 2) < 1
          ? (e / 2) * Math.pow(2, 10 * (n - 1)) + i
          : (e / 2) * (2 - Math.pow(2, -10 * --n)) + i;
      },
      easeInCirc: function (t, n, i, e, o) {
        return -e * (Math.sqrt(1 - (n /= o) * n) - 1) + i;
      },
      easeOutCirc: function (t, n, i, e, o) {
        return e * Math.sqrt(1 - (n = n / o - 1) * n) + i;
      },
      easeInOutCirc: function (t, n, i, e, o) {
        return (n /= o / 2) < 1
          ? (-e / 2) * (Math.sqrt(1 - n * n) - 1) + i
          : (e / 2) * (Math.sqrt(1 - (n -= 2) * n) + 1) + i;
      },
      easeInElastic: function (t, n, i, e, o) {
        var r = 1.70158,
          a = 0,
          s = e;
        if (0 == n) return i;
        if (1 == (n /= o)) return i + e;
        if ((a || (a = 0.3 * o), s < Math.abs(e))) {
          s = e;
          r = a / 4;
        } else r = (a / (2 * Math.PI)) * Math.asin(e / s);
        return (
          -s *
            Math.pow(2, 10 * (n -= 1)) *
            Math.sin(((n * o - r) * (2 * Math.PI)) / a) +
          i
        );
      },
      easeOutElastic: function (t, n, i, e, o) {
        var r = 1.70158,
          a = 0,
          s = e;
        if (0 == n) return i;
        if (1 == (n /= o)) return i + e;
        if ((a || (a = 0.3 * o), s < Math.abs(e))) {
          s = e;
          r = a / 4;
        } else r = (a / (2 * Math.PI)) * Math.asin(e / s);
        return (
          s *
            Math.pow(2, -10 * n) *
            Math.sin(((n * o - r) * (2 * Math.PI)) / a) +
          e +
          i
        );
      },
      easeInOutElastic: function (t, n, i, e, o) {
        var r = 1.70158,
          a = 0,
          s = e;
        if (0 == n) return i;
        if (2 == (n /= o / 2)) return i + e;
        if ((a || (a = o * (0.3 * 1.5)), s < Math.abs(e))) {
          s = e;
          r = a / 4;
        } else r = (a / (2 * Math.PI)) * Math.asin(e / s);
        return n < 1
          ? s *
              Math.pow(2, 10 * (n -= 1)) *
              Math.sin(((n * o - r) * (2 * Math.PI)) / a) *
              -0.5 +
              i
          : s *
              Math.pow(2, -10 * (n -= 1)) *
              Math.sin(((n * o - r) * (2 * Math.PI)) / a) *
              0.5 +
              e +
              i;
      },
      easeInBack: function (t, n, i, e, o, r) {
        return (
          null == r && (r = 1.70158), e * (n /= o) * n * ((r + 1) * n - r) + i
        );
      },
      easeOutBack: function (t, n, i, e, o, r) {
        return (
          null == r && (r = 1.70158),
          e * ((n = n / o - 1) * n * ((r + 1) * n + r) + 1) + i
        );
      },
      easeInOutBack: function (t, n, i, e, o, r) {
        return (
          null == r && (r = 1.70158),
          (n /= o / 2) < 1
            ? (e / 2) * (n * n * ((1 + (r *= 1.525)) * n - r)) + i
            : (e / 2) * ((n -= 2) * n * ((1 + (r *= 1.525)) * n + r) + 2) + i
        );
      },
      easeInBounce: function (t, n, i, e, o) {
        return e - L.Motion.Ease.easeOutBounce(t, o - n, 0, e, o) + i;
      },
      easeOutBounce: function (t, n, i, e, o) {
        return (n /= o) < 1 / 2.75
          ? e * (7.5625 * n * n) + i
          : n < 2 / 2.75
          ? e * (7.5625 * (n -= 1.5 / 2.75) * n + 0.75) + i
          : n < 2.5 / 2.75
          ? e * (7.5625 * (n -= 2.25 / 2.75) * n + 0.9375) + i
          : e * (7.5625 * (n -= 2.625 / 2.75) * n + 0.984375) + i;
      },
      easeInOutBounce: function (t, n, i, e, o) {
        return n < o / 2
          ? 0.5 * L.Motion.Ease.easeInBounce(t, 2 * n, 0, e, o) + i
          : 0.5 * L.Motion.Ease.easeOutBounce(t, 2 * n - o, 0, e, o) +
              0.5 * e +
              i;
      },
    };
  },
  function (t, n) {
    (L.Motion.Polyline = L.Polyline.extend(L.Motion.Animate)),
      (L.motion.polyline = function (t, n, i, e) {
        return new L.Motion.Polyline(t, n, i, e);
      });
  },
  function (t, n) {
    (L.Motion.Polygon = L.Polygon.extend(L.Motion.Animate)),
      (L.motion.polygon = function (t, n, i, e) {
        return new L.Motion.Polygon(t, n, i, e);
      });
  },
  function (t, n) {
    (L.Motion.Group = L.FeatureGroup.extend({
      _started: !1,
      _completed: !1,
      options: {
        pane: L.Motion.Animate.options.pane,
        attribution: L.Motion.Animate.options.attribution,
      },
      motionStart: function () {
        return (
          this.invoke("motionStart"),
          (this._started = !0),
          (this._completed = !1),
          this.fire(L.Motion.Event.Started, { layer: this }, !1),
          this
        );
      },
      motionStop: function () {
        return (
          this.invoke("motionStop"),
          (this._completed = !0),
          this.fire(L.Motion.Event.Ended, { layer: this }, !1),
          this
        );
      },
      motionPause: function () {
        return (
          this.invoke("motionPause"),
          this.fire(L.Motion.Event.Paused, { layer: this }, !1),
          this
        );
      },
      motionResume: function () {
        return (
          this.invoke("motionResume"),
          this.fire(L.Motion.Event.Resumed, { layer: this }, !1),
          this
        );
      },
      motionToggle: function () {
        return this.invoke("motionToggle"), this;
      },
      getMarkers: function () {
        return this.getLayers().map(function (t) {
          return t.getMarkers();
        });
      },
    })),
      (L.motion.group = function (t, n) {
        return new L.Motion.Group(t, n);
      });
  },
  function (t, n) {
    (L.Motion.Seq = L.Motion.Group.extend({
      _activeLayer: null,
      _started: !1,
      _completed: !1,
      addLayer: function (t, n) {
        void 0 === n && (n = !0),
          this.__prepareLayer(t),
          L.Motion.Group.prototype.addLayer.call(this, t),
          !this._activeLayer && n && this._completed && t.motionStart();
      },
      motionStart: function () {
        if (!this._activeLayer) {
          var t = this.getFirstLayer();
          t &&
            (t.motionStart(),
            (this._started = !0),
            (this._completed = !1),
            this.fire(L.Motion.Event.Started, { layer: this }, !1));
        }
        return this;
      },
      motionStop: function (t) {
        return (
          t || this.invoke("motionStop"),
          (this._activeLayer = null),
          (this._completed = !0),
          this.fire(L.Motion.Event.Ended, { layer: this }, !1),
          this
        );
      },
      motionPause: function () {
        return (
          this._activeLayer &&
            (this._activeLayer.motionPause(),
            this.fire(L.Motion.Event.Paused, { layer: this }, !1)),
          this
        );
      },
      motionResume: function () {
        return (
          this._activeLayer &&
            (this._activeLayer.motionResume(),
            this.fire(L.Motion.Event.Resumed, { layer: this }, !1)),
          this
        );
      },
      motionToggle: function () {
        return (
          this._activeLayer ? this.motionPause() : this.motionResume(), this
        );
      },
      getFirstLayer: function () {
        var t = this.getLayers();
        return t.length ? t[0] : null;
      },
      __prepareLayer: function (t) {
        t.setLatLngs && t.setLatLngs([]),
          t.off(L.Motion.Event.Ended, this.__clearActiveLayer__, this),
          t.on(L.Motion.Event.Ended, this.__clearActiveLayer__, this),
          t.off(L.Motion.Event.Started, this.__putActiveLayer__, this),
          t.on(L.Motion.Event.Started, this.__putActiveLayer__, this);
      },
      __clearActiveLayer__: function (t) {
        this._activeLayer = null;
        var n = this.getLayers(),
          i = t.layer._leaflet_id,
          e = n.filter(function (t) {
            return t._leaflet_id == i;
          })[0],
          o = n.indexOf(e) + 1;
        n.length > o ? n[o].motionStart() : this.motionStop(!0);
      },
      __putActiveLayer__: function (t) {
        (this._activeLayer = t.layer),
          this.fire(L.Motion.Event.Section, { layer: this._activeLayer }, !1);
      },
    })),
      (L.motion.seq = function (t, n) {
        return new L.Motion.Seq(t, n);
      });
  },
]);
