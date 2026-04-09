import { Handle, Position } from 'reactflow';
export default function CheckSensorNode({ data }) {
  return (
    <div style={{ background: '#FAEEDA', border: '1.5px solid #BA7517', borderRadius: '10px', padding: '10px 14px', minWidth: '130px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>👁</div>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#412402' }}>Check Sensor</div>
      <div style={{ fontSize: '11px', color: '#854F0B', marginTop: '2px' }}>{data?.label || 'Obstacle detected?'}</div>
      <Handle type="target" position={Position.Top} style={{ background: '#BA7517', width: '10px', height: '10px', border: '2px solid #fff' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#BA7517', width: '10px', height: '10px', border: '2px solid #fff' }} />
    </div>
  );
}