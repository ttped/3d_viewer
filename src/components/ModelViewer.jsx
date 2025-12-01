import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, useProgress, Center, useGLTF, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { Search, Box, Layers, Settings, ChevronRight, Info, RotateCcw, ArrowLeft } from 'lucide-react';
import './ModelViewer.css';

/**
 * ------------------------------------------------------------------
 * SMART MODEL LOADER (GLB & FBX)
 * ------------------------------------------------------------------
 */
function SmartModel({ url, ...props }) {
  const isFbx = url.toLowerCase().endsWith('.fbx');

  if (isFbx) {
    return <FbxModel url={url} {...props} />;
  }
  return <GltfModel url={url} {...props} />;
}

function FbxModel({ url, ...props }) {
  // useFBX returns the Group/Scene directly
  const fbx = useFBX(url);
  // FBX models often come in massive or tiny, automatic centering/scaling helps
  return <BaseInteractiveModel scene={fbx} {...props} />;
}

function GltfModel({ url, ...props }) {
  // useGLTF returns an object containing the scene
  const { scene } = useGLTF(url);
  return <BaseInteractiveModel scene={scene} {...props} />;
}

/**
 * Shared Logic for Interaction & Highlighting
 */
function BaseInteractiveModel({ scene, highlight, selectedPartId, onPartSelect }) {
  // Apply highlighting logic when search or selection changes
  useEffect(() => {
    updateHighlight(scene, highlight, selectedPartId);
  }, [scene, highlight, selectedPartId]);

  return (
    <primitive 
      object={scene} 
      onClick={(e) => {
        e.stopPropagation();
        // IMPORTANT: We pass the UUID for robust selection matching
        // We also pass the name and userData for the UI display
        onPartSelect({ 
          id: e.object.uuid, 
          name: e.object.name, 
          ...e.object.userData 
        });
      }}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'auto'}
    />
  );
}

/**
 * ------------------------------------------------------------------
 * HIGHLIGHT LOGIC
 * ------------------------------------------------------------------
 */
const updateHighlight = (scene, searchTerm, selectedPartId) => {
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
      
      // CHECK 1: Is this the specific clicked object? (Checks UUID)
      const isSelected = selectedPartId && child.uuid === selectedPartId;
      
      // CHECK 2: Does it match the text search? (Checks Name)
      const isSearchMatch = normalizedSearch && partName.includes(normalizedSearch);

      if (!normalizedSearch && !selectedPartId) {
        // Reset to default
        child.material = child.userData.originalMaterial;
      } else {
        const newMat = child.userData.originalMaterial.clone();

        if (isSelected) {
          // Priority 1: Exact Click Selection (Orange)
          newMat.emissive = selectColor;
          newMat.emissiveIntensity = 0.8; // Made brighter
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
 * DATA CONFIGURATION
 * ------------------------------------------------------------------
 */
const SYSTEMS = [
  { 
    id: 1, 
    name: 'Desk', 
    path: '/models/source/antique_wooden_desk_with_props.glb', 
    description: 'Imported GLB model' 
  },
  // Example of how you would add an FBX file:
  // { 
  //   id: 2, 
  //   name: 'Character', 
  //   path: '/models/character.fbx', 
  //   description: 'FBX Example' 
  // },
];

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
 * MAIN COMPONENT
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

  const handlePartSelect = (partData) => {
    console.log("Selected Part:", partData);
    setSelectedPart(partData);
  };

  return (
    <div className="mv-container">
      
      {/* LEFT SIDEBAR */}
      <div className="mv-sidebar">
        <div className="mv-header">
          <div className="mv-title-row">
            <Box size={24} color="#3b82f6" /> {/* Used var color directly for icon */}
            <h1 className="mv-title">3D Viewer</h1>
          </div>
        </div>

        <div className="mv-list-container">
          {selectedPart ? (
            // DETAIL VIEW
            <div className="mv-details-panel">
              <button onClick={() => setSelectedPart(null)} className="mv-back-btn">
                <ArrowLeft size={16} /> Back to List
              </button>

              <div className="mv-section-label">Selected Component</div>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--mv-text)', marginBottom: '1rem' }}>
                {selectedPart.name || "Unnamed Mesh"}
              </h2>

              <div className="mv-section-label">Raw Data</div>
              <div className="mv-raw-data">
                {JSON.stringify(selectedPart, null, 2)}
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
              placeholder="Search part..."
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
                  <SmartModel 
                    url={activeSystem.path} 
                    highlight={searchTerm} 
                    selectedPartId={selectedPart?.id} // Pass the UUID
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