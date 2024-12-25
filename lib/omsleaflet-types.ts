import * as L from 'leaflet';

interface OMSData {
  leg: L.Polyline;
  usualPosition: L.LatLng;
  highlightListeners?: {
    highlight: () => void,
    unhighlight: () => void
  };
}

export interface LegColorOptions {
  usual: string;
  highlighted: string;
}

export interface ExtendedMarker extends L.Marker {
  _oms?: boolean;
  _omsData?: OMSData;
}

export interface MarkerData {
  marker: ExtendedMarker;
  markerPt: L.Point;
}

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
