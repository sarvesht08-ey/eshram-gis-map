import { ChevronDown, Users } from 'lucide-react';

const FilterControls = ({ filters, setFilters, availableStates, activeDistricts }) => {
  const handleChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-5">
      <div className="relative">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">State</label>
        <div className="relative">
          <select 
            value={filters.state} 
            onChange={(e) => handleChange('state', e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 text-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4826a8]/20 focus:border-[#4826a8] transition-all font-medium"
          >
            <option value="All">All States</option>
            {availableStates && availableStates.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="relative">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">District</label>
        <div className="relative">
          <select 
            value={filters.district} 
            onChange={(e) => handleChange('district', e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 text-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4826a8]/20 focus:border-[#4826a8] transition-all font-medium"
            disabled={!activeDistricts || activeDistricts.length === 0}
          >
            <option value="All">All Districts</option>
            {activeDistricts && activeDistricts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
