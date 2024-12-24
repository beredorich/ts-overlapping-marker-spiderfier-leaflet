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
import { SpiderfierOptions, MarkerData } from './overlapping-marker-spiderfier-leaflet-types';

class OverlappingMarkerSpiderfier {
    public VERSION: string = '0.2.6';
    public keepSpiderfied: boolean;
    public nearbyDistance: number;
    public circleSpiralSwitchover: number;
    public circleFootSeparation: number;
    public circleStartAngle: number;
    public spiralFootSeparation: number;
    public spiralLengthStart: number;
    public spiralLengthFactor: number;
    public legWeight: number;
    public legColors: { usual: string; highlighted: string };
    private map: L.Map;
    private markers: L.Marker[] = [];
    private markerListeners: Array<{ marker: L.Marker; listener: (event: L.LeafletEvent) => void }> = [];
    private listeners: { [event: string]: Array<(...args: any[]) => void> } = {};
    private spiderfied: boolean = false;
    private spiderfying: boolean = false;
    private unspiderfying: boolean = false;
  
    constructor(map: L.Map, opts: SpiderfierOptions = {}) {
      this.map = map;
      this.keepSpiderfied = opts.keepSpiderfied || false;
      this.nearbyDistance = opts.nearbyDistance || 20;
      this.circleSpiralSwitchover = opts.circleSpiralSwitchover || 9;
      this.circleFootSeparation = opts.circleFootSeparation || 25;
      this.circleStartAngle = opts.circleStartAngle || (2 * Math.PI) / 12;
      this.spiralFootSeparation = opts.spiralFootSeparation || 28;
      this.spiralLengthStart = opts.spiralLengthStart || 11;
      this.spiralLengthFactor = opts.spiralLengthFactor || 5;
      this.legWeight = opts.legWeight || 1.5;
      this.legColors = opts.legColors || { usual: '#222', highlighted: '#f00' };
  
      this.initMarkerArrays();
      this.map.addEventListener('click', () => this.unspiderfy());
      this.map.addEventListener('zoomend', () => this.unspiderfy());
    }
  
    private initMarkerArrays(): void {
      this.markers = [];
      this.markerListeners = [];
    }
  
    public addMarker(marker: L.Marker): this {
      if ((marker as any)._oms) return this;
      (marker as any)._oms = true;
      const markerListener = (event: L.LeafletEvent) => this.spiderListener(event);
      marker.addEventListener('click', markerListener as L.LeafletEventHandlerFn);
      this.markerListeners.push({ marker, listener: markerListener });
      this.markers.push(marker);
      return this;
    }
  
    public getMarkers(): L.Marker[] {
      return [...this.markers];
    }
  
    public removeMarker(marker: L.Marker): this {
      if ((marker as any)._omsData) this.unspiderfy();
      const i = this.arrIndexOf(this.markers, marker);
      if (i < 0) return this;
      const markerListener = this.markerListeners.find(m => m.marker === marker);
      if (markerListener) {
        marker.removeEventListener('click', markerListener.listener as L.LeafletEventHandlerFn);
        this.markerListeners = this.markerListeners.filter(m => m !== markerListener);
      }
      delete (marker as any)._oms;
      this.markers.splice(i, 1);
      return this;
    }
  
    public clearMarkers(): this {
      this.unspiderfy();
      for (const { marker, listener } of this.markerListeners) {
        marker.removeEventListener('click', listener as L.LeafletEventHandlerFn);
        delete (marker as any)._oms;
      }
      this.initMarkerArrays();
      return this;
    }
  
    public addListener(event: string, func: (...args: any[]) => void): this {
      (this.listeners[event] ||= []).push(func);
      return this;
    }
  
    public removeListener(event: string, func: (...args: any[]) => void): this {
      const i = this.arrIndexOf(this.listeners[event], func);
      if (i >= 0) this.listeners[event].splice(i, 1);
      return this;
    }
  
    public clearListeners(event: string): this {
      this.listeners[event] = [];
      return this;
    }
  
    public trigger(event: string, ...args: any[]): void {
      (this.listeners[event] || []).forEach(func => func(...args));
    }
  
    private generatePtsCircle(count: number, centerPt: L.Point): L.Point[] {
      const circumference = this.circleFootSeparation * (2 + count);
      const legLength = circumference / (2 * Math.PI);
      const angleStep = (2 * Math.PI) / count;
      return Array.from({ length: count }, (_, i) => {
        const angle = this.circleStartAngle + i * angleStep;
        return new L.Point(
          centerPt.x + legLength * Math.cos(angle),
          centerPt.y + legLength * Math.sin(angle)
        );
      });
    }
  
    private generatePtsSpiral(count: number, centerPt: L.Point): L.Point[] {
      let legLength = this.spiralLengthStart;
      let angle = 0;
      return Array.from({ length: count }, (_, i) => {
        angle += this.spiralFootSeparation / legLength + i * 0.0005;
        const pt = new L.Point(
          centerPt.x + legLength * Math.cos(angle),
          centerPt.y + legLength * Math.sin(angle)
        );
        legLength += (2 * Math.PI * this.spiralLengthFactor) / angle;
        return pt;
      });
    }
  
