import { Handle, Position } from 'reactflow';
export default function EndNode({ data }) {
  return (
    <div style={{ background: '#F1EFE8', border: '1.5px solid #888780', borderRadius: '10px', padding: '10px 14px', minWidth: '130px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>🏁</div>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#2C2C2A' }}>End</div>
      <div style={{ fontSize: '11px', color: '#5F5E5A', marginTop: '2px' }}>{data?.label || 'Workflow complete'}</div>
      <Handle type="target" position={Position.Top} style={{ background: '#888780', width: '10px', height: '10px', border: '2px solid #fff' }} />
    </div>
  );
}