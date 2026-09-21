import type { CorridorSegment, DirectionKey, LatLng } from '../../lib/corridorGeometry';

/**
 * The Mapbox map, as a self-contained web page.
 *
 * The dashboard renders with Mapbox GL JS, and matching it on the phone would
 * otherwise mean `@rnmapbox/maps`, which carries native code and so cannot run
 * in Expo Go - a custom build, and on iOS an Apple Developer membership. This
 * runs the *same* library the dashboard runs, inside a WebView, which Expo Go
 * does include. Same tiles, same styles, identical on both platforms.
 *
 * Built as a string rather than a file for two reasons: everything the map
 * draws is known before it loads, so there is nothing to postMessage in and no
 * handshake to get wrong; and the same function can be rendered straight to
 * disk and opened in a browser, which is how the tiles and colours are checked
 * without a phone.
 *
 * Note this is a WebView, not a browser: no address bar, no tabs, nothing the
 * user can navigate. It is a rectangle in the middle of a native screen.
 */

export interface MapboxHtmlOptions {
  token: string;
  /** A Mapbox style URL. The dashboard's own style, when we have it. */
  styleUrl: string;
  segment: CorridorSegment;
  /** Colour per carriageway for the road under the queues. */
  roadColor: Record<DirectionKey, string>;
  /** Colour for queue `index` on a carriageway. */
  jamColor: (direction: DirectionKey, index: number) => string;
  exitName: string;
  /** Page background while tiles load, so it does not flash white on dark. */
  background: string;
  textColor: string;
  /** Pixels at the bottom the road must stay clear of - see SegmentMapProps. */
  bottomInset?: number;
}

/** GeoJSON wants [lon, lat]; everything else here is {latitude, longitude}. */
const toGeoJson = (line: LatLng[]): number[][] =>
  line.map((point) => [point.longitude, point.latitude]);

/**
 * Only ever inlined into a <script> as JSON, never into HTML text, so the one
 * sequence that could break out is `</script`. Escaping the slash keeps the
 * JSON valid and the tag intact.
 */
const json = (value: unknown): string =>
  JSON.stringify(value).replace(/<\//g, '<\\/');

export function buildMapboxHtml(options: MapboxHtmlOptions): string {
  const { segment, roadColor, jamColor, token, styleUrl, exitName } = options;

  const roads = (['NB', 'SB'] as DirectionKey[]).map((direction) => ({
    coords: toGeoJson(segment[direction]),
    color: roadColor[direction],
  }));

  const jams = segment.jamLines.map((line) => ({
    coords: toGeoJson(line.coords),
    color: jamColor(line.direction, line.index),
  }));

  const payload = {
    token,
    styleUrl,
    centre: toGeoJson(segment.centre),
    roads,
    jams,
    exit: [segment.exit.longitude, segment.exit.latitude],
    exitName,
    bottomInset: Math.max(0, Math.round(options.bottomInset ?? 0)),
    bounds: [
      [segment.bounds.minLon, segment.bounds.minLat],
      [segment.bounds.maxLon, segment.bounds.maxLat],
    ],
  };

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link href="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css" rel="stylesheet">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js"></script>
<style>
  html, body { margin:0; padding:0; height:100%; background:${options.background}; }
  #map { position:absolute; inset:0; }
  /* Mapbox requires attribution to stay visible; this only shrinks it to suit
     a panel a third of a phone screen tall. */
  .mapboxgl-ctrl-attrib { font-size: 9px; }
  .mapboxgl-ctrl-bottom-left, .mapboxgl-ctrl-bottom-right {
    bottom: ${Math.max(0, Math.round(options.bottomInset ?? 0))}px;
  }
  #err {
    position:absolute; inset:0; display:none; align-items:center;
    justify-content:center; padding:20px; text-align:center;
    font-family:-apple-system,system-ui,sans-serif; font-size:13px;
    color:${options.textColor}; background:${options.background};
  }
</style>
</head>
<body>
<div id="map"></div>
<div id="err">The map could not load. Check the connection and try again.</div>
<script>
(function () {
  var D = ${json(payload)};
  var D_BOTTOM = D.bottomInset || 0;
  var fail = function (why) {
    document.getElementById('err').style.display = 'flex';
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', why: String(why) }));
    }
  };

  if (!window.mapboxgl) { fail('mapbox-gl.js did not load'); return; }

  try {
    mapboxgl.accessToken = D.token;
    var map = new mapboxgl.Map({
      container: 'map',
      style: D.styleUrl,
      bounds: D.bounds,
      /* Room for the road to breathe, and for whatever covers the bottom of
         the map - the sheet - not to sit on top of it. */
      fitBoundsOptions: {
        padding: { top: 56, bottom: 44 + D_BOTTOM, left: 40, right: 40 }
      },
      attributionControl: true,
      // A picture of one stretch, not a navigation surface: turning or tilting
      // it only makes it harder to tell which way the road runs.
      pitchWithRotate: false,
      dragRotate: false,
      touchPitch: false
    });
    map.touchZoomRotate.disableRotation();

    var line = function (id, coords, color, width, opacity) {
      map.addSource(id, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }
      });
      map.addLayer({
        id: id, type: 'line', source: id,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': color, 'line-width': width, 'line-opacity': opacity === undefined ? 1 : opacity }
      });
    };

    map.on('load', function () {
      /* A casing under EACH carriageway, not one down the middle. A single
         central casing sat in the gap between the two ribbons and read as a
         third, grey road running between them - obvious the moment there were
         real tiles underneath. Outlining each carriageway is what makes them
         read as one divided highway. */
      D.roads.forEach(function (r, i) { line('casing' + i, r.coords, '#1F2937', 9, 0.55); });
      D.roads.forEach(function (r, i) { line('road' + i, r.coords, r.color, 5); });
      D.jams.forEach(function (j, i) { line('jam' + i, j.coords, j.color, 6); });

      var el = document.createElement('div');
      el.style.cssText = 'width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #1E293B;box-shadow:0 1px 3px rgba(0,0,0,.4)';
      new mapboxgl.Marker({ element: el })
        .setLngLat(D.exit)
        .setPopup(new mapboxgl.Popup({ offset: 14 }).setText(D.exitName))
        .addTo(map);

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
      }
      window.__mapReady = true;   // read by the browser-based check
    });

    map.on('error', function (e) { fail((e && e.error && e.error.message) || 'map error'); });
  } catch (e) {
    fail(e && e.message);
  }
})();
</script>
</body>
</html>`;
}
