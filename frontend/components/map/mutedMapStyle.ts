/**
 * A quiet basemap, so NLEX is the only thing on screen with colour in it.
 *
 * Google Maps only (Android). Apple Maps ignores `customMapStyle` entirely and
 * has `mapType="mutedStandard"` instead, which is what the iOS path uses - see
 * SegmentMap.tsx.
 *
 * The aim is not a greyscale filter. It is to remove what competes with the
 * corridor: other roads keep their shape but lose their fill colour and their
 * casing, points of interest and transit go entirely, and labels are thinned
 * to the ones that tell you where you are. Land and water stay faintly
 * distinct, because a map with no water at all stops being recognisable as
 * Bulacan.
 */
export const MUTED_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F2F3F5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9AA1AC' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },

  // Places worth keeping: they are how you recognise where the stretch is.
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },

  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#F2F3F5' }] },

  /*
   * Other roads: shape without emphasis. Keeping them visible matters - a
   * corridor floating on blank grey gives no sense of what it runs past - but
   * they are drawn one step off the background so the eye goes to the line
   * that is coloured.
   */
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#E4E6EA' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#E4E6EA' }] },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#DCDFE4' }],
  },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#EAECEF' }] },

  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#DDE3EA' }] },
  { featureType: 'water', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
];
