import React, { useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  createDockview,
  DockviewApi,
  DockviewReadyEvent,
  GroupPanelPartInitParameters,
  IContentRenderer,
  IDockviewPanelProps,
} from 'dockview-core';
import 'dockview-core/dist/styles/dockview.css';

// Stores
import { useUIStore } from '../../stores/useUIStore';
import { useScoreStore } from '../../stores/useScoreStore';
import { useTransportStore } from '../../stores/useTransportStore';

// Components
import { ScoreEditor } from '../editor/ScoreEditor';
import { ScoreVisualizer } from '../visualizer/ScoreVisualizer';
import { PerformanceLayer } from '../visualizer/PerformanceLayer';
import { TransportBar } from '../hud/TransportBar';
import { MixerHUD } from '../hud/MixerHUD';
import { MappingPanel } from '../editor/MappingPanel';

// Utils & Hooks
import { usePerformanceEvents } from '../../hooks/usePerformanceEvents';
import { useMediaStream } from '../../hooks/useMediaStream';
import { compileScoreText } from '../../utils/score-parser';

// Services
import { MidiService } from '../../services/MidiService';

const ScoreEditorPanel = (props: IDockviewPanelProps) => (
  <div className="score-dock-panel-wrapper" style={{ height: '100%', background: '#272822' }}>
    <ScoreEditor panelId={props.api.id} />
  </div>
);

const MappingPanelTab = () => (
  <div className="score-dock-panel-wrapper" style={{ height: '100%' }}>
    <MappingPanel />
  </div>
);

const VisualizerPanel = () => (
  <div className="score-dock-panel-wrapper" style={{ height: '100%', background: '#0b1119' }}>
    <ScoreVisualizer />
  </div>
);

const components = {
  'score-editor': ScoreEditorPanel,
  'score-visualizer': VisualizerPanel,
  'mapping-panel': MappingPanelTab,
};

type DockviewComponentMap = Record<string, React.ComponentType<IDockviewPanelProps>>;

class ReactDockviewContent implements IContentRenderer {
  public readonly element = document.createElement('div');
  private readonly root: Root;

  constructor(
    private readonly componentName: string,
    private readonly componentMap: DockviewComponentMap,
  ) {
    this.element.style.height = '100%';
    this.element.style.width = '100%';
    this.root = createRoot(this.element);
  }

  public init(params: GroupPanelPartInitParameters) {
    const Component = this.componentMap[this.componentName];
    this.root.render(Component ? <Component {...params} /> : <div>Unknown panel: {this.componentName}</div>);
  }

  public dispose() {
    this.root.unmount();
  }
}

interface DockviewHostProps {
  components: DockviewComponentMap;
  className?: string;
  onReady: (event: DockviewReadyEvent) => void;
}

const DockviewHost: React.FC<DockviewHostProps> = ({ components, className, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const api = createDockview(containerRef.current, {
      createComponent: ({ name }) => new ReactDockviewContent(name, components),
    });

    onReady({ api });
    return () => api.dispose();
  }, []);

  return <div ref={containerRef} className={className} style={{ height: '100%', width: '100%' }} />;
};

export const MainLayout: React.FC = () => {
  const stream = useMediaStream();
  usePerformanceEvents(stream);
  const dockApi = useRef<DockviewApi | null>(null);
  
  const { dockPosition, hudVisible } = useUIStore();
  const { activePanelId, panels, setActivePanel, addPanel, setLibrary, updatePanelText, setCompiled } = useScoreStore();
  const { bpm } = useTransportStore();

  // Global access for services
  useEffect(() => {
    (window as any).__ENSI_MEDIA_STREAM__ = stream;
  }, [stream]);

  // Init MIDI
  useEffect(() => {
    MidiService.getInstance().init();
  }, []);

  // Reactive Compilation
  useEffect(() => {
    const activeText = panels[activePanelId]?.text || '';
    if (activeText) {
      const compiled = compileScoreText(activeText, bpm);
      setCompiled(compiled);
    }
  }, [activePanelId, panels[activePanelId]?.text, bpm, setCompiled]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/scores');
        const scores = await response.json();
        if (Array.isArray(scores)) {
          setLibrary(scores);
          if (scores.length > 0) {
            const first = await fetch(`/api/scores/${scores[0].id}`);
            const data = await first.json();
            if (data.text) {
              updatePanelText('score-ed', data.text);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch scores:', e);
      }
    };
    fetchInitialData();
  }, []);

  const onReady = (event: DockviewReadyEvent) => {
    dockApi.current = event.api;

    event.api.addPanel({
      id: 'score-ed',
      component: 'score-editor',
      title: 'SCORE',
    });

    event.api.addPanel({
      id: 'score-sv',
      component: 'score-visualizer',
      title: 'SV',
      position: { referencePanel: 'score-ed', direction: 'within' },
    });

    event.api.addPanel({
      id: 'mapping',
      component: 'mapping-panel',
      title: 'MAP',
      position: { referencePanel: 'score-ed', direction: 'within' },
    });

    event.api.onDidActivePanelChange((panel) => {
      if (panel) setActivePanel(panel.id);
    });

  };

  const addScoreTab = () => {
    if (!dockApi.current) return;
    const id = `score-tab-${Date.now()}`;
    addPanel(id, { sourceLabel: 'NEW' });
    dockApi.current.addPanel({
      id,
      component: 'score-editor',
      title: 'SCORE',
      position: { referencePanel: 'score-ed', direction: 'within' }
    });
  };

  return (
    <div className={`main-layout dock-${dockPosition}`} style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      background: '#000',
      overflow: 'hidden'
    }}>
      {hudVisible && (
        <header style={{ height: '40px', background: '#12171f', borderBottom: '1px solid #2a2f3a', display: 'flex', alignItems: 'center', padding: '0 15px', zIndex: 100 }}>
          <h2 style={{ margin: 0, fontSize: '12px', letterSpacing: '0.15em', color: '#8cf5a8' }}>ENSI STANDALONE</h2>
        </header>
      )}
      
      <main style={{ flex: 1, position: 'relative', display: hudVisible ? 'block' : 'none', zIndex: 10 }}>
        <DockviewHost
          onReady={onReady}
          components={components}
          className="dockview-theme-dark"
        />
        <button
          className="dv-add-tab-btn"
          onClick={addScoreTab}
          style={{
            position: 'absolute',
            left: 8,
            top: 8,
            zIndex: 120,
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(140, 245, 168, 0.12)',
            color: '#8cf5a8',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          +
        </button>
        <MixerHUD />
      </main>

      <PerformanceLayer stream={stream} />

      {hudVisible && <TransportBar />}

      {hudVisible && (
        <footer style={{ height: '24px', background: '#05070b', borderTop: '1px solid #2a2f3a', fontSize: '10px', display: 'flex', alignItems: 'center', padding: '0 10px', color: '#b9cadb', zIndex: 100 }}>
          Active: {activePanelId} | BPM: {bpm.toFixed(1)}
        </footer>
      )}
    </div>
  );
};
