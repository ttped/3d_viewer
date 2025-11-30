import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, Center } from '@react-three/drei';
import * as THREE from 'three';
import { Search, Box, Layers, Settings, ChevronRight, Info, RotateCcw, ArrowLeft } from 'lucide-react';
import './ModelViewer.css'; // Import the separated CSS

/**
 * ------------------------------------------------------------------
 * MOCK DATA
 * ------------------------------------------------------------------
 */
const SYSTEMS = [
  { id: 1, name: 'Main Engine Assembly', type: 'demo-engine', description: 'Primary propulsion unit. Contains Pistons, Gears, and Housing.' },
  { id: 2, name: 'Hydraulic Pump System', type: 'demo-pump', description: 'Fluid control module. Contains Valves and Reservoirs.' },
  { id: 3, name: 'Control Circuit Alpha', type: 'demo-circuit', description: 'Main PCB unit. Contains Chips and Capacitors.' },
];

/**
 * Helper to make materials transparent, solid, or highlighted based on search/selection
 */
const updateHighlight = (scene, searchTerm, selectedPartName) => {
  if (!scene) return;
  const normalizedSearch = searchTerm.toLowerCase().trim();
  const searchColor = new THREE.Color('#3b82f6'); // Blue for search
  const selectColor = new THREE.Color('#f97316'); // Orange for selection

  scene.traverse((child) => {
    if (child.isMesh) {
      // 1. Initialize original material storage if not exists
      if (!child.userData.originalMaterial) {
        child.userData.originalMaterial = child.material.clone();
      }

      const partName = (child.name || '').toLowerCase();
      const isSelected = selectedPartName && partName === selectedPartName.toLowerCase();
      const isSearchMatch = normalizedSearch && partName.includes(normalizedSearch);

      // 2. Logic: Reset, Select, or Search Highlight
      if (!normalizedSearch && !selectedPartName) {
        // Default state
        child.material = child.userData.originalMaterial;
      } else {
        const newMat = child.userData.originalMaterial.clone();

        if (isSelected) {
          // Priority 1: Selection (Orange)
          newMat.emissive = selectColor;
          newMat.emissiveIntensity = 0.6;
          newMat.color = selectColor;
          newMat.transparent = false;
          newMat.opacity = 1;
        } else if (isSearchMatch) {
          // Priority 2: Search Match (Blue)
          newMat.emissive = searchColor;
          newMat.emissiveIntensity = 0.5;
          newMat.color = searchColor;
          newMat.transparent = false;
          newMat.opacity = 1;
        } else {
          // Priority 3: Ghost Mode (Transparent Grey)
          newMat.transparent = true;
          newMat.opacity = 0.1;
          newMat.color = new THREE.Color('#cccccc');
          newMat.roughness = 1;
        }
        child.material = newMat;
      }
    }
  });
};

/**
 * ------------------------------------------------------------------
 * PROCEDURAL ASSEMBLY (DEMO MODE)
 * ------------------------------------------------------------------
 */
