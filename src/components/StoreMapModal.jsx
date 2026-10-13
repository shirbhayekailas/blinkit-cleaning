import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  X, 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Share2, 
  Search, 
  ChevronRight, 
  Clock, 
  Compass, 
  Car,
  Building2,
  Phone,
  MessageSquare,
  Sparkles,
  Layers,
  Map as MapIcon,
  List,
  Columns
} from 'lucide-react';
import { 
  resolveStoreCoordinates, 
  getStoreCleaningStatus, 
  getNearbyStoresMatrix, 
  generateMultiStopGoogleMapsUrl,
  generateGoogleMapsNavUrl,
  calculateDistance,
  estimateDrivingTime
} from '../utils/distance';
import { toast } from './Toast';

export default function StoreMapModal({
  isOpen,
  onClose,
  stores = [],
  cleanings = [],
  initialSelectedStore = null,
  onOpenStoreHistory = null
}) {
  if (!isOpen) return null;

  // Active modal tabs: 'map' | 'proximity' | 'route'
  const [activeTab, setActiveTab] = useState('map');
  
  // Mobile-specific layout mode for 'map' tab: 'split' | 'map' | 'list'
  const [mobileTab, setMobileTab] = useState('split');

  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Google Maps layer type: 'roadmap' | 'satellite' | 'terrain'
  const [mapType, setMapType] = useState('roadmap');

  // Selected Origin store for Nearest Proximity Finder
  const [originStoreCode, setOriginStoreCode] = useState(() => {
    if (initialSelectedStore) {
      return (initialSelectedStore.storeCode || initialSelectedStore.code || '').trim().toUpperCase();
    }
    return (stores[0]?.storeCode || stores[0]?.code || '').trim().toUpperCase();
  });

  // Sync originStoreCode whenever initialSelectedStore prop changes
  useEffect(() => {
    if (initialSelectedStore) {
      const code = (initialSelectedStore.storeCode || initialSelectedStore.code || '').trim().toUpperCase();
      if (code) {
        setOriginStoreCode(code);
      }
    }
  }, [initialSelectedStore]);

  // Multi-stop Route Builder state
  const [routeStoreCodes, setRouteStoreCodes] = useState(() => {
    if (initialSelectedStore) {
      const code = (initialSelectedStore.storeCode || initialSelectedStore.code || '').trim().toUpperCase();
      return code ? [code] : [];
    }
    return [];
  });

  // Map references
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routePolylineRef = useRef(null);

  // Available unique cities
  const uniqueCities = useMemo(() => {
    const set = new Set();
    stores.forEach(s => {
      const c = (s.city || '').trim();
      if (c) set.add(c);
    });
    return Array.from(set).sort();
  }, [stores]);

  // Enriched stores with coordinates and cleaning status
  const enrichedStores = useMemo(() => {
    return stores.map(store => {
      const coords = resolveStoreCoordinates(store);
      const statusInfo = getStoreCleaningStatus(store, cleanings);
      return {
        ...store,
        coordinates: coords,
        statusInfo
      };
    });
  }, [stores, cleanings]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return enrichedStores.filter(st => {
      const q = searchTerm.toLowerCase().trim();
      const code = (st.storeCode || st.code || '').toLowerCase();
      const name = (st.storeName || '').toLowerCase();
      const address = (st.address || '').toLowerCase();
      const zone = (st.zone || '').toLowerCase();
      const matchesSearch = !q || code.includes(q) || name.includes(q) || address.includes(q) || zone.includes(q);

      const matchesCity = cityFilter === 'ALL' || (st.city || '').toLowerCase() === cityFilter.toLowerCase();
      const matchesStatus = statusFilter === 'ALL' || st.statusInfo.status === statusFilter;

      return matchesSearch && matchesCity && matchesStatus;
    });
  }, [enrichedStores, searchTerm, cityFilter, statusFilter]);

  // Selected origin store object
  const originStore = useMemo(() => {
    return enrichedStores.find(st => (st.storeCode || st.code || '').trim().toUpperCase() === originStoreCode) || enrichedStores[0];
  }, [enrichedStores, originStoreCode]);

  // Proximity Matrix from Origin Store (strictly ranked by distance ascending)
  const proximityMatrix = useMemo(() => {
    if (!originStore) return [];
    return getNearbyStoresMatrix(originStore, enrichedStores, cleanings);
  }, [originStore, enrichedStores, cleanings]);

  // Filtered proximity list based on current status filter
  const filteredProximityList = useMemo(() => {
    if (statusFilter === 'ALL') return proximityMatrix;
    return proximityMatrix.filter(st => st.statusInfo.status === statusFilter);
  }, [proximityMatrix, statusFilter]);

  // Route stores objects
  const routeStores = useMemo(() => {
    return routeStoreCodes
      .map(code => enrichedStores.find(st => (st.storeCode || st.code || '').trim().toUpperCase() === code))
      .filter(Boolean);
  }, [routeStoreCodes, enrichedStores]);

  // Total Route Distance & Time Calculation
  const routeStats = useMemo(() => {
    if (routeStores.length < 2) {
      return { totalKm: 0, totalMinutes: 0, text: 'Single stop' };
    }
    let totalKm = 0;
    for (let i = 0; i < routeStores.length - 1; i++) {
      const a = routeStores[i].coordinates;
      const b = routeStores[i + 1].coordinates;
      if (a && b) {
        const d = calculateDistance(a.latitude, a.longitude, b.latitude, b.longitude);
        if (d) totalKm += d;
      }
    }
    totalKm = Math.round(totalKm * 10) / 10;
    const { minutes, text } = estimateDrivingTime(totalKm);
    return { totalKm, totalMinutes: minutes, text };
  }, [routeStores]);

  // Helper to add store to route
  const handleAddToRoute = (storeCode) => {
    const code = (storeCode || '').trim().toUpperCase();
    if (!code) return;
    if (routeStoreCodes.includes(code)) {
      toast.info(`${code} is already in tonight's route.`);
      return;
    }
    if (routeStoreCodes.length >= 6) {
      toast.warning('Route maximum limit (6 stores per shift) reached.');
      return;
    }
    setRouteStoreCodes(prev => [...prev, code]);
    toast.success(`Added ${code} to route! (${routeStoreCodes.length + 1} Stops)`);
  };

  const handleRemoveFromRoute = (index) => {
    setRouteStoreCodes(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveRouteStop = (index, direction) => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= routeStoreCodes.length) return;
    const copy = [...routeStoreCodes];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;
    setRouteStoreCodes(copy);
  };

  // Google Maps Multi-Stop Navigation URL
  const googleMapsRouteUrl = useMemo(() => {
    return generateMultiStopGoogleMapsUrl(routeStores);
  }, [routeStores]);

  // WhatsApp Route Share
  const handleShareRouteWhatsApp = () => {
    if (routeStores.length === 0) {
      toast.warning('Route is empty. Select stores first.');
      return;
    }
    let text = `🌙 *SK ENTERPRISES - NIGHT SHIFT MULTI-STORE ROUTE*\n`;
    text += `📅 Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n`;
    text += `🚚 *Total Stops:* ${routeStores.length} Stores | *Total Distance:* ~${routeStats.totalKm} km\n`;
    text += `⏱️ *Est. Transit Time:* ${routeStats.text}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    routeStores.forEach((st, idx) => {
      const code = st.storeCode || st.code;
      const statusBadge = st.statusInfo.status === 'overdue' ? '🔴 OVERDUE' : st.statusInfo.status === 'dueSoon' ? '🟡 DUE SOON' : '🟢 CLEANED';
      text += `*Stop ${idx + 1}:* ${code} - ${st.storeName}\n`;
      text += `📍 ${st.address || st.city || 'Store Location'}\n`;
      text += `🏷️ Status: ${statusBadge} (${st.statusInfo.label})\n`;
      if (st.managerPhone) text += `📞 Store Manager: ${st.managerName || 'Manager'} (${st.managerPhone})\n`;
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🗺️ *1-Click Google Maps Full Navigation Route:*\n`;
    text += `${googleMapsRouteUrl}\n\n`;
    text += `Drive safely & coordinate arrival times with dark store in-charge!`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  // -------------------------------------------------------------
  // DIRECT GOOGLE MAPS TILE CONFIGURATION
  // -------------------------------------------------------------
  const getGoogleMapsTileUrl = (type) => {
    switch (type) {
      case 'satellite':
        return 'https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'; // Google Hybrid Satellite
      case 'terrain':
        return 'https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'; // Google Terrain
      case 'roadmap':
      default:
        return 'https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'; // Google Maps Default Roadmap
    }
  };

  // -------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION & RESIZE GUARDS
  // -------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Guard: Prevent double initialization crash
    if (!mapInstanceRef.current) {
      if (mapContainerRef.current._leaflet_id) {
        delete mapContainerRef.current._leaflet_id;
      }

      const initialLat = originStore?.coordinates?.latitude || 19.0434;
      const initialLon = originStore?.coordinates?.longitude || 73.0691;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLon],
        zoom: 12,
        zoomControl: false
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Google Maps Tile Layer
      const tile = L.tileLayer(getGoogleMapsTileUrl(mapType), {
        subdomains: ['0', '1', '2', '3'],
        attribution: '&copy; Google Maps',
        maxZoom: 21
      }).addTo(map);

      tileLayerRef.current = tile;
      mapInstanceRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    // Explicit Invalidation Resizing: Guarantees map tiles render on all viewports
    const forceResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };

    forceResize();
    const t1 = setTimeout(forceResize, 80);
    const t2 = setTimeout(forceResize, 250);
    const t3 = setTimeout(forceResize, 600);

    window.addEventListener('resize', forceResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', forceResize);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Invalidate size on tab or mobile view change
  useEffect(() => {
    const trigger = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    trigger();
    const timer = setTimeout(trigger, 120);
    return () => clearTimeout(timer);
  }, [activeTab, mobileTab]);

  // Switch Google Maps Layer on mapType state change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(getGoogleMapsTileUrl(mapType), {
      subdomains: ['0', '1', '2', '3'],
      attribution: '&copy; Google Maps',
      maxZoom: 21
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [mapType]);

  // Smoothly Fly / Pan Google Map to Origin Store when origin changes
  useEffect(() => {
    if (mapInstanceRef.current && originStore?.coordinates?.latitude && originStore?.coordinates?.longitude) {
      mapInstanceRef.current.flyTo(
        [originStore.coordinates.latitude, originStore.coordinates.longitude],
        13,
        { animate: true, duration: 0.6 }
      );
    }
  }, [originStoreCode, originStore]);

  // Update Map Markers & Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    // Render store marker pins
    filteredStores.forEach(st => {
      if (!st.coordinates || !st.coordinates.latitude || !st.coordinates.longitude) return;

      const code = (st.storeCode || st.code || '').trim().toUpperCase();
      const isOrigin = originStoreCode === code;
      const routeIndex = routeStoreCodes.indexOf(code);
      const isRouteStop = routeIndex !== -1;
      const status = st.statusInfo.status; // 'overdue' | 'dueSoon' | 'cleaned'

      // Pin Color styling
      let pinColor = '#10b981'; // Green
      let ringColor = 'rgba(16, 185, 129, 0.45)';

      if (status === 'overdue') {
        pinColor = '#ef4444'; // Red
        ringColor = 'rgba(239, 68, 68, 0.5)';
      } else if (status === 'dueSoon') {
        pinColor = '#f59e0b'; // Amber
        ringColor = 'rgba(245, 158, 11, 0.5)';
      }

      if (isOrigin) {
        pinColor = '#4f46e5'; // Deep Indigo for origin
        ringColor = 'rgba(79, 70, 229, 0.7)';
      }

      // Custom Google Maps Style Marker
      const customHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            width: ${isOrigin ? '38px' : isRouteStop ? '34px' : '28px'};
            height: ${isOrigin ? '38px' : isRouteStop ? '34px' : '28px'};
            border-radius: 50%;
            background: ${pinColor};
            box-shadow: 0 0 0 ${isOrigin ? '5px' : '3px'} ${ringColor}, 0 4px 10px rgba(0,0,0,0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 900;
            font-size: ${isOrigin ? '15px' : isRouteStop ? '13px' : '10px'};
            border: 2px solid #ffffff;
            transition: transform 0.2s;
          ">
            ${isOrigin ? '★' : isRouteStop ? `#${routeIndex + 1}` : (code.length > 3 ? code.slice(0, 3) : code)}
          </div>
          <div style="
            background: rgba(15, 23, 42, 0.92);
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 6px;
            margin-top: 2px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.2);
          ">
            ${code}
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'custom-google-marker',
        html: customHtml,
        iconSize: [42, 52],
        iconAnchor: [21, 26]
      });

      const marker = L.marker([st.coordinates.latitude, st.coordinates.longitude], { icon });

      // Direct turn-by-turn navigation URL to this store
      const directGMapUrl = `https://www.google.com/maps/dir/?api=1&destination=${st.coordinates.latitude},${st.coordinates.longitude}&travelmode=driving`;

      // Rich Interactive Popup Content
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-weight: 900; color: #0f172a; font-size: 13px;">${code}</span>
            <span style="
              font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;
              background: ${pinColor}22; color: ${pinColor}; border: 1px solid ${pinColor}55;
            ">
              ${st.statusInfo.label}
            </span>
          </div>

          <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">${st.storeName || code}</div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 4px;">${st.address || st.city}</div>
          ${st.zone ? `<div style="font-size: 10px; color: #4f46e5; font-weight: 700; margin-bottom: 6px;">📍 Cluster: ${st.zone}</div>` : ''}

          ${st.managerPhone ? `
            <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; color: #475569; margin-bottom: 8px;">
              <span>📞 ${st.managerName || 'Manager'}:</span>
              <a href="tel:${st.managerPhone}" style="color: #059669; font-weight: 700; text-decoration: none;">${st.managerPhone}</a>
            </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
            <button 
              id="btn-select-origin-${code}" 
              style="
                padding: 6px 8px; font-size: 10px; font-weight: 800; border-radius: 8px;
                background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; cursor: pointer;
              "
            >
              ★ Select as Hub
            </button>
            <button 
              id="btn-route-${code}" 
              style="
                padding: 6px 8px; font-size: 10px; font-weight: 800; border-radius: 8px;
                background: ${isRouteStop ? '#ef4444' : '#4f46e5'}; color: #ffffff; border: none; cursor: pointer;
              "
            >
              ${isRouteStop ? '✕ Remove Stop' : '➕ Add to Route'}
            </button>
          </div>

          <a 
            href="${directGMapUrl}" 
            target="_blank" 
            style="
              display: block; text-align: center; margin-top: 6px; padding: 4px; border-radius: 6px;
              font-size: 10px; font-weight: 700; color: #2563eb; background: #eff6ff; text-decoration: none; border: 1px solid #bfdbfe;
            "
          >
            🚗 Navigate in Google Maps ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml);

      // Clicking marker immediately selects this store as Origin Hub
      marker.on('click', () => {
        setOriginStoreCode(code);
      });

      marker.on('popupopen', () => {
        setTimeout(() => {
          const originBtn = document.getElementById(`btn-select-origin-${code}`);
          const routeBtn = document.getElementById(`btn-route-${code}`);

          if (originBtn) {
            originBtn.onclick = () => {
              setOriginStoreCode(code);
              toast.info(`Selected ${code} as Center Hub!`);
              marker.closePopup();
            };
          }

          if (routeBtn) {
            routeBtn.onclick = () => {
              if (isRouteStop) {
                setRouteStoreCodes(prev => prev.filter(c => c !== code));
                toast.info(`Removed ${code} from route.`);
              } else {
                handleAddToRoute(code);
              }
              marker.closePopup();
            };
          }
        }, 50);
      });

      markersLayerRef.current.addLayer(marker);
    });

    // Draw multi-stop route polyline
    if (routeStores.length >= 2) {
      const latlngs = routeStores
        .filter(st => st.coordinates && st.coordinates.latitude && st.coordinates.longitude)
        .map(st => [st.coordinates.latitude, st.coordinates.longitude]);

      if (latlngs.length >= 2) {
        routePolylineRef.current = L.polyline(latlngs, {
          color: '#4f46e5',
          weight: 5,
          opacity: 0.9,
          dashArray: '8, 8',
          lineCap: 'round'
        }).addTo(map);
      }
    }
  }, [filteredStores, originStoreCode, routeStoreCodes, routeStores]);

  return (
    <div 
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-1 sm:p-2 md:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-7xl h-[95vh] max-h-[95vh] shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header & Tab Navigation */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  Dark Stores Google Radar &amp; Routes
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Google Maps
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                Visual status radar, nearest store proximity matrix &amp; multi-stop driving routes
              </p>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'map'
                  ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🗺️ Google Map</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px]">
                {filteredStores.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('proximity')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'proximity'
                  ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>📍 Proximity Grid</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px]">
                {proximityMatrix.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('route')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'route'
                  ? 'bg-white dark:bg-slate-750 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>🚗 Route ({routeStores.length})</span>
              {routeStores.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              )}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="px-3 sm:px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
          
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search */}
            <div className="relative min-w-[140px] sm:min-w-[180px] max-w-xs flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search store code, cluster, area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              <option value="ALL">All Cities ({stores.length})</option>
              {uniqueCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              <option value="ALL">All Status</option>
              <option value="overdue">🔴 Overdue Only</option>
              <option value="dueSoon">🟡 Due Soon Only (Next 7d)</option>
              <option value="cleaned">🟢 Cleaned &amp; Current</option>
            </select>
          </div>

          {/* Status Pin Legend */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-bold text-slate-500">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
              <span>🔴 Overdue</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs" />
              <span>🟡 Due Soon</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>🟢 Cleaned</span>
            </div>
            <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-extrabold pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <span>★ Origin Hub</span>
            </div>
          </div>

        </div>

        {/* Mobile View Toggle Bar (Only shown on mobile when on Map tab) */}
        {activeTab === 'map' && (
          <div className="md:hidden px-3 py-1.5 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
              Mobile Display:
            </span>
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setMobileTab('split')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 ${
                  mobileTab === 'split' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Columns className="w-3 h-3" />
                <span>Split</span>
              </button>
              <button
                onClick={() => setMobileTab('map')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 ${
                  mobileTab === 'map' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <MapIcon className="w-3 h-3" />
                <span>Map Only</span>
              </button>
              <button
                onClick={() => setMobileTab('list')}
                className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition flex items-center gap-1 ${
                  mobileTab === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <List className="w-3 h-3" />
                <span>Nearest List ({filteredProximityList.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body: Split Layout */}
        <div className="flex-1 flex overflow-hidden relative min-h-0 min-w-0">
          
          {/* TAB 1: SPLIT GOOGLE MAPS + NEAREST STORES LIST VIEW */}
          <div className={`w-full h-full flex flex-col md:flex-row relative min-h-0 min-w-0 ${activeTab === 'map' ? 'flex' : 'hidden'}`}>
            
            {/* LEFT SIDEBAR: Selected Store Profile & Proximity-Ranked Stores */}
            <div className={`
              ${mobileTab === 'map' ? 'hidden md:flex' : ''}
              ${mobileTab === 'list' ? 'flex h-full w-full' : ''}
              ${mobileTab === 'split' ? 'flex h-[52%] md:h-full w-full' : ''}
              md:w-96 lg:w-[420px] flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shrink-0 z-10 min-h-0
            `}>
              
              {/* Origin Hub Card & Store Switcher */}
              <div className="p-3 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white shrink-0 space-y-2 border-b border-indigo-950">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    Selected Origin Hub:
                  </span>
                  <span className="text-[11px] font-bold text-indigo-200">
                    {originStore?.city}
                  </span>
                </div>

                {/* Instant Store Selector Dropdown */}
                <select
                  value={originStoreCode}
                  onChange={(e) => setOriginStoreCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-800/90 border border-indigo-400/40 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-400 shadow-inner"
                >
                  {enrichedStores.map(st => (
                    <option key={st.storeCode || st.code} value={(st.storeCode || st.code).trim().toUpperCase()}>
                      {st.storeCode} - {st.storeName} ({st.city})
                    </option>
                  ))}
                </select>

                {/* Origin Details Mini Banner */}
                {originStore && (
                  <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-white text-sm leading-tight flex items-center gap-1.5">
                          <span className="text-amber-400">★</span>
                          <span>{originStore.storeCode} - {originStore.storeName}</span>
                        </h4>
                        <p className="text-[11px] text-indigo-200 line-clamp-1 mt-0.5">
                          📍 {originStore.address || originStore.city}
                        </p>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                        originStore.statusInfo.status === 'overdue'
                          ? 'bg-rose-500/80 text-white'
                          : originStore.statusInfo.status === 'dueSoon'
                          ? 'bg-amber-500/80 text-white'
                          : 'bg-emerald-500/80 text-white'
                      }`}>
                        {originStore.statusInfo.label}
                      </span>
                    </div>

                    {originStore.zone && (
                      <div className="text-[10px] font-bold text-indigo-300">
                        Area Cluster: {originStore.zone}
                      </div>
                    )}

                    <div className="pt-1 flex items-center justify-between text-[11px] border-t border-white/10">
                      {originStore.managerPhone ? (
                        <div className="flex items-center gap-2">
                          <a 
                            href={`tel:${originStore.managerPhone}`}
                            className="text-emerald-300 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{originStore.managerPhone}</span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No phone attached</span>
                      )}

                      <a
                        href={originStore.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(originStore.address || originStore.storeName)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-300 hover:text-white font-bold flex items-center gap-1 hover:underline text-[11px]"
                      >
                        <span>Maps Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Nearest Stores Section Header */}
              <div className="px-3.5 py-2 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1">
                    <span>📍 Nearest Dark Stores</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">({filteredProximityList.length})</span>
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    Ranked strictly from shortest to longest distance
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('proximity')}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Grid View</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* Proximity Ranked Stores Cards List */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 min-h-0">
                {filteredProximityList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No matching stores found for current filters.
                  </div>
                ) : (
                  filteredProximityList.map((target, idx) => {
                    const code = target.storeCode || target.code;
                    const inRoute = routeStoreCodes.includes(code);
                    const status = target.statusInfo.status;
                    const navGMapUrl = generateGoogleMapsNavUrl(originStore, target);

                    return (
                      <div
                        key={code}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 transition shadow-xs space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                                  {code}
                                </h5>
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border ${
                                  status === 'overdue'
                                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900/60'
                                    : status === 'dueSoon'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900/60'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900/60'
                                }`}>
                                  {target.statusInfo.label}
                                </span>
                              </div>
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                                {target.storeName || code}
                              </p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">
                                📍 {target.address || target.city} {target.zone ? `(${target.zone})` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Distance & Drive Time */}
                          <div className="text-right shrink-0">
                            <div className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                              {target.distanceKm} km
                            </div>
                            <div className="text-[9px] font-bold text-slate-500">
                              ⏱️ {target.drivingTime.text}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Navigate / Set As Origin / Add Route */}
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-1.5 text-[11px]">
                          <button
                            onClick={() => {
                              setOriginStoreCode(code);
                              toast.info(`Switched origin hub to ${code}`);
                            }}
                            className="px-2 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 font-bold transition flex items-center gap-1"
                            title="Set this store as Origin to recalculate nearest stores from here"
                          >
                            <span>★ Set Origin</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={navGMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold transition flex items-center gap-1 border border-blue-200 dark:border-blue-900"
                              title="Launch turn-by-turn Google Maps driving navigation"
                            >
                              <Navigation className="w-3 h-3 text-blue-600" />
                              <span>Navigate</span>
                            </a>

                            <button
                              onClick={() => {
                                if (inRoute) {
                                  setRouteStoreCodes(prev => prev.filter(c => c !== code));
                                } else {
                                  handleAddToRoute(code);
                                }
                              }}
                              className={`px-2 py-1 rounded-lg font-extrabold text-[11px] transition flex items-center gap-1 ${
                                inRoute
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {inRoute ? '✕ Remove' : '+ Route'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT AREA: Full Google Map with Layer Switcher */}
            <div className={`
              ${mobileTab === 'list' ? 'hidden md:flex' : ''}
              ${mobileTab === 'map' ? 'flex h-full w-full' : ''}
              ${mobileTab === 'split' ? 'flex h-[48%] md:h-full w-full' : ''}
              flex-1 relative min-h-[220px] md:min-h-0 min-w-0 overflow-hidden
            `}>
              <div 
                ref={mapContainerRef} 
                className="w-full h-full z-0" 
                style={{ width: '100%', height: '100%', minHeight: '100%', position: 'absolute', inset: 0 }}
              />

              {/* Floating Google Maps Controls (Top-Right) */}
              <div className="absolute top-3 right-3 z-10 flex flex-wrap items-center gap-2">
                {/* Google Maps Layer Mode Switcher */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 text-xs font-bold">
                  <button
                    onClick={() => setMapType('roadmap')}
                    className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                      mapType === 'roadmap'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🗺️ Road</span>
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                      mapType === 'satellite'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🛰️ Satellite</span>
                  </button>
                  <button
                    onClick={() => setMapType('terrain')}
                    className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
                      mapType === 'terrain'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🏔️ Terrain</span>
                  </button>
                </div>

                {/* Direct Google Maps Web App Link */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${originStore?.coordinates?.latitude || 19.0434},${originStore?.coordinates?.longitude || 73.0691}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:bg-blue-50 flex items-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in Google Maps App ↗</span>
                  <span className="sm:hidden">GMap ↗</span>
                </a>
              </div>

              {/* Active Route Pill (Bottom-Left on Map) */}
              {routeStores.length > 0 && (
                <div className="absolute bottom-4 left-4 z-10 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs">
                  <div>
                    <span className="text-[9px] text-indigo-300 font-bold block uppercase">Route</span>
                    <span className="font-extrabold">{routeStores.length} Stops (~{routeStats.totalKm} km)</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('route')}
                    className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1"
                  >
                    <Car className="w-3 h-3" />
                    <span>View Route</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* TAB 2: NEAREST STORES FINDER (PROXIMITY DISTANCE MATRIX GRID VIEW) */}
          <div className={`w-full h-full overflow-y-auto p-4 sm:p-5 ${activeTab === 'proximity' ? 'block' : 'hidden'}`}>
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Origin Store Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-900/90 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                    ★
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                      Proximity Matrix Center (Origin Hub)
                    </span>
                    <h4 className="text-base font-black text-white">
                      {originStore?.storeCode} - {originStore?.storeName}
                    </h4>
                    <p className="text-xs text-indigo-200">
                      📍 {originStore?.address || originStore?.city} {originStore?.zone ? `• Cluster: ${originStore.zone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={originStoreCode}
                    onChange={(e) => setOriginStoreCode(e.target.value)}
                    className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 border border-indigo-400/40 text-xs font-bold text-white focus:ring-2 focus:ring-indigo-400"
                  >
                    {enrichedStores.map(st => (
                      <option key={st.storeCode || st.code} value={(st.storeCode || st.code).trim().toUpperCase()}>
                        Change Origin: {st.storeCode} ({st.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nearest Stores Ranked List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Proximity Ranked Nearest Stores</span>
                      <span className="text-xs font-bold text-slate-500">
                        (Calculated via Haversine Geodesic Matrix)
                      </span>
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Showing {filteredProximityList.length} dark stores sorted strictly by shortest distance
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProximityList.map((target, idx) => {
                    const code = target.storeCode || target.code;
                    const inRoute = routeStoreCodes.includes(code);
                    const status = target.statusInfo.status;
                    const navGMapUrl = generateGoogleMapsNavUrl(originStore, target);

                    return (
                      <div
                        key={code}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition shadow-xs flex flex-col justify-between gap-3 group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 transition">
                                  {code}
                                </h5>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  status === 'overdue'
                                    ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:border-rose-900/60'
                                    : status === 'dueSoon'
                                    ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900/60'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-900/60'
                                }`}>
                                  {target.statusInfo.label}
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                {target.storeName || code}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                📍 {target.address || target.city} {target.zone ? `(${target.zone})` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Distance Badge */}
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                              {target.distanceKm} km
                            </div>
                            <div className="text-[10px] font-bold text-slate-500">
                              ⏱️ {target.drivingTime.text}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                          <button
                            onClick={() => {
                              setOriginStoreCode(code);
                              toast.info(`Switched origin to ${code}`);
                            }}
                            className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                          >
                            <span>Set as New Origin</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <a
                              href={navGMapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold transition flex items-center gap-1 border border-blue-200 dark:border-blue-900 text-xs"
                              title="Open turn-by-turn Google Maps driving navigation"
                            >
                              <Navigation className="w-3 h-3 text-blue-600" />
                              <span>Navigate</span>
                            </a>

                            <button
                              onClick={() => {
                                if (inRoute) {
                                  setRouteStoreCodes(prev => prev.filter(c => c !== code));
                                } else {
                                  handleAddToRoute(code);
                                }
                              }}
                              className={`px-3 py-1 rounded-xl font-extrabold text-xs transition flex items-center gap-1 shadow-xs ${
                                inRoute
                                  ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {inRoute ? '✕ Remove' : '+ Add to Route'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* TAB 3: MULTI-STOP NIGHT SHIFT ROUTE PLANNER */}
          <div className={`w-full h-full overflow-y-auto p-4 sm:p-5 ${activeTab === 'route' ? 'block' : 'hidden'}`}>
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Route Summary Hero Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-200">
                      Night Shift Multi-Store Van &amp; Gear Sequence
                    </span>
                    <h3 className="text-xl font-black text-white">
                      Optimal Sequence: {routeStores.length} Dark Stores
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15">
                    <div className="text-right">
                      <span className="text-[10px] text-indigo-200 block">Total Shift Transit</span>
                      <span className="text-base font-black text-white">~{routeStats.totalKm} km</span>
                    </div>
                    <div className="w-px h-6 bg-white/20" />
                    <div>
                      <span className="text-[10px] text-indigo-200 block">Est. Driving Time</span>
                      <span className="text-base font-black text-emerald-300">{routeStats.text}</span>
                    </div>
                  </div>
                </div>

                {/* Big Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <a
                    href={googleMapsRouteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-4 rounded-2xl bg-white text-indigo-900 hover:bg-indigo-50 font-black text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-4 h-4 text-indigo-600" />
                    <span>Launch Google Maps Multi-Stop Navigation</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>

                  <button
                    onClick={handleShareRouteWhatsApp}
                    className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Route Sequence on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Stop by Stop Detailed Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Stops Sequence (Reorder with Up / Down)
                  </h4>
                  {routeStores.length > 0 && (
                    <button
                      onClick={() => setRouteStoreCodes([])}
                      className="text-xs font-bold text-rose-500 hover:underline"
                    >
                      Clear Route
                    </button>
                  )}
                </div>

                {routeStores.length === 0 ? (
                  <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                      🗺️
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        No stores in tonight's route yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        Select dark stores from the <strong>Google Map</strong> or <strong>Nearest Stores List</strong> to plan optimal machinery &amp; van routing.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                    >
                      Open Google Map to Pick Stores
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {routeStores.map((st, idx) => {
                      const code = st.storeCode || st.code;
                      const status = st.statusInfo.status;

                      // Distance to NEXT stop
                      let legDistance = null;
                      if (idx < routeStores.length - 1) {
                        const nextCoords = routeStores[idx + 1].coordinates;
                        if (st.coordinates && nextCoords) {
                          legDistance = calculateDistance(
                            st.coordinates.latitude,
                            st.coordinates.longitude,
                            nextCoords.latitude,
                            nextCoords.longitude
                          );
                        }
                      }

                      return (
                        <React.Fragment key={code}>
                          <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                {idx + 1}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-sm font-black text-slate-900 dark:text-white">
                                    {code}
                                  </h5>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                    status === 'overdue'
                                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                                      : status === 'dueSoon'
                                      ? 'bg-amber-50 text-amber-600 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                  }`}>
                                    {st.statusInfo.label}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                  {st.storeName}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  📍 {st.address || st.city} {st.zone ? `(${st.zone})` : ''}
                                </p>
                                {st.managerPhone && (
                                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>Manager: {st.managerName || 'Assigned'} ({st.managerPhone})</span>
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Reorder and Delete Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleMoveRouteStop(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                                title="Move Earlier"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => handleMoveRouteStop(idx, 'down')}
                                disabled={idx === routeStores.length - 1}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                                title="Move Later"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => handleRemoveFromRoute(idx)}
                                className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Remove Stop"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Transit Segment between stops */}
                          {legDistance !== null && (
                            <div className="flex items-center gap-2 pl-7 py-1 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                              <div className="w-0.5 h-6 bg-indigo-300 dark:bg-indigo-700 mx-auto" />
                              <div className="bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5">
                                <Car className="w-3 h-3" />
                                <span>~{legDistance} km Transit ({estimateDrivingTime(legDistance).text})</span>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
