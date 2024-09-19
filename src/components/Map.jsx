"use client";
import React, { useState, useEffect } from 'react';
// START: Preserve spaces to avoid auto-sorting
import "leaflet/dist/leaflet.css";

import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.webpack.css";

import "leaflet-defaulticon-compatibility";
// END: Preserve spaces to avoid auto-sorting
import { MapContainer, Marker, Popup, TileLayer, Polyline, useMap,useMapEvents } from "react-leaflet";
// Haversine formula function
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
}

// Calculate total distance
function calculateTotalDistance(waypoints) {
    let totalDistance = 0;
    for (let i = 1; i < waypoints.length; i++) {
        totalDistance += haversineDistance(
            waypoints[i - 1].lat, waypoints[i - 1].lng,
            waypoints[i].lat, waypoints[i].lng
        );
    }
    return totalDistance;
}

// Calculate average speed
function calculateAverageSpeed(totalDistance, startTime, endTime) {
    const totalTime = (endTime - startTime) / 1000;
    const totalTimeInHours = totalTime / 3600;
    const totalDistanceInKm = totalDistance / 1000;

    const averageSpeed = totalDistanceInKm / totalTimeInHours;
    return averageSpeed;
}
function ChangeView({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center);
        }
    }, [center]);
    return null;
}
function LocationMarker() {
    const [position, setPosition] = useState(null)
    const map = useMapEvents({
      click() {
        map.locate()
      },
      locationfound(e) {
        setPosition(e.latlng)
        map.flyTo(e.latlng, map.getZoom())
      },
    })
  
    return position === null ? null : (
      <Marker position={position}>
        <Popup>You are here</Popup>
      </Marker>
    )
  }
function Map() {
    const [waypoints, setWaypoints] = useState([]);
    const [tracking, setTracking] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [totalDistance, setTotalDistance] = useState(0);
    const [averageSpeed, setAverageSpeed] = useState(0);
    const [currentPosition, setCurrentPosition] = useState(null);
    useEffect(() => {
        if (tracking) {
            const geoSuccess = (position) => {
                const { latitude, longitude } = position.coords;
                setWaypoints((prev) => [...prev, { lat: latitude, lng: longitude }]);
                setCurrentPosition({ lat: latitude, lng: longitude });
            };

            const geoError = (error) => {
                console.log('Error occurred. Error code: ' + error.code);
            };

            const geoOptions = {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 60000
            };

            const watchId = navigator.geolocation.watchPosition(geoSuccess, geoError, geoOptions);

            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [tracking]);

    const handleStartTracking = () => {
        setTracking(true);
        setWaypoints([]);
        setStartTime(new Date());
        setEndTime(null);
        setTotalDistance(0);
        setAverageSpeed(0);
    };

    const handleStopTracking = () => {
        const endTime = new Date();
        setTracking(false);
        setEndTime(endTime);

        const totalDistance = calculateTotalDistance(waypoints);
        setTotalDistance(totalDistance);

        const averageSpeed = calculateAverageSpeed(totalDistance, startTime, endTime);
        setAverageSpeed(averageSpeed);
    };

    return (
        <>
            <MapContainer
                preferCanvas={true}
                center={currentPosition || [20.5937, 78.9629]}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: '80vh', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {currentPosition && <Marker position={currentPosition} />}
                <Polyline positions={waypoints} />
                {/* {currentPosition && <ChangeView center={currentPosition} />} */}
                <LocationMarker />
            </MapContainer>
            {
                !tracking && (
                    <button onClick={handleStartTracking}>Start Trip</button>
                )
            }
            {
                tracking && (
                    <button onClick={handleStopTracking}>End Trip</button>
                )
            }
            {
                endTime && (
                    <div>
                        <p>Total Distance: {(totalDistance / 1000).toFixed(2)} km</p>
                        <p>Average Speed: {averageSpeed.toFixed(2)} km/h</p>
                    </div>
                )
            }
        </>

    );
}
export default Map;