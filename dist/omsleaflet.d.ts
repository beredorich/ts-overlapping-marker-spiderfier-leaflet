/** @preserve OverlappingMarkerSpiderfier
 * https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
 * Copyright (c) 2011 - 2017 George MacKerron
 *
 * https://github.com/chancezeus/oms
 * Copyright (c) 2018 - 2021 Mark van Beek
 *
 * Forked and modified by Draxare
 * https://github.com/Draxare/ts-overlapping-marker-spiderfier-leaflet
 * Copyright (c) 2024 Alex Laisney
 *
 * Released under the MIT license: http://opensource.org/licenses/mit-license
 */
import * as L from 'leaflet';
import { LegColorOptions, ExtendedMarker, SpiderfierOptions, SpiderfierEventMap, SpiderfierEventHandler } from './omsleaflet-types';
declare class OverlappingMarkerSpiderfier {
    keepSpiderfied: boolean;
    nearbyDistance: number;
    circleSpiralSwitchover: number;
    circleFootSeparation: number;
    circleStartAngle: number;
    spiralFootSeparation: number;
    spiralLengthStart: number;
    spiralLengthFactor: number;
    legWeight: number;
    legColors: LegColorOptions;
    private map;
    private spiderfied;
    private spiderfying;
    private unspiderfying;
    private markers;
    private markerListeners;
    private listeners;
    constructor(map: L.Map, opts?: SpiderfierOptions);
    addMarker(marker: ExtendedMarker): this;
    getMarkers(): ExtendedMarker[];
    removeMarker(marker: ExtendedMarker): this;
    clearMarkers(): this;
    addListener<eventName extends keyof SpiderfierEventMap>(event: eventName, func: SpiderfierEventHandler<eventName>): this;
    removeListener<eventName extends keyof SpiderfierEventMap>(event: eventName, func: SpiderfierEventHandler<eventName>): this;
    clearListeners<eventName extends keyof SpiderfierEventMap>(event: eventName): this;
    unspiderfy(markerNotToMove?: ExtendedMarker | null): this;
    private initMarkerArrays;
    private trigger;
    private generatePtsCircle;
    private generatePtsSpiral;
    private spiderListener;
    private makeHighlightListeners;
    private spiderfy;
    private ptDistanceSq;
    private ptAverage;
    private minExtract;
    private arrIndexOf;
}
export { OverlappingMarkerSpiderfier, SpiderfierOptions };
