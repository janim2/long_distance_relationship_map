import React, { useState, useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Heart, MapPin, Download, Upload } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Timeline } from './components/Timeline';
import { DistanceMetrics } from './components/DistanceMetrics';
import type { Memory, Location, StoredData } from './types';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCqjoDt4rJ0NFvKedCwps1WlyQ6RZ78Blk';
const STORAGE_KEY = 'love-map-data';

function App() {
  const mapRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [person1, setPerson1] = useState<Location>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      return data.person1;
    }
    return { lat: 0, lng: 0, name: '' };
  });
  const [person2, setPerson2] = useState<Location>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      return data.person2;
    }
    return { lat: 0, lng: 0, name: '' };
  });
  const [memories, setMemories] = useState<Memory[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data: StoredData = JSON.parse(stored);
      return data.memories || [];
    }
    return [];
  });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [showHearts, setShowHearts] = useState(false);
  const [error, setError] = useState<string>('');
  const markersRef = useRef<google.maps.Marker[]>([]);
  const lineRef = useRef<google.maps.Polyline | null>(null);
  const animationFrameRef = useRef<number>();
  const overlaysRef = useRef<google.maps.OverlayView[]>([]);
  const mapInitializedRef = useRef(false);
  const CustomMarkerRef = useRef<any>(null);
  const heartOverlayRef = useRef<google.maps.OverlayView | null>(null);
  const memoryMarkersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry'],
          authReferrerPolicy: 'origin'
        });

        await loader.load();

        if (!isMounted || !mapRef.current || mapInitializedRef.current) return;

        class CustomMarker extends google.maps.OverlayView {
          private position: google.maps.LatLng;
          private image?: string;
          private div: HTMLDivElement | null = null;

          constructor(position: google.maps.LatLng, image?: string) {
            super();
            this.position = position;
            this.image = image;
          }

          onAdd() {
            this.div = document.createElement('div');
            this.div.className = 'custom-marker';
            
            if (this.image) {
              const img = document.createElement('img');
              img.src = this.image;
              img.className = 'marker-image';
              this.div.appendChild(img);
            } else {
              this.div.innerHTML = `
                <div class="marker-fallback">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#E11D48">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              `;
            }

            const panes = this.getPanes();
            if (panes) {
              panes.overlayLayer.appendChild(this.div);
            }
          }

          draw() {
            if (!this.div) return;

            const projection = this.getProjection();
            const point = projection.fromLatLngToDivPixel(this.position);
            
            if (point) {
              this.div.style.left = (point.x - 25) + 'px';
              this.div.style.top = (point.y - 25) + 'px';
            }
          }

          onRemove() {
            if (this.div) {
              this.div.parentNode?.removeChild(this.div);
              this.div = null;
            }
          }
        }

        CustomMarkerRef.current = CustomMarker;

        window.gm_authFailure = () => {
          setError('Google Maps authentication failed. Please check your API key.');
        };

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          styles: [
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
            },
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi',
              elementType: 'geometry',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'administrative',
              elementType: 'geometry',
              stylers: [{ lightness: 33 }]
            }
          ]
        });

        google.maps.event.addListenerOnce(map, 'idle', () => {
          if (!map.getDiv().querySelector('img')) {
            setError('Failed to load map tiles. Please check your internet connection.');
          }
        });

        mapInitializedRef.current = true;
        setMap(map);
        setError('');
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to load Google Maps. Please check your internet connection and try refreshing the page.');
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearMapObjects();
      delete window.gm_authFailure;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ person1, person2, memories }));
  }, [person1, person2, memories]);

  const clearMapObjects = () => {
    if (!map) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    memoryMarkersRef.current.forEach(marker => marker.setMap(null));
    memoryMarkersRef.current = [];

    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }

    overlaysRef.current.forEach(overlay => overlay.setMap(null));
    overlaysRef.current = [];

    if (heartOverlayRef.current) {
      heartOverlayRef.current.setMap(null);
      heartOverlayRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  };

  const createHeartOverlay = (position: google.maps.LatLng) => {
    if (!map) return null;

    const heartDiv = document.createElement('div');
    heartDiv.className = 'heart-overlay';
    heartDiv.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#E11D48"/>
      </svg>
    `;
    
    const overlay = new google.maps.OverlayView();
    overlay.setMap(map);

    overlay.onAdd = function() {
      const panes = overlay.getPanes();
      if (panes) {
        panes.overlayLayer.appendChild(heartDiv);
      }
    };

    overlay.draw = function() {
      const projection = overlay.getProjection();
      if (projection) {
        const pixel = projection.fromLatLngToDivPixel(position);
        if (pixel) {
          heartDiv.style.left = (pixel.x - 12) + 'px';
          heartDiv.style.top = (pixel.y - 12) + 'px';
        }
      }
    };

    heartOverlayRef.current = overlay;
    return overlay;
  };

  const animateHeart = (path: google.maps.LatLng[]) => {
    if (!map) return;

    const duration = 3000; // 3 seconds for one complete journey
    let start: number | null = null;
    
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = ((timestamp - start) % duration) / duration;

      if (heartOverlayRef.current) {
        heartOverlayRef.current.setMap(null);
      }

      const pos = google.maps.geometry.spherical.interpolate(
        path[0],
        path[1],
        progress
      );
      createHeartOverlay(pos);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setPerson: (person: Location) => void, person: Location) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPerson({ ...person, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const createCustomMarker = (position: google.maps.LatLngLiteral, image?: string) => {
    if (!map || !CustomMarkerRef.current) return;

    const marker = new CustomMarkerRef.current(
      new google.maps.LatLng(position.lat, position.lng),
      image
    );
    marker.setMap(map);
    overlaysRef.current.push(marker);
  };

  const calculateHeartPath = (start: google.maps.LatLng, end: google.maps.LatLng): google.maps.LatLng[] => {
    const path: google.maps.LatLng[] = [];
    const midPoint = google.maps.geometry.spherical.interpolate(start, end, 0.5);
    
    // Calculate perpendicular vector for heart curve
    const heading = google.maps.geometry.spherical.computeHeading(start, end);
    const distance = google.maps.geometry.spherical.computeDistanceBetween(start, end);
    const heartSize = distance * 0.15; // Heart size relative to distance
    
    // Create heart shape points
    const numPoints = 50;
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = 2 * Math.PI * t;
      
      // Heart shape parametric equations
      const x = 16 * Math.pow(Math.sin(angle), 3);
      const y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
      
      // Scale and rotate the heart
      const scale = heartSize / 16;
      const rotatedX = x * Math.cos(heading * Math.PI / 180) - y * Math.sin(heading * Math.PI / 180);
      const rotatedY = x * Math.sin(heading * Math.PI / 180) + y * Math.cos(heading * Math.PI / 180);
      
      const point = new google.maps.LatLng(
        midPoint.lat() + (rotatedY * scale) / 111111,
        midPoint.lng() + (rotatedX * scale) / (111111 * Math.cos(midPoint.lat() * Math.PI / 180))
      );
      
      path.push(point);
    }
    
    // Connect start and end points with curved lines
    const startControl = google.maps.geometry.spherical.interpolate(start, midPoint, 0.25);
    const endControl = google.maps.geometry.spherical.interpolate(end, midPoint, 0.25);
    
    // Add curved connection points
    const connectionPoints = 20;
    for (let i = 0; i <= connectionPoints; i++) {
      const t = i / connectionPoints;
      // Quadratic Bezier curve for start connection
      const startCurve = google.maps.geometry.spherical.interpolate(
        google.maps.geometry.spherical.interpolate(start, startControl, t),
        google.maps.geometry.spherical.interpolate(startControl, path[0], t),
        t
      );
      path.unshift(startCurve);
      
      // Quadratic Bezier curve for end connection
      const endCurve = google.maps.geometry.spherical.interpolate(
        google.maps.geometry.spherical.interpolate(path[path.length - 1], endControl, t),
        google.maps.geometry.spherical.interpolate(endControl, end, t),
        t
      );
      path.push(endCurve);
    }
    
    return path;
  };

  const updateMap = () => {
    if (!map || !person1.lat || !person2.lat) return;

    try {
      clearMapObjects();

      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: person1.lat, lng: person1.lng });
      bounds.extend({ lat: person2.lat, lng: person2.lng });
      
      // Add memory locations to bounds
      memories.forEach(memory => {
        bounds.extend(memory.location);
      });
      
      map.fitBounds(bounds, { padding: 100 });

      createCustomMarker({ lat: person1.lat, lng: person1.lng }, person1.image);
      createCustomMarker({ lat: person2.lat, lng: person2.lng }, person2.image);

      // Add memory markers
      memories.forEach(memory => {
        const marker = new google.maps.Marker({
          position: memory.location,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4F46E5',
            fillOpacity: 0.7,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
          title: memory.title
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold">${memory.title}</h3>
              <p class="text-sm text-gray-600">${memory.description}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        memoryMarkersRef.current.push(marker);
      });

      const start = new google.maps.LatLng(person1.lat, person1.lng);
      const end = new google.maps.LatLng(person2.lat, person2.lng);
      const heartPath = calculateHeartPath(start, end);

      const line = new google.maps.Polyline({
        path: heartPath,
        geodesic: true,
        strokeColor: '#E11D48',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map
      });

      lineRef.current = line;

      const path = [start, end];
      animateHeart(path);

      const calculatedDistance = google.maps.geometry.spherical.computeDistanceBetween(start, end);
      setDistance(calculatedDistance);
      setShowHearts(true);
      setError('');
    } catch (err) {
      console.error('Error updating map:', err);
      setError('An error occurred while updating the map. Please try again.');
    }
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMap();
  };

  const downloadMap = async () => {
    if (!captureRef.current) return;

    try {
      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      const link = document.createElement('a');
      link.download = 'love-map.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to download the image. Please try again.');
    }
  };

  const handleAddMemory = (memory: Omit<Memory, 'id'>) => {
    const newMemory: Memory = {
      ...memory,
      id: crypto.randomUUID()
    };
    setMemories(prev => [...prev, newMemory]);
    updateMap();
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(memory => memory.id !== id));
    updateMap();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Distance Means Nothing When Love Means Everything
          </h1>
          <p className="text-gray-600">Map your love across the miles</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 transform hover:scale-[1.02] transition-transform duration-300">
            <form onSubmit={handleLocationSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Person 1</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Name"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      value={person1.name}
                      onChange={(e) => setPerson1({ ...person1, name: e.target.value })}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Latitude"
                      step="any"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      value={person1.lat || ''}
                      onChange={(e) => setPerson1({ ...person1, lat: parseFloat(e.target.value) })}
                    />
                    <input
                      type="number"
                      placeholder="Longitude"
                      step="any"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      value={person1.lng || ''}
                      onChange={(e) => setPerson1({ ...person1, lng: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setPerson1, person1)}
                        />
                      </label>
                      {person1.image && (
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img src={person1.image} alt="Person 1" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Person 2</label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Name"
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      value={person2.name}
                      onChange={(e) => setPerson2({ ...person2, name: e.target.value })}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Latitude"
                      step="any"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      value={person2.lat || ''}
                      onChange={(e) => setPerson2({ ...person2, lat: parseFloat(e.target.value) })}
                    />
                    <input
                      type="number"
                      placeholder="Longitude"
                      step="any"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      value={person2.lng || ''}
                      onChange={(e) => setPerson2({ ...person2, lng: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setPerson2, person2)}
                        />
                      </label>
                      {person2.image && (
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img src={person2.image} alt="Person 2" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 transition-all duration-300"
              >
                <Heart className="h-4 w-4 mr-2" />
                Show Our Connection
              </button>
            </form>

            {distance > 0 && (
              <div className="mt-4 text-center animate-fade-in">
                <p className="text-lg font-semibold text-gray-700">
                  Distance between {person1.name} and {person2.name}:
                </p>
                <p className="text-2xl font-bold text-indigo-600">{Math.round(distance / 1000)} km</p>
                {showHearts && (
                  <div className="flex justify-center space-x-2 mt-2">
                    <Heart className="h-6 w-6 text-pink-500 animate-bounce" />
                    <Heart className="h-6 w-6 text-red-500 animate-bounce delay-100" />
                    <Heart className="h-6 w-6 text-pink-500 animate-bounce delay-200" />
                  </div>
                )}
                <button
                  onClick={downloadMap}
                  className="mt-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Map
                </button>
              </div>
            )}
          </div>

          <div ref={captureRef} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
            <div ref={mapRef} className="w-full h-[500px]" />
          </div>
        </div>

        {distance > 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            <DistanceMetrics distance={distance} />
            <Timeline
              memories={memories}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
            />
          </div>
        )}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .heart-overlay {
          position: absolute;
          animation: float 2s ease-in-out infinite;
          transform-origin: center;
          pointer-events: none;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .custom-marker {
          position: absolute;
          width: 50px;
          height: 50px;
          transform: translate(-50%, -50%);
        }

        .marker-image {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          object-fit: cover;
        }

        .marker-fallback {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}

export default App;