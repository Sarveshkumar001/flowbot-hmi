import { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';

import StartNode from './nodes/StartNode';
import MoveToNode from './nodes/MoveToNode';
import PickObjectNode from './nodes/PickObjectNode';
import DropObjectNode from './nodes/DropObjectNode';
import CheckSensorNode from './nodes/CheckSensorNode';
import EndNode from './nodes/EndNode';
import { runSimulation } from './simulate';

const nodeTypes = {
  startNode: StartNode,
  moveToNode: MoveToNode,
  pickObjectNode: PickObjectNode,
  dropObjectNode: DropObjectNode,
  checkSensorNode: CheckSensorNode,
  endNode: EndNode,
};

const sidebarNodes = [
  { type: 'startNode',       label: 'Start',       color: '#1D9E75' },
  { type: 'moveToNode',      label: 'Move To',      color: '#378ADD' },
  { type: 'pickObjectNode',  label: 'Pick Object',  color: '#7F77DD' },
  { type: 'dropObjectNode',  label: 'Drop Object',  color: '#D85A30' },
  { type: 'checkSensorNode', label: 'Check Sensor', color: '#BA7517' },
  { type: 'endNode',         label: 'End',          color: '#888780' },
];

const initialNodes = [
  { id: '1', type: 'startNode',       position: { x: 200, y: 40  }, data: { label: 'Trigger: Manual' } },
  { id: '2', type: 'moveToNode',      position: { x: 200, y: 140 }, data: { label: 'Waypoint A — Shelf 3' } },
  { id: '3', type: 'pickObjectNode',  position: { x: 200, y: 240 }, data: { label: 'Gripper A — 2.4 kg' } },
  { id: '4', type: 'checkSensorNode', position: { x: 200, y: 340 }, data: { label: 'Obstacle detected?' } },
  { id: '5', type: 'moveToNode',      position: { x: 200, y: 440 }, data: { label: 'Waypoint B — Drop Zone' } },
  { id: '6', type: 'dropObjectNode',  position: { x: 200, y: 540 }, data: { label: 'Release gripper' } },
  { id: '7', type: 'endNode',         position: { x: 200, y: 640 }, data: { label: 'Workflow complete' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
  { id: 'e4-5', source: '4', target: '5' },
  { id: 'e5-6', source: '5', target: '6' },
  { id: 'e6-7', source: '6', target: '7' },
];

let idCounter = 10;

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [log, setLog] = useState([]);
  const [status, setStatus] = useState('Idle');
  const [running, setRunning] = useState(false);
  const simRef = useRef(null);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow-type');
    const label = e.dataTransfer.getData('application/reactflow-label');
    if (!type || !reactFlowInstance) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode = { id: String(idCounter++), type, position, data: { label } };
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const exportToROS2 = () => {
    const workflow = {
      name: "Warehouse Pick & Place Workflow",
      generated_by: "FlowBot HMI",
      ros2_package: "robot_workflows",
      nodes: nodes.map(n => ({
        id: n.id,
        type: n.type,
        label: n.data.label,
        position: n.position
      })),
      edges: edges.map(e => ({
        from: e.source,
        to: e.target
      }))
    };
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ros2_workflow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const simulate = () => {
    if (running) return;
    setLog([]);
    setActiveNodeId(null);
    setStatus('Running');
    setRunning(true);

    const logMessages = {
      startNode:       '▶ Workflow started',
      moveToNode:      '→ Robot navigating to waypoint...',
      pickObjectNode:  '✓ Object picked up',
      checkSensorNode: '👁 Sensor check — path clear',
      dropObjectNode:  '✓ Object released',
      endNode:         '🏁 Workflow complete!',
    };

    simRef.current = runSimulation(
      nodes,
      edges,
      (node) => {
        setActiveNodeId(node.id);
        setStatus(node.type.replace('Node', ''));
        addLog(logMessages[node.type] || `Running ${node.type}`);
      },
      () => {
        setActiveNodeId(null);
        setStatus('Complete ✓');
        setRunning(false);
      }
    );
  };

  const reset = () => {
    clearInterval(simRef.current);
    setActiveNodeId(null);
    setLog([]);
    setStatus('Idle');
    setRunning(false);
  };

  const highlightedNodes = nodes.map(n => ({
    ...n,
    style: n.id === activeNodeId
      ? { boxShadow: '0 0 0 3px #EF9F27', borderColor: '#EF9F27' }
      : {}
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '170px', background: '#f5f5f3', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', padding: '12px 0' }}>
        <div style={{ padding: '0 12px 12px', borderBottom: '1px solid #ddd', marginBottom: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1D9E75' }}>⚙ FlowBot HMI</div>
          <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>Visual Robot Programming</div>
        </div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', padding: '0 12px 8px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Node Library
        </div>
        {sidebarNodes.map(n => (
          <div
            key={n.type}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/reactflow-type', n.type);
              e.dataTransfer.setData('application/reactflow-label', n.label);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'grab', borderRadius: '6px', margin: '2px 8px' }}
            onMouseEnter={e => e.currentTarget.style.background = '#ebebea'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: n.color, display: 'inline-block', flexShrink: 0 }}></span>
            {n.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: '10px', color: '#aaa', padding: '10px 12px', borderTop: '1px solid #ddd' }}>
          Drag nodes onto canvas
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', borderBottom: '1px solid #ddd', background: '#fff' }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: '14px', color: '#222' }}>
            🏭 FlowBot HMI — Visual Robot Programming Platform
          </span>
          <button
            onClick={exportToROS2}
            style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #378ADD', background: '#E6F1FB', color: '#185FA5', fontWeight: 500, cursor: 'pointer' }}
          >
            ⬇ Export to ROS 2
          </button>
          <button
            onClick={reset}
            style={{ fontSize: '12px', padding: '5px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
          >
            Reset
          </button>
          <button
            onClick={simulate}
            disabled={running}
            style={{ fontSize: '12px', padding: '5px 14px', borderRadius: '6px', border: 'none', background: running ? '#aaa' : '#1D9E75', color: '#fff', fontWeight: 500, cursor: running ? 'not-allowed' : 'pointer' }}
          >
            {running ? '⏳ Running...' : '▶ Simulate'}
          </button>
        </div>
        <div ref={reactFlowWrapper} style={{ flex: 1 }}>
          <ReactFlow
            nodes={highlightedNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <Background gap={22} size={1} />
          </ReactFlow>
        </div>
      </div>

      {/* Status Panel */}
      <div style={{ width: '200px', background: '#f5f5f3', borderLeft: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', padding: '10px 12px 6px', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #ddd' }}>
          Robot Status
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>State</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: status === 'Complete ✓' ? '#1D9E75' : status === 'Running' ? '#BA7517' : '#222' }}>
            {status}
          </div>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Active node</div>
          <div style={{ fontSize: '12px', fontWeight: 500 }}>
            {activeNodeId ? nodes.find(n => n.id === activeNodeId)?.data?.label || '—' : '—'}
          </div>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Battery</div>
          <div style={{ background: '#eee', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
            <div style={{ width: '87%', height: '100%', background: '#1D9E75', borderRadius: '4px' }}></div>
          </div>
          <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>87%</div>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Speed</div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: running ? '#BA7517' : '#888' }}>
            {running ? '0.8 m/s' : '0.0 m/s'}
          </div>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #ddd' }}>
          <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>Total nodes</div>
          <div style={{ fontSize: '12px', fontWeight: 500 }}>{nodes.length}</div>
        </div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', padding: '10px 12px 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Execution Log
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 12px' }}>
          {log.length === 0 && (
            <div style={{ fontSize: '11px', color: '#bbb' }}>No logs yet...</div>
          )}
          {log.map((entry, i) => (
            <div key={i} style={{ fontSize: '11px', color: '#555', padding: '3px 0', borderBottom: '1px solid #eee', lineHeight: 1.5 }}>
              {entry}
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 12px', borderTop: '1px solid #ddd', fontSize: '10px', color: '#aaa', textAlign: 'center' }}>
          Powered by ROS 2
        </div>
      </div>

    </div>
  );
}