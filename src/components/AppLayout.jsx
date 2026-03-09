import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../store/canvasStore';

const styles = {
  container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'system-ui' },
  toolbar: { backgroundColor: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 16px', display: 'flex', gap: '16px', alignItems: 'center' },
  button: { padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' },
  toolbarSection: { display: 'flex', gap: '12px', alignItems: 'center', borderRight: '1px solid #334155', paddingRight: '16px' },
  label: { fontSize: '12px', color: '#94a3b8' },
  colorInput: { width: '50px', height: '32px', border: 'none', borderRadius: '4px' },
  mainContent: { display: 'flex', flex: 1, overflow: 'hidden' },
  leftPanel: { width: '90px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '12px 8px', overflowY: 'auto' },
  panelLabel: { fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: '600' },
  toolButton: { width: '100%', padding: '8px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', marginBottom: '6px', cursor: 'pointer', fontSize: '11px' },
  toolButtonActive: { backgroundColor: '#2563eb', fontWeight: '600' },
  canvas: { flex: 1, backgroundColor: '#1a1f3a', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #334155', padding: '20px' },
  canvasElement: { backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', cursor: 'crosshair' },
  rightPanel: { width: '280px', backgroundColor: '#1e293b', borderLeft: '1px solid #334155', padding: '12px', overflowY: 'auto' },
  layerItem: { padding: '10px 12px', backgroundColor: '#334155', marginBottom: '6px', borderRadius: '4px', fontSize: '13px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  layerItemActive: { backgroundColor: '#2563eb', fontWeight: '600' },
  timeline: { height: '140px', backgroundColor: '#1e293b', borderTop: '1px solid #334155', padding: '12px' },
  timelineContent: { backgroundColor: '#0f172a', borderRadius: '4px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', border: '1px dashed #334155' },
};

export default function AppLayout() {
  const canvasRef = useRef(null);
  const startPointRef = useRef(null);
  const {
    isDrawing,
    setIsDrawing,
    currentColor,
    setCurrentColor,
    brushSize,
    setBrushSize,
    currentTool,
    setCurrentTool,
    drawingHistory,
    historyStep,
    saveDrawingState,
    undo,
    redo,
    layers,
    setActiveLayer,
    addLayer,
    toggleLayerVisibility,
    deleteLayer,
    setCanvasRef,
    setContextRef,
  } = useCanvasStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setCanvasRef(canvas);
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setContextRef(context);

    canvas.width = 800;
    canvas.height = 600;

    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    setTimeout(() => saveDrawingState(), 100);
  }, [setCanvasRef, setContextRef, saveDrawingState]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    startPointRef.current = { x, y };

    const context = canvas.getContext('2d');

    if (currentTool === 'pen') {
      context.strokeStyle = currentColor;
      context.lineWidth = brushSize;
      context.globalCompositeOperation = 'source-over';
      context.beginPath();
      context.moveTo(x, y);
    } else if (currentTool === 'eraser') {
      context.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const context = canvas.getContext('2d');

    if (currentTool === 'pen') {
      context.lineTo(x, y);
      context.stroke();
    } else if (currentTool === 'eraser') {
      context.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    } else if (currentTool === 'circle' && startPointRef.current) {
      const start = startPointRef.current;
      const radius = Math.sqrt(Math.pow(x - start.x, 2) + Math.pow(y - start.y, 2));
      
      // Redraw from history
      if (historyStep >= 0) {
        const img = new Image();
        img.src = drawingHistory[historyStep];
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
          context.strokeStyle = currentColor;
          context.lineWidth = brushSize;
          context.beginPath();
          context.arc(start.x, start.y, radius, 0, 2 * Math.PI);
          context.stroke();
        };
      }
    } else if (currentTool === 'rect' && startPointRef.current) {
      const start = startPointRef.current;
      
      // Redraw from history
      if (historyStep >= 0) {
        const img = new Image();
        img.src = drawingHistory[historyStep];
        img.onload = () => {
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(img, 0, 0);
          context.strokeStyle = currentColor;
          context.lineWidth = brushSize;
          context.strokeRect(start.x, start.y, x - start.x, y - start.y);
        };
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    startPointRef.current = null;
    setTimeout(() => saveDrawingState(), 10);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo();
        } else if (e.key === 'y') {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarSection}>
          <button style={styles.button}>📁 File</button>
          <button style={styles.button}>✏️ Edit</button>
          <button style={styles.button}>👁️ View</button>
        </div>

        <div style={styles.toolbarSection}>
          <button style={styles.button} onClick={() => undo()} disabled={historyStep <= 0} title="Undo (Ctrl+Z)">↶ Undo</button>
          <button style={styles.button} onClick={() => redo()} disabled={historyStep >= drawingHistory.length - 1} title="Redo (Ctrl+Y)">↷ Redo</button>
        </div>

        <div style={styles.toolbarSection}>
          <button style={styles.button} onClick={() => { const canvas = canvasRef.current; const context = canvas.getContext('2d'); context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height); saveDrawingState(); }} title="Clear canvas">🗑️ Clear</button>
        </div>

        <div style={styles.toolbarSection}>
          <label style={styles.label}>Color:</label>
          <input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} style={styles.colorInput} />
        </div>

        <div style={styles.toolbarSection}>
          <label style={styles.label}>Size:</label>
          <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value))} style={{ width: '100px' }} />
          <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '20px' }}>{brushSize}</span>
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          <div style={styles.panelLabel}>Tools</div>
          {['pen', 'eraser', 'circle', 'rect', 'scale'].map((tool) => (
            <button key={tool} style={{ ...styles.toolButton, ...(currentTool === tool ? styles.toolButtonActive : {}) }} onClick={() => setCurrentTool(tool)}>
              {tool === 'pen' && '✏️ Pen'}
              {tool === 'eraser' && '🧹 Eraser'}
              {tool === 'circle' && '⭕ Circle'}
              {tool === 'rect' && '▭ Rect'}
              {tool === 'scale' && '↔️ Scale'}
            </button>
          ))}
        </div>

        <div style={styles.canvas}>
          <canvas ref={canvasRef} style={styles.canvasElement} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
        </div>

        <div style={styles.rightPanel}>
          <div style={styles.panelLabel}>Layers ({layers.length})</div>
          {layers.map((layer) => (
            <div key={layer.id} style={{ ...styles.layerItem, ...(layer.active ? styles.layerItemActive : {}) }}>
              <div onClick={() => setActiveLayer(layer.id)} style={{ flex: 1 }}>
                {layer.visible ? '👁️' : '👁️‍🗨️'} {layer.name}
              </div>
              <button style={{ padding: '2px 6px', backgroundColor: '#475569', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', marginLeft: '4px' }} onClick={() => deleteLayer(layer.id)}>✕</button>
            </div>
          ))}
          <button style={styles.button} onClick={() => addLayer()}>➕ Add Layer</button>
        </div>
      </div>

      <div style={styles.timeline}>
        <div style={styles.panelLabel}>Timeline</div>
        <div style={styles.timelineContent}>🎬 Frame 1 | History: {historyStep + 1}/{drawingHistory.length}</div>
      </div>
    </div>
  );
}