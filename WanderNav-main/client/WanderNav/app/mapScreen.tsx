import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const THEME = {
  PRIMARY_BRAND_COLOR: '#3498DB',
  ACCENT_COLOR: '#2ECC71',
  ERROR_COLOR: '#E74C3C',
  MAP_ROUTE_COLOR: '#3498DB',
  MAP_ROUTE_WIDTH: 6,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  let points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;
  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

const MapScreen = () => {
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // Expecting route geometry as a JSON string (array of [lng, lat]) or encoded polyline
  const startLat = Number(params.startLat);
  const startLng = Number(params.startLng);
  const destLat = Number(params.destLat);
  const destLng = Number(params.destLng);
  let routeCoords: { latitude: number; longitude: number }[] = [];
  if (params.routeGeometry) {
    try {
      const geometry = JSON.parse(params.routeGeometry as string);
      if (Array.isArray(geometry)) {
        routeCoords = geometry.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
      }
    } catch {
      // fallback: try decode polyline
      try {
        routeCoords = decodePolyline(params.routeGeometry as string);
      } catch {
        routeCoords = [];
      }
    }
  }
  useEffect(() => {
    if (mapRef.current && routeCoords.length > 1) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoords, {
          edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
          animated: true,
        });
        setLoading(false);
      }, 500);
    } else {
      setLoading(false);
      if (!params.routeGeometry || routeCoords.length < 2) {
        setError('No route found or invalid route data.');
      }
    }
  }, [routeCoords.length]);
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Route', headerShown: true }} />
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: startLat,
          longitude: startLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05 * (SCREEN_WIDTH / SCREEN_HEIGHT),
        }}
        showsUserLocation
      >
        <Marker coordinate={{ latitude: startLat, longitude: startLng }} title="Start">
          <Ionicons name="flag-outline" size={28} color={THEME.PRIMARY_BRAND_COLOR} />
        </Marker>
        <Marker coordinate={{ latitude: destLat, longitude: destLng }} title="Destination">
          <Ionicons name="flag" size={28} color={THEME.ERROR_COLOR} />
        </Marker>
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={THEME.MAP_ROUTE_COLOR}
            strokeWidth={THEME.MAP_ROUTE_WIDTH}
          />
        )}
      </MapView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={THEME.PRIMARY_BRAND_COLOR} />
          <Text style={styles.loadingText}>Loading route...</Text>
        </View>
      )}
      {error && !loading && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: THEME.PRIMARY_BRAND_COLOR,
    fontWeight: '500',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  errorText: {
    fontSize: 16,
    color: THEME.ERROR_COLOR,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default MapScreen; 