function ProceduralAssembly({ type, highlight, onPartSelect, selectedPartName }) {
  const groupRef = useRef();
  
  useEffect(() => {
    if (groupRef.current) {
      updateHighlight(groupRef.current, highlight, selectedPartName);
    }
  }, [highlight, selectedPartName, type]);

  const parts = useMemo(() => {
    // These objects now only contain position/color data, no extra fake metadata
    const items = [];
    if (type === 'demo-engine') {
      items.push(
        { name: 'Engine-Housing-Outer', geo: 'box', args: [4, 3, 4], pos: [0, 0, 0], color: '#475569' },
        { name: 'Piston-001', geo: 'cylinder', args: [0.5, 0.5, 2, 32], pos: [-1, 2, -1], color: '#cbd5e1' },
        { name: 'Piston-002', geo: 'cylinder', args: [0.5, 0.5, 2, 32], pos: [1, 2, -1], color: '#cbd5e1' },
        { name: 'Piston-003', geo: 'cylinder', args: [0.5, 0.5, 2, 32], pos: [-1, 2, 1], color: '#cbd5e1' },
        { name: 'Piston-004', geo: 'cylinder', args: [0.5, 0.5, 2, 32], pos: [1, 2, 1], color: '#cbd5e1' },
        { name: 'Gear-Drive-Main', geo: 'torus', args: [1.2, 0.3, 16, 100], pos: [0, 0, 2.1], color: '#fbbf24' },
        { name: 'Shaft-Coupling', geo: 'box', args: [0.5, 0.5, 5], pos: [2.5, 0, 0], color: '#94a3b8' }
      );
    } else if (type === 'demo-pump') {
      items.push(
        { name: 'Reservoir-Tank', geo: 'sphere', args: [2, 32, 32], pos: [0, 0, 0], color: '#3b82f6' },
        { name: 'Valve-Inlet', geo: 'box', args: [1, 1, 1], pos: [-2, 0, 0], color: '#ef4444' },
        { name: 'Valve-Outlet', geo: 'box', args: [1, 1, 1], pos: [2, 0, 0], color: '#22c55e' },
        { name: 'Pipe-Connector', geo: 'cylinder', args: [0.2, 0.2, 6, 16], pos: [0, 2, 0], rot: [0, 0, Math.PI/2], color: '#64748b' }
      );
    } else {
       items.push(
        { name: 'PCB-Board-Base', geo: 'box', args: [5, 0.2, 5], pos: [0, 0, 0], color: '#064e3b' },
        { name: 'Chip-CPU', geo: 'box', args: [1, 0.5, 1], pos: [0, 0.5, 0], color: '#1e293b' },
        { name: 'Capacitor-C1', geo: 'cylinder', args: [0.3, 0.3, 0.8, 16], pos: [-1.5, 0.5, -1.5], color: '#eab308' },
        { name: 'Capacitor-C2', geo: 'cylinder', args: [0.3, 0.3, 0.8, 16], pos: [-1.0, 0.5, -1.5], color: '#eab308' },
        { name: 'Resistor-Array', geo: 'box', args: [2, 0.3, 0.5], pos: [1, 0.4, 1.5], color: '#000000' }
      );
    }
    return items;
  }, [type]);

  return (
    <group ref={groupRef} dispose={null}>
      {parts.map((part, idx) => (
        <mesh 
          key={idx} 
          name={part.name} 
          position={part.pos} 
          rotation={part.rot || [0,0,0]}
          castShadow 
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onPartSelect(part);
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          {part.geo === 'box' && <boxGeometry args={part.args} />}
          {part.geo === 'sphere' && <sphereGeometry args={part.args} />}
          {part.geo === 'cylinder' && <cylinderGeometry args={part.args} />}
          {part.geo === 'torus' && <torusGeometry args={part.args} />}
          <meshStandardMaterial color={part.color} metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="mv-loader">
        <div className="spin-fast" style={{ 
          width: '32px', height: '32px', 
          border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', 
          borderRadius: '50%', marginBottom: '0.5rem' 
        }} />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>
          {progress.toFixed(0)}% loaded
        </span>
      </div>
    </Html>
  );
}

/**
 * ------------------------------------------------------------------
 * EXPORTED COMPONENT
 * ------------------------------------------------------------------
 */
export default function ModelViewer() {
  const [activeSystem, setActiveSystem] = useState(SYSTEMS[0]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRotate, setAutoRotate] = useState(false);
  const orbitRef = useRef();

  const handleSystemChange = (system) => {
    setActiveSystem(system);
    setSelectedPart(null);
    setSearchTerm('');
  };

  const handlePartSelect = (part) => {
    setSelectedPart(part);
  };

  return (
    <div className="mv-container">
      
      {/* LEFT SIDEBAR */}
      <div className="mv-sidebar">
        <div className="mv-header">
          <div className="mv-title-row">
            <Box size={24} color="#2563eb" />
            <h1 className="mv-title">TechViewer 3D</h1>
          </div>
          <p className="mv-subtitle">System Component Visualizer</p>
        </div>

        <div className="mv-list-container">
          {selectedPart ? (
            // DETAIL VIEW (Simpler now)
            <div className="mv-details-panel">
              <button onClick={() => setSelectedPart(null)} className="mv-back-btn">
                <ArrowLeft size={16} /> Back to List
              </button>

              <div className="mv-section-label">Selected Component</div>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
                {selectedPart.name}
              </h2>

              <div className="mv-section-label">Raw Data</div>
              {/* Displays generic data structure for debugging */}
              <div className="mv-raw-data">
                {JSON.stringify({ 
                  name: selectedPart.name, 
                  position: selectedPart.pos,
                  geometry: selectedPart.geo
                }, null, 2)}
              </div>
            </div>
          ) : (
            // LIST VIEW
            <>
              <div className="mv-section-label">
                <Layers size={12} /> Available Systems
              </div>
              <div>
                {SYSTEMS.map((sys) => (
                  <button
                    key={sys.id}
                    onClick={() => handleSystemChange(sys)}
                    className={`mv-list-btn ${activeSystem.id === sys.id ? 'active' : ''}`}
                  >
                    <div className="mv-btn-header">
                      <span className="mv-btn-title">{sys.name}</span>
                      {activeSystem.id === sys.id && <ChevronRight size={16} color="#3b82f6" />}
                    </div>
                    <p className="mv-btn-desc">{sys.description}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mv-footer">
            <Info size={16} style={{ marginTop: 2, flexShrink: 0 }} />
            <p>{selectedPart ? 'Press "Back" to return.' : 'Select a system. Click parts to identify.'}</p>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="mv-content">
        
        {/* TOOLBAR */}
        <div className="mv-toolbar">
          <div className="mv-search-wrapper">
            <div className="mv-search-icon">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="Search part (e.g., 'Piston', 'Gear')..."
              className="mv-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="mv-search-clear">
                  Clear
                </button>
            )}
          </div>

          <div className="mv-controls">
            <button 
              onClick={() => { setSearchTerm(''); setSelectedPart(null); orbitRef.current?.reset(); }}
              className="mv-icon-btn"
              title="Reset View"
            >
              <RotateCcw size={20} />
            </button>
            <button 
              onClick={() => setAutoRotate(!autoRotate)}
              className={`mv-icon-btn ${autoRotate ? 'active' : ''}`}
              title="Toggle Rotation"
            >
              <Settings size={20} className={autoRotate ? 'spin-slow' : ''} />
            </button>
          </div>
        </div>

        {/* 3D CANVAS */}
        <div className="mv-canvas-wrapper">
            <Canvas shadows dpr={[1, 2]} camera={{ position: [5, 5, 5], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
              
              <Suspense fallback={<Loader />}>
                <Center>
                  <ProceduralAssembly 
                    type={activeSystem.type} 
                    highlight={searchTerm} 
                    selectedPartName={selectedPart?.name}
                    onPartSelect={handlePartSelect}
                  />
                </Center>
              </Suspense>

              <OrbitControls 
                ref={orbitRef} 
                autoRotate={autoRotate}
                autoRotateSpeed={1.0}
                makeDefault 
              />
            </Canvas>

            {searchTerm && (
              <div className="mv-status-badge">
                Isolating: <span style={{ color: '#93c5fd' }}>"{searchTerm}"</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}