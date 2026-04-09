import { Handle, Position } from 'reactflow';
export default function StartNode({ data }) {
  return (
    <div style={{ background: '#E1F5EE', border: '1.5px solid #1D9E75', borderRadius: '10px', padding: '10px 14px', minWidth: '130px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>🟢</div>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#085041' }}>Start</div>
      <div style={{ fontSize: '11px', color: '#0F6E56', marginTop: '2px' }}>{data?.label || 'Trigger: Manual'}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#1D9E75', width: '10px', height: '10px', border: '2px solid #fff' }} />
    </div>
  );
}