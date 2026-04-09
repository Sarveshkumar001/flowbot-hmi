import { Handle, Position } from 'reactflow';
export default function MoveToNode({ data }) {
  return (
    <div style={{ background: '#E6F1FB', border: '1.5px solid #378ADD', borderRadius: '10px', padding: '10px 14px', minWidth: '130px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>🤖</div>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#042C53' }}>Move To</div>
      <div style={{ fontSize: '11px', color: '#185FA5', marginTop: '2px' }}>{data?.label || 'Set waypoint'}</div>
      <Handle type="target" position={Position.Top} style={{ background: '#378ADD', width: '10px', height: '10px', border: '2px solid #fff' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#378ADD', width: '10px', height: '10px', border: '2px solid #fff' }} />
    </div>
  );
}