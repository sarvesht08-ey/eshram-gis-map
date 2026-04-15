import React, { useCallback } from 'react';
import { Upload, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const FileUpload = ({ onDataLoaded }) => {
  const handleFileUpload = useCallback(async (e) => {
    e.preventDefault();

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/coverage-data`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed (${response.status}): ${text}`);
      }

      const payload = await response.json();
      if (payload.success) {
        onDataLoaded(payload.data);
      } else {
        throw new Error(payload.status || 'API response indicated failure');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert('Error fetching coverage data: ' + (error.message || error));
    }
  }, [onDataLoaded]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative group cursor-pointer w-full"
    >
      <div className="relative bg-white border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all duration-300">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Upload className="w-8 h-8 text-blue-600" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-800 mb-2">Upload Coverage Data</h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
          Select an Excel file (.xlsx, .xls) containing the worker coverage dataset.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-slate-600 border border-gray-200">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel Format</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full text-xs font-medium text-green-700 border border-green-100">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Auto-validation</span>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent file dialog from opening
            import('../utils/sampleData').then(module => {
              onDataLoaded(module.SAMPLE_DATA);
            });
          }}
          className="mt-6 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium z-20 relative"
        >
          Use Sample Data
        </button>
      </div>
    </motion.div>
  );
};

export default FileUpload;
