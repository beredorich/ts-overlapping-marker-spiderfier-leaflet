# ts-overlapping-marker-spiderfier-leaflet

This is a fork of jawj's [OverlappingMarkerSpiderfier-Leaflet](https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet), rewritten in TypeScript. It is inspired by chancezeus's [ts-overlapping-marker-spiderfier](https://github.com/chancezeus/oms) but for leaflet. This version is designed for use with Angular and other Webpack-based systems. Added new listeners: mouseenter, mouseover


## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Original Readme](#original-readme)
  * [How to use](#how-to-use)
  * [Docs](#docs)
* [License](#license)

## Installation

To install this package, use npm:

```sh
npm install ts-overlapping-marker-spiderfier-leaflet
```

## Usage

Instead of binding itself to window you can
`import {OverlappingMarkerSpiderfier} from 'ts-overlapping-marker-spiderfier-leaflet'` and use the module as you would normally.

Other variants (`umd`, `cjs`, `amd` and `browser`) are provided using rollup and can be found in the `dist` folder. For
`umd` and `browser` the module will bind itself to the `omsleaflet` namespace, so accessing the module code can be done using
`new omsleaflet.OverlappingMarkerSpiderfier...` instead of `new OverlappingMarkerSpiderfier...`.

## Original Readme

*Ever noticed how, in [Google Earth](http://earth.google.com), marker pins that overlap each other spring apart gracefully when you click them, so you can pick the one you meant?*

*And ever noticed how, when using the [Leaflet API](http://leaflet.cloudmade.com), the same thing doesn't happen?*

This code makes Leaflet map markers behave in that Google Earth way (minus the animation). Small numbers of markers (yes, up to 8) spiderfy into a circle. Larger numbers fan out into a more space-efficient spiral.

The compiled code has no dependencies beyond Leaflet. And it's under 3K when compiled out of [CoffeeScript](http://jashkenas.github.com/coffee-script/), minified with Google's [Closure Compiler](http://code.google.com/closure/compiler/) and gzipped.

It's a port of my [original library for the Google Maps API](https://github.com/jawj/OverlappingMarkerSpiderfier). (Since the Leaflet API doesn't let us observe all the event types that the Google one does, the main difference between the original and the port is this: you must first call `unspiderfy` if and when you want to move a marker in the Leaflet version).

## Doesn't clustering solve this problem?

You may have seen the marker clustering libraries, which also help deal with markers that are close together.

That might be what you want. However, it probably *isn't* what you want (or isn't the only thing you want) if you have markers that could be in the exact same location, or close enough to overlap even at the maximum zoom level. In that case, clustering won't help your users see and/or click on the marker they're looking for.

## Demo

See the [demo map](http://jawj.github.io/OverlappingMarkerSpiderfier-Leaflet/demo.html) (the data is random: reload the map to reposition the markers).

## Download

Download [the compiled, minified JS source](http://jawj.github.com/OverlappingMarkerSpiderfier-Leaflet/bin/oms.min.js).

Or use it straight from [cdnjs](https://cdnjs.com/libraries/OverlappingMarkerSpiderfier-Leaflet) `<script src="https://cdnjs.cloudflare.com/ajax/libs/OverlappingMarkerSpiderfier-Leaflet/0.2.6/oms.min.js"></script>`.

## How to use

See the [demo map source](http://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet/blob/gh-pages/demo.html), or follow along here for a slightly simpler usage with commentary.

Create your map like normal (using the beautiful "Stamen watercolour OSM map":http://maps.stamen.com/#watercolor):

```js
var map = new L.Map('map_canvas', {center: new L.LatLng(51.505, -0.09), zoom: 13});
var layer = new L.StamenTileLayer('watercolor');
map.addLayer(layer);
```

Create an `OverlappingMarkerSpiderfier` instance:

```js
var oms = new OverlappingMarkerSpiderfier(map);
```

Instead of adding click listeners to your markers directly via `marker.addEventListener` or `marker.on`, add a global listener on the `OverlappingMarkerSpiderfier` instance instead. The listener will be passed the clicked marker as its first argument.

```js
var popup = new L.Popup();
oms.addListener('click', function(marker) {
  popup.setContent(marker.desc);
  popup.setLatLng(marker.getLatLng());
  map.openPopup(popup);
});
```
  
You can also add listeners on the `spiderfy` and `unspiderfy` events, which will be passed an array of the markers affected. In this example, we observe only the `spiderfy` event, using it to close any open `InfoWindow`:
  
```js
oms.addListener('spiderfy', function(markers) {
  map.closePopup();
});
```

Finally, tell the `OverlappingMarkerSpiderfier` instance about each marker as you add it, using the `addMarker` method:

```js
for (var i = 0; i < window.mapData.length; i ++) {
  var datum = window.mapData[i];
  var loc = new L.LatLng(datum.lat, datum.lon);
  var marker = new L.Marker(loc);
  marker.desc = datum.d;
  map.addLayer(marker);
  oms.addMarker(marker);  // <-- here
}
```

## Docs

### Loading

The Leaflet `L` object must be available when this code runs -- i.e. put the Leaflet API <script> tag before this one. The code has been tested with the 0.4 API version.


### Construction

```js
new OverlappingMarkerSpiderfier(map, options)`
```

Creates an instance associated with `map` (an `L.Map`).

The `options` argument is an optional `Object` specifying any options you want changed from their defaults. The available options are:

```js
keepSpiderfied`* (default: `false`)
```

By default, the OverlappingMarkerSpiderfier works like Google Earth, in that when you click a spiderfied marker, the markers unspiderfy before any other action takes place. 

Since this can make it tricky for the user to work through a set of markers one by one, you can override this behaviour by setting the `keepSpiderfied` option to `true`.

```js
nearbyDistance`* (default: `20`)
```

This is the pixel radius within which a marker is considered to be overlapping a clicked marker.

```js
circleSpiralSwitchover`* (default: `9`)
```

This is the lowest number of markers that will be fanned out into a spiral instead of a circle. Set this to `0` to always get spirals, or `Infinity` for all circles.

```js
legWeight`* (default: `1.5`)
```

This determines the thickness of the lines joining spiderfied markers to their original locations. 

```js
Instance methods: managing markers`
```

Note: methods that have no obvious return value return the OverlappingMarkerSpiderfier instance they were called on, in case you want to chain method calls.

```js
addMarker(marker)
```

Adds `marker` (an `L.Marker`) to be tracked.

```js
removeMarker(marker)
```

Removes `marker` from those being tracked.

```js
clearMarkers()`
```

Removes every `marker` from being tracked. Much quicker than calling `removeMarker` in a loop, since that has to search the markers array every time.

```js
getMarkers()
```

Returns an `Array` of all the markers that are currently being tracked. This is a copy of the one used internally, so you can do what you like with it.

### Instance methods: managing listeners

```js
addListener(event, listenerFunc)
```

Adds a listener to react to one of three events.
`event` may be `'click'`, `'format'`, `'spiderfy'` or `'unspiderfy'`.

For `'click'` events, `listenerFunc` receives one argument: the clicked marker object. You'll probably want to use this listener to do something like show an `L.Popup`.

For `'spiderfy'` or `'unspiderfy'` events, `listenerFunc` receives two arguments: first, an `Array` of the markers that were spiderfied or unspiderfied; second, an `Array` of the markers that were not. One use for these listeners is to make some distinction between spiderfied and non-spiderfied markers when some markers are spiderfied -- e.g. highlighting those that are spiderfied, or dimming out those that aren't.

```js
removeListener(event, listenerFunc)
```

Removes the specified listener on the specified event.

```js
clearListeners(event)
```

Removes all listeners on the specified event.

```js
unspiderfy()
```

Returns any spiderfied markers to their original positions, and triggers any listeners you may have set for this event. Unless no markers are spiderfied, in which case it does nothing. Be sure to call this before you call `setLatLng` on any tracked marker.

### Properties

You can set the following properties on an OverlappingMarkerSpiderfier instance:

*`legColors.usual[mapType]`* and *`legColors.highlighted[mapType]`*

These determine the usual and highlighted colours of the lines. 

You can also get and set any of the options noted in the constructor function documentation above as properties on an OverlappingMarkerSpiderfier instance.

## License

This software is released under the [MIT licence](http://www.opensource.org/licenses/mit-license.php)
