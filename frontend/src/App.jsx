import React, { useState, useMemo, useEffect } from "react";
import {
  Activity,
  Database,
  Map as MapIcon,
  Loader2,
  Menu,
  BarChart3,
} from "lucide-react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
import FileUpload from "./components/FileUpload";
import FilterControls from "./components/FilterControls";
import MapComponent from "./components/MapComponent";
import ChatPage from "./pages/ChatPage";
import Header from "./components/Header";

function MapPage() {
  const [data, setData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState("markers");

  const [filters, setFilters] = useState({
    state: "All",
    district: "All",
  });

  const apiUrl = import.meta.env.VITE_API_URL;

  const normalizeRow = (row) => {
    const get = (keys) => keys.reduce((val, k) => val ?? row[k], undefined);
    return {
      "Location Name": get(["Location Name", "location_name", "Location", "location", "district", "District", "DISTRICT"]),
      State: get(["State", "state", "STATE"]),
      "PIN code": get(["PIN code", "pin_code", "PIN_CODE", "PIN Code", "pincode"]),
      "Coverage Status": get(["Coverage Status", "coverage_status", "COVERAGE_PERCENT", "Coverage (%)"]),
      Latitude: get(["Latitude", "latitude", "LATITUDE", "lat"]),
      Longitude: get(["Longitude", "longitude", "LONGITUDE", "lng", "long"]),
      TSP: get(["TSP", "tsp"]),
      Technology: get(["Technology", "technology", "TECHNOLOGY"]),
      "Total Worker": get(["Total Worker", "total_worker", "TOTAL_WORKER"]),
      "Male Worker": get(["Male Worker", "male_worker", "MALE_WORKER"]),
      "Female Worker": get(["Female Worker", "female_worker", "FEMALE_WORKER"]),
      "Age 18-25": get(["Age 18-25", "age_between_18_to_25", "AGE_BETWEEN_18_TO_25"]),
      "Age 25-40": get(["Age 25-40", "age_between_25_to_40", "AGE_BETWEEN_25_TO_40"]),
      "Age 40-60": get(["Age 40-60", "age_between_40_to_60", "AGE_BETWEEN_40_TO_60"]),
      ...row,
    };
  };

  const loadDataFromApi = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${apiUrl}/api/coverage-data`);
      if (!res.ok) throw new Error(`API call failed (${res.status})`);
      const payload = await res.json();
      if (!payload.success) throw new Error(payload.detail || payload.message || "API returned failure");
      setData(payload.data.map(normalizeRow));
    } catch (error) {
      console.error("Load data API error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => { loadDataFromApi(); }, []);

  const handleDataLoaded = (newData) => {
    setIsProcessing(true);
    setTimeout(() => {
      setData(newData.map(normalizeRow));
      setIsProcessing(false);
    }, 1500);
  };

  const { availableStates } = useMemo(() => {
    if (!data.length) return { availableStates: [] };
    return { availableStates: [...new Set(data.map((d) => d.State))].filter(Boolean).sort() };
  }, [data]);

  const activeDistricts = useMemo(() => {
    if (!data.length) return [];
    let filtered = filters.state !== "All" ? data.filter(d => d.State === filters.state) : data;
    return [...new Set(filtered.map(d => d.District || d['Location Name']))].filter(Boolean).sort();
  }, [data, filters.state]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchState = filters.state === "All" || item.State === filters.state;
      const districtVal = item.District || item['Location Name'];
      const matchDistrict = filters.district === "All" || districtVal === filters.district;
      return matchState && matchDistrict;
    });
  }, [data, filters]);

  useEffect(() => {
    setFilters(prev => ({ ...prev, district: "All" }));
  }, [filters.state]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 text-slate-900 font-sans overflow-hidden">
      <Header />
      <main className="flex-1 flex relative overflow-hidden">
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center"
            >
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="w-12 h-12 text-blue-600" />
              </motion.div>
              <h3 className="mt-4 text-lg font-semibold text-slate-800">Processing Worker Data...</h3>
              <p className="text-slate-500 text-sm">Generating GIS Visualization</p>
            </motion.div>
          )}
        </AnimatePresence>

        {data.length === 0 ? (
          <div className="w-full h-full flex items-start justify-center p-4 bg-gray-50/50 mt-20">
            <div className="max-w-xl w-full">
              <div className="text-center mb-6 mt-6">
                <h2 className="text-2xl font-semibold text-slate-800 mb-1">Worker Coverage Map</h2>
                <p className="text-sm text-slate-500">Upload your dataset to generate interactive GIS maps</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <FileUpload onDataLoaded={handleDataLoaded} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <motion.aside
              initial={false}
              animate={{ width: showSidebar ? 320 : 0, opacity: showSidebar ? 1 : 0 }}
              className="bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full overflow-hidden relative z-10"
            >
              <div className="p-4 border-b border-gray-100 flex items-center justify-between mt-28">
                <h2 className="font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Control Panel
                </h2>
                <button
                  onClick={() => setFilters({ state: "All", district: "All" })}
                  className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
                >
                  Reset
                </button>
              </div>

              <div className="p-4 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 shrink-0">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Visible Locations</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">{filteredData.length}</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <div className="text-[10px] uppercase text-emerald-600 font-bold mb-1">Total Workers</div>
                    <div className="text-xl font-bold text-slate-900">
                      {filteredData.reduce((acc, curr) => acc + (parseInt(curr["Total Worker"]) || 0), 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1">
                  <button
                    onClick={() => setViewMode("markers")}
                    className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === "markers" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:bg-gray-200"}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <MapIcon size={16} /><span>Points</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode("heatmap")}
                    className={`flex-1 py-1.5 rounded-md text-sm font-semibold transition-colors ${viewMode === "heatmap" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:bg-gray-200"}`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Activity size={16} /><span>Heatmap</span>
                    </div>
                  </button>
                </div>

                <FilterControls
                  filters={filters}
                  setFilters={setFilters}
                  availableStates={availableStates}
                  activeDistricts={activeDistricts}
                />

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Visible Records</h3>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-slate-600">Showing</span>
                    <span className="font-bold text-slate-900">{filteredData.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${data.length > 0 ? (filteredData.length / data.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 text-xs text-center text-slate-400">
                GIS Visualization System v1.0
              </div>
            </motion.aside>

            <div className="flex-1 relative h-full bg-gray-100">
              <MapComponent data={filteredData} viewMode={viewMode} activeAgeGroups={filters.ageGroups} />
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="absolute top-4 left-4 z-[1000] bg-white p-2 rounded-lg shadow-md border border-gray-200 text-slate-700 hover:bg-gray-50"
                >
                  <Menu size={20} />
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/chat" element={<ChatPage />} />
    </Routes>
  );
}

export default App;