    private async spiderListener(event: L.LeafletEvent): Promise<void> {
      const marker = event.target as L.Marker; // Cast the event target to a Marker
      const markerSpiderfied = (marker as any)._omsData;
  
      if (!markerSpiderfied || !this.keepSpiderfied) await this.unspiderfy();
      if (markerSpiderfied) {
        this.trigger('click', marker);
      } else {
        if (this.spiderfying) return;
        this.spiderfying = true;
  
        const nearbyMarkerData: MarkerData[] = [];
        const nonNearbyMarkers: L.Marker[] = [];
        const pxSq = this.nearbyDistance * this.nearbyDistance;
        const markerPt = this.map.latLngToLayerPoint(marker.getLatLng());
        for (const m of this.markers) {
          if (!this.map.hasLayer(m)) continue;
          const mPt = this.map.latLngToLayerPoint(m.getLatLng());
          if (this.ptDistanceSq(mPt, markerPt) < pxSq) {
            nearbyMarkerData.push({ marker: m, markerPt: mPt });
          } else {
            nonNearbyMarkers.push(m);
          }
        }
        if (nearbyMarkerData.length === 1) {
          this.trigger('click', marker);
        } else {
          this.spiderfy(nearbyMarkerData, nonNearbyMarkers);
        }
  
        this.spiderfying = false;
      }
    }
  
    private makeHighlightListeners(marker: L.Marker): { highlight: () => void; unhighlight: () => void } {
      return {
        highlight: () => (marker as any)._omsData.leg.setStyle({ color: this.legColors.highlighted }),
        unhighlight: () => (marker as any)._omsData.leg.setStyle({ color: this.legColors.usual })
      };
    }
  
    private spiderfy(markerData: MarkerData[], nonNearbyMarkers: L.Marker[]): void {
      const numFeet = markerData.length;
      const bodyPt = this.ptAverage(markerData.map(md => md.markerPt));
      const footPts = numFeet >= this.circleSpiralSwitchover
        ? this.generatePtsSpiral(numFeet, bodyPt).reverse()
        : this.generatePtsCircle(numFeet, bodyPt);
      const spiderfiedMarkers = footPts.map(footPt => {
        const footLl = this.map.layerPointToLatLng(footPt);
        const nearestMarkerDatum = this.minExtract(markerData, md => this.ptDistanceSq(md.markerPt, footPt));
        const marker = nearestMarkerDatum.marker;
        const leg = new L.Polyline([marker.getLatLng(), footLl], {
          color: this.legColors.usual,
          weight: this.legWeight,
          interactive: false // Updated to the correct property
        });
        this.map.addLayer(leg);
        (marker as any)._omsData = { usualPosition: marker.getLatLng(), leg: leg };
        if (this.legColors.highlighted !== this.legColors.usual) {
          const mhl = this.makeHighlightListeners(marker);
          (marker as any)._omsData.highlightListeners = mhl;
          marker.addEventListener('mouseover', mhl.highlight);
          marker.addEventListener('mouseout', mhl.unhighlight);
        }
        marker.setLatLng(footLl);
        marker.setZIndexOffset((marker.options.zIndexOffset ?? 0) + 1000000); // Using nullish coalescing operator
        return marker;
      });
      this.spiderfied = true;
      this.trigger('spiderfy', spiderfiedMarkers, nonNearbyMarkers);
    }
  
    public async unspiderfy(markerNotToMove: L.Marker | null = null): Promise<this> {
      if (!this.spiderfied) return this;
      if (this.unspiderfying) return this;
      this.unspiderfying = true;
  
      const unspiderfiedMarkers: L.Marker[] = [];
      const nonNearbyMarkers: L.Marker[] = [];
      for (const marker of this.markers) {
        if ((marker as any)._omsData) {
          this.map.removeLayer((marker as any)._omsData.leg);
          if (marker !== markerNotToMove) marker.setLatLng((marker as any)._omsData.usualPosition);
          marker.setZIndexOffset((marker.options.zIndexOffset ?? 0) - 1000000); // Using nullish coalescing operator
          const mhl = (marker as any)._omsData.highlightListeners;
          if (mhl) {
            marker.removeEventListener('mouseover', mhl.highlight);
            marker.removeEventListener('mouseout', mhl.unhighlight);
          }
          delete (marker as any)._omsData;
          unspiderfiedMarkers.push(marker);
        } else {
          nonNearbyMarkers.push(marker);
        }
      }
  
      this.spiderfied = false;
      this.unspiderfying = false;
      this.trigger('unspiderfy', unspiderfiedMarkers, nonNearbyMarkers);
      return this;
    }
  
    private ptDistanceSq(pt1: L.Point, pt2: L.Point): number {
      const dx = pt1.x - pt2.x;
      const dy = pt1.y - pt2.y;
      return dx * dx + dy * dy;
    }
  
    private ptAverage(pts: L.Point[]): L.Point {
      const sumX = pts.reduce((sum, pt) => sum + pt.x, 0);
      const sumY = pts.reduce((sum, pt) => sum + pt.y, 0);
      const numPts = pts.length;
      return new L.Point(sumX / numPts, sumY / numPts);
    }
  
    private minExtract<T>(set: T[], func: (item: T) => number): T {
      let bestIndex = 0;
      let bestVal = func(set[0]);
      for (let i = 1; i < set.length; i++) {
        const val = func(set[i]);
        if (val < bestVal) {
          bestVal = val;
          bestIndex = i;
        }
      }
      return set.splice(bestIndex, 1)[0];
    }
  
    private arrIndexOf<T>(arr: T[], obj: T): number {
      return arr.indexOf(obj);
    }
  }
  
  export { OverlappingMarkerSpiderfier, SpiderfierOptions };  