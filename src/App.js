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
  { type: 'moveToNode',      label: 'Move To',     color: '#378ADD' },
  { type: 'pickObjectNode',  label: 'Pick Object', color: '#7F77DD' },
  { type: 'dropObjectNode',  label: 'Drop Object', color: '#D85A30' },
  { type: 'checkSensorNode', label: 'Check Sensor',color: '#BA7517' },
  { type: 'endNode',         label: 'End',         color: '#888780' },
];

const initialNodes = [
  { id: '1', type: 'startNode',       position: { x: 400, y: 40  }, data: { label: 'Trigger: Manual' } },
  { id: '2', type: 'moveToNode',      position: { x: 400, y: 140 }, data: { label: 'Waypoint A — Shelf 3' } },
  { id: '3', type: 'pickObjectNode',  position: { x: 400, y: 240 }, data: { label: 'Gripper A — 2.4 kg' } },
  { id: '4', type: 'checkSensorNode', position: { x: 400, y: 340 }, data: { label: 'Obstacle detected?' } },
  { id: '5', type: 'moveToNode',      position: { x: 400, y: 440 }, data: { label: 'Waypoint B — Drop Zone' } },
  { id: '6', type: 'dropObjectNode',  position: { x: 400, y: 540 }, data: { label: 'Release gripper' } },
  { id: '7', type: 'endNode',         position: { x: 400, y: 640 }, data: { label: 'Workflow complete' } },
];

const defaultEdgeOptions = {
  className: 'edge-energy-pulse',
  animated: true,
  type: 'smoothstep'
};

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', ...defaultEdgeOptions },
  { id: 'e2-3', source: '2', target: '3', ...defaultEdgeOptions },
  { id: 'e3-4', source: '3', target: '4', ...defaultEdgeOptions },
  { id: 'e4-5', source: '4', target: '5', ...defaultEdgeOptions },
  { id: 'e5-6', source: '5', target: '6', ...defaultEdgeOptions },
  { id: 'e6-7', source: '6', target: '7', ...defaultEdgeOptions },
];

let idCounter = 10;

