import { Handle, Position } from 'reactflow';
export default function PickObjectNode({ data }) {
  return (
    <div style={{ background: '#EEEDFE', border: '1.5px solid #7F77DD', borderRadius: '10px', padding: '10px 14px', minWidth: '130px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>📦</div>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#26215C' }}>Pick Object</div>
      <div style={{ fontSize: '11px', color: '#534AB7', marginTop: '2px' }}>{data?.label || 'Gripper A'}</div>
      <Handle type="target" position={Position.Top} style={{ background: '#7F77DD', width: '10px', height: '10px', border: '2px solid #fff' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#7F77DD', width: '10px', height: '10px', border: '2px solid #fff' }} />
    </div>
  );
}