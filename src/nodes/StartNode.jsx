import { Handle, Position } from 'reactflow';

export default function StartNode({ data }) {
  return (
    <div className={`group relative min-w-[140px] rounded-xl px-4 py-3 transition-all duration-300 transform 
                    ${data.isActive 
                      ? 'scale-105 shadow-[0_0_25px_rgba(45,212,191,0.6)] border-teal-400 bg-gray-800/90 backdrop-blur-xl -translate-y-1' 
                      : 'hover:scale-105 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(45,212,191,0.2)] shadow-lg border-white/10 bg-gray-900/60 backdrop-blur-md'
                    } border`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
        <div className="text-sm mb-1 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,1)]"></div>
          <span className="font-semibold text-teal-400 tracking-wider">START</span>
        </div>
        <div className="text-[11px] text-gray-300 mt-1 font-medium tracking-wide">
          {data?.label || 'Trigger: Manual'}
        </div>
      </div>
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!w-3 !h-3 !bg-teal-400 !border-2 !border-gray-900 !shadow-[0_0_10px_rgba(45,212,191,0.8)] transition-all group-hover:scale-125" 
      />
    </div>
  );
}