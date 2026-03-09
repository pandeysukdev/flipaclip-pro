import { create } from 'zustand';

export const useCanvasStore = create((set, get) => ({
  // Canvas state
  isDrawing: false,
  currentColor: '#000000',
  brushSize: 3,
  currentTool: 'pen', // 'pen', 'eraser', 'circle', 'rect', 'scale'
  
  // Drawing history for undo/redo
  drawingHistory: [],
  historyStep: -1,
  
  // Layers
  layers: [
    { id: 1, name: 'Layer 1', visible: true, opacity: 1, active: true },
    { id: 2, name: 'Layer 2', visible: true, opacity: 1, active: false },
  ],
  activeLayerId: 1,
  
  // Actions
  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setCurrentColor: (color) => set({ currentColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  
  // Canvas reference
  canvasRef: null,
  contextRef: null,
  
  setCanvasRef: (ref) => set({ canvasRef: ref }),
  setContextRef: (ctx) => set({ contextRef: ctx }),
  
  // Drawing history actions
  saveDrawingState: () => {
    const state = get();
    const canvas = state.canvasRef;
    if (!canvas) return;
    
    // Remove any states after current step
    const newHistory = state.drawingHistory.slice(0, state.historyStep + 1);
    
    // Add new state
    newHistory.push(canvas.toDataURL());
    
    set({
      drawingHistory: newHistory,
      historyStep: newHistory.length - 1,
    });
  },
  
  undo: () => {
    const state = get();
    if (state.historyStep > 0) {
      const newStep = state.historyStep - 1;
      const canvas = state.canvasRef;
      const context = state.contextRef;
      
      const img = new Image();
      img.src = state.drawingHistory[newStep];
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
      
      set({ historyStep: newStep });
    }
  },
  
  redo: () => {
    const state = get();
    if (state.historyStep < state.drawingHistory.length - 1) {
      const newStep = state.historyStep + 1;
      const canvas = state.canvasRef;
      const context = state.contextRef;
      
      const img = new Image();
      img.src = state.drawingHistory[newStep];
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
      
      set({ historyStep: newStep });
    }
  },
  
  // Layer actions
  setActiveLayer: (layerId) => {
    set((state) => ({
      layers: state.layers.map((layer) => ({
        ...layer,
        active: layer.id === layerId,
      })),
      activeLayerId: layerId,
    }));
  },
  
  addLayer: () => {
    set((state) => {
      const newId = Math.max(...state.layers.map((l) => l.id)) + 1;
      return {
        layers: [
          ...state.layers,
          {
            id: newId,
            name: `Layer ${newId}`,
            visible: true,
            opacity: 1,
            active: true,
          },
        ],
        layers: state.layers.map((layer) => ({ ...layer, active: false })).concat({
          id: newId,
          name: `Layer ${newId}`,
          visible: true,
          opacity: 1,
          active: true,
        }),
      };
    });
  },
  
  toggleLayerVisibility: (layerId) => {
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
  },
  
  deleteLayer: (layerId) => {
    set((state) => {
      const newLayers = state.layers.filter((layer) => layer.id !== layerId);
      return {
        layers: newLayers,
        activeLayerId: newLayers.length > 0 ? newLayers[0].id : null,
      };
    });
  },
}));