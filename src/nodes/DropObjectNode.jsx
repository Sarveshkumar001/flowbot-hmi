import { Handle, Position } from 'reactflow';
export default function DropObjectNode({ data }) {
  return (
    <div style={{ background: '#FAECE7', border: '1.5px solid #D85A30', borderRadius: '10px', padding: '10px 14px', minWidth: '130px', fontFamily: 'sans-serif' }}>
      <div style={{ fontSize: '13px', marginBottom: '4px' }}>📤</div>
      <div style={{ fontWeight: 500, fontSize: '13px', color: '#4A1B0C' }}>Drop Object</div>
      <div style={{ fontSize: '11px', color: '#993C1D', marginTop: '2px' }}>{data?.label || 'Release gripper'}</div>
      <Handle type="target" position={Position.Top} style={{ background: '#D85A30', width: '10px', height: '10px', border: '2px solid #fff' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#D85A30', width: '10px', height: '10px', border: '2px solid #fff' }} />
    </div>
  );
}