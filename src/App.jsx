import React, { useState } from 'react';
import ModelViewer from './components/ModelViewer.jsx';
import { Layout, Box, Network } from 'lucide-react';

/* Simple inline styles for the main app layout */
const appStyles = {
  container: { 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh', 
    width: '100vw', /* Force full viewport width */
    fontFamily: 'sans-serif',
    margin: 0,
    padding: 0
  },
  navbar: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '2rem', 
    padding: '0 2rem', 
    height: '60px', 
    background: '#1e293b', 
    color: 'white',
    flexShrink: 0 /* Prevent navbar from shrinking */
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    transition: 'background 0.2s',
    opacity: 0.7
  },
  navItemActive: {
    opacity: 1,
    background: 'rgba(255,255,255,0.1)',
    fontWeight: 'bold'
  },
  content: { 
    flex: 1, 
    position: 'relative', /* IMPORTANT: This acts as the anchor for the viewer */
    overflow: 'hidden',
    width: '100%' 
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('viewer'); // Defaulting to viewer for demo

  return (
    <div style={appStyles.container}>
      {/* NAVIGATION BAR */}
      <nav style={appStyles.navbar}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginRight: 'auto' }}>
          WorkApp v1.0
        </div>
        
        <div 
          style={{ ...appStyles.navItem, ...(activeTab === 'home' ? appStyles.navItemActive : {}) }}
          onClick={() => setActiveTab('home')}
        >
          <Layout size={18} /> Dashboard
        </div>

        <div 
          style={{ ...appStyles.navItem, ...(activeTab === 'viewer' ? appStyles.navItemActive : {}) }}
          onClick={() => setActiveTab('viewer')}
        >
          <Box size={18} /> 3D Viewer
        </div>

        <div 
          style={{ ...appStyles.navItem, ...(activeTab === 'graph' ? appStyles.navItemActive : {}) }}
          onClick={() => setActiveTab('graph')}
        >
          <Network size={18} /> Knowledge Graph
        </div>
      </nav>

      {/* CONTENT AREA */}
      <main style={appStyles.content}>
        
        {activeTab === 'home' && (
          <div style={{ padding: '2rem' }}>
            <h1>Welcome Back</h1>
            <p>Select a tool from the navigation bar.</p>
          </div>
        )}

        {/* This is where your component is dropped in */}
        {activeTab === 'viewer' && <ModelViewer />}

        {activeTab === 'graph' && (
          <div style={{ padding: '2rem' }}>
            <h1>Knowledge Graph</h1>
            <p>Graph visualization would go here.</p>
          </div>
        )}

      </main>
    </div>
  );
}