const SYSTEM_PROMPT = `You are an AI assistant for FlowBot HMI, a visual robot programming platform.
When the user describes a robot workflow in plain English, you must respond ONLY with a valid JSON object in this exact format:
{
  "message": "A short friendly confirmation message",
  "nodes": [
    { "id": "1", "type": "startNode", "label": "Trigger: Manual", "x": 400, "y": 40 },
    { "id": "2", "type": "moveToNode", "label": "Waypoint description", "x": 400, "y": 140 }
  ],
  "edges": [
    { "from": "1", "to": "2" }
  ]
}
Available node types: startNode, moveToNode, pickObjectNode, dropObjectNode, checkSensorNode, endNode.
Every workflow MUST start with a startNode and end with an endNode.
Space nodes 100px apart vertically starting at y:40. Always set x to 400.
Respond ONLY with the JSON object, no extra text.`;

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

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hi! Describe a robot workflow in plain English and I will generate it for you.\n\nExample: "Pick a box from shelf 3 and drop it at station B"' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, ...defaultEdgeOptions }, eds)),
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

  const sendMessage = async () => {
    if (!chatInput.trim() || aiLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setAiLoading(true);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMsg }]
        })
      });

      const data = await response.json();
      const raw = data.content?.[0]?.text || '';

      let parsed;
      try {
        const clean = raw.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
      } catch {
        setChatMessages(prev => [...prev, {
          role: 'assistant',
          text: "Sorry, I couldn't understand that. Try something like: 'Pick a box from shelf 2 and place it at drop zone A'"
        }]);
        setAiLoading(false);
        return;
      }

      const newNodes = parsed.nodes.map(n => ({
        id: String(idCounter++),
        type: n.type,
        position: { x: n.x || 400, y: n.y || 40 },
        data: { label: n.label }
      }));

      const idMap = {};
      parsed.nodes.forEach((n, i) => { idMap[n.id] = newNodes[i].id; });

      const newEdges = parsed.edges.map((e, i) => ({
        id: `ae-${idCounter++}-${i}`,
        source: idMap[e.from],
        target: idMap[e.to],
        ...defaultEdgeOptions
      }));

      setNodes(newNodes);
      setEdges(newEdges);
      setLog([]);
      setStatus('Idle');
      setChatMessages(prev => [...prev, { role: 'assistant', text: parsed.message || '✅ Workflow generated!' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: '⚠ Connection error.' }]);
    }

    setAiLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const highlightedNodes = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      isActive: n.id === activeNodeId
    }
  }));

  return (
    <div className="flex h-screen w-screen bg-3d-grid font-sans text-white overflow-hidden relative">
      
      {/* Top Navigation Bar - Floating Header */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <span className="font-semibold text-sm tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
          FACTORY-NET // FLOWBOT HMI
        </span>
        <div className="w-px h-4 bg-white/20 mx-2"></div>
        <button
          onClick={exportToROS2}
          className="text-xs px-4 py-1.5 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all"
        >
          EXPORT TO ROS2
        </button>
        <button
          onClick={reset}
          className="text-xs px-4 py-1.5 rounded-full border border-gray-500/50 bg-gray-500/10 hover:bg-gray-500/30 transition-all text-gray-300"
        >
          RESET
        </button>
        <button
          onClick={simulate}
          disabled={running}
          className={`text-xs px-5 py-1.5 rounded-full border font-medium tracking-wider transition-all shadow-[0_0_15px_rgba(29,158,117,0.4)] ${running ? 'border-gray-500 bg-gray-600/50 text-gray-400 cursor-not-allowed' : 'border-teal-400 bg-teal-500/20 text-teal-300 hover:bg-teal-500/40 hover:shadow-[0_0_25px_rgba(29,158,117,0.6)]'}`}
        >
          {running ? 'SIMULATING...' : 'SIMULATE'}
        </button>
      </div>

      {/* Main Canvas Area */}
      <div ref={reactFlowWrapper} className="w-full h-full">
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
          className="bg-transparent"
        >
          <Controls className="!bg-gray-800/80 !border-white/10 !backdrop-blur-md fill-white" />
        </ReactFlow>
      </div>

      {/* Node Library Floating Panel */}
      <div className="absolute top-24 left-6 z-40 w-52 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Node Library</div>
        </div>
        <div className="p-3 space-y-2">
          {sidebarNodes.map(n => (
            <div
              key={n.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow-type', n.type);
                e.dataTransfer.setData('application/reactflow-label', n.label);
              }}
              className="flex items-center gap-3 px-3 py-2 text-xs cursor-grab rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all outline-none"
            >
              <div 
                className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" 
                style={{ backgroundColor: n.color, color: n.color }}
              ></div>
              <span className="text-gray-200 font-medium">{n.label}</span>
            </div>
          ))}
        </div>
        <div className="p-3 text-[10px] text-gray-500 border-t border-white/10 text-center uppercase tracking-wider">
          Drag to add nodes
        </div>
      </div>

      {/* Status Panel Floating Panel */}
      <div className="absolute top-24 right-6 z-40 w-64 bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col h-[calc(100vh-160px)]">
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">System Status</div>
        </div>
        
        <div className="p-4 border-b border-white/10 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">State</div>
            <div className={`text-sm font-semibold tracking-wide ${status === 'Complete ✓' ? 'text-teal-400' : status === 'Running' ? 'text-orange-400' : 'text-gray-200'}`}>
              {status}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Speed</div>
            <div className={`text-sm font-semibold tracking-wide ${running ? 'text-orange-400' : 'text-gray-500'}`}>
              {running ? '0.8 m/s' : '0.0 m/s'}
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Active Routine</div>
          <div className="text-xs text-gray-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            {activeNodeId ? nodes.find(n => n.id === activeNodeId)?.data?.label || '—' : '—'}
          </div>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex justify-between items-end mb-2">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Core Power</div>
            <div className="text-[10px] text-teal-400 font-bold">87%</div>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="w-[87%] h-full bg-teal-400 shadow-[0_0_10px_rgba(29,158,117,1)]"></div>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-white/10 bg-white/5 mt-auto">
          <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Telemetry Log</div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {log.length === 0 && (
            <div className="text-xs text-gray-600 italic">Listening for telemetry...</div>
          )}
          {log.map((entry, i) => (
            <div key={i} className="text-[11px] text-gray-300 font-mono tracking-tight leading-relaxed">
              <span className="text-blue-400 opacity-70 mr-2">[{String(i).padStart(3, '0')}]</span>
              {entry}
            </div>
          ))}
        </div>
      </div>

      {/* Floating AI Chat Button */}
      <button
        onClick={() => setChatOpen(o => !o)}
        className="absolute bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(79,70,229,0.5)] z-50 transition-all hover:scale-105 border border-indigo-400/50"
        title="AI Workflow Generator"
      >
        {chatOpen ? '✕' : '✨'}
      </button>

      {/* AI Chat Panel */}
      {chatOpen && (
        <div className="absolute bottom-24 right-6 w-80 h-[460px] bg-gray-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.6)] flex flex-col z-50 overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600/30 border-b border-indigo-500/30 flex flex-col">
            <span className="text-sm font-semibold text-white tracking-wide text-shadow">✨ AI Co-Pilot</span>
            <span className="text-[10px] text-indigo-200">Natural language workflow generator</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed rounded-xl shadow-lg border ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600/80 text-white rounded-br-sm border-indigo-500/50' 
                    : 'bg-gray-800/80 text-gray-200 rounded-bl-sm border-gray-600/50'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 text-xs rounded-xl bg-gray-800/80 text-indigo-300 rounded-bl-sm border border-gray-600/50 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="e.g. Deploy to sector 7..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-400 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={aiLoading}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                aiLoading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(79,70,229,0.4)]'
              }`}
            >
              SEND
            </button>
          </div>
        </div>
      )}

    </div>
  );
}