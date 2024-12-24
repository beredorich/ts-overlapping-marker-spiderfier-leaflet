import * as L from 'leaflet';

export interface SpiderfierOptions {
    keepSpiderfied?: boolean;
    nearbyDistance?: number;
    circleSpiralSwitchover?: number;
    circleFootSeparation?: number;
    circleStartAngle?: number;
    spiralFootSeparation?: number;
    spiralLengthStart?: number;
    spiralLengthFactor?: number;
    legWeight?: number;
    legColors?: LegColorOptions;
  }

export interface LegColorOptions {
    usual: string;
    highlighted: string;
  }

export interface MarkerData {
    marker: L.Marker;
    markerPt: L.Point;
  }
