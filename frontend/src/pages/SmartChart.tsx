import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, RotateCcw } from 'lucide-react';

interface SmartChartProps {
  data: any[];
  question?: string;
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

const SmartChart: React.FC<SmartChartProps> = ({ data, question = '', className = '' }) => {
  if (!data || data.length === 0) return null;

  const headers = Object.keys(data[0]);

  const numericColumns = headers.filter(h =>
    data.some(row => !isNaN(parseFloat(row[h])) && row[h] !== null)
  );

  const categoricalColumns = headers.filter(h =>
    data.some(row => typeof row[h] === 'string' || isNaN(parseFloat(row[h])))
  );

  // Selections
  const [xAxis, setXAxis] = useState<string | null>(null);
  const [yAxis, setYAxis] = useState<string | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | null>(null);

  const chartData = useMemo(() => {
    if (!xAxis || !yAxis) return [];
    return data.map((row, idx) => ({
      x: String(row[xAxis] ?? `Item ${idx + 1}`),
      y: parseFloat(row[yAxis]) || 0,
    }));
  }, [data, xAxis, yAxis]);

  const resetSelections = () => {
    setXAxis(null);
    setYAxis(null);
    setChartType(null);
  };

  const renderChart = () => {
    if (!chartType || !xAxis || !yAxis) return null;

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chartData} dataKey="y" nameKey="x" cx="50%" cy="50%" outerRadius={90} label>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="y" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`mt-4 p-4 border rounded-lg bg-white shadow-sm ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-600">X Axis:</label>
          <select value={xAxis ?? ''} onChange={(e) => setXAxis(e.target.value)} className="ml-2 border p-1 rounded">
            <option value="">X axis</option>
            {categoricalColumns.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Y Axis:</label>
          <select value={yAxis ?? ''} onChange={(e) => setYAxis(e.target.value)} className="ml-2 border p-1 rounded">
            <option value="">Y axis</option>
            {numericColumns.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant={chartType === 'bar' ? "default" : "outline"} onClick={() => setChartType('bar')}>
            <BarChart3 className="h-4 w-4" /> Bar
          </Button>
          <Button size="sm" variant={chartType === 'line' ? "default" : "outline"} onClick={() => setChartType('line')}>
            <TrendingUp className="h-4 w-4" /> Line
          </Button>
          <Button size="sm" variant={chartType === 'pie' ? "default" : "outline"} onClick={() => setChartType('pie')}>
            <PieChartIcon className="h-4 w-4" /> Pie
          </Button>
          <Button size="sm" variant="outline" onClick={resetSelections}>
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* Chart only if everything selected */}
      {xAxis && yAxis && chartType && renderChart()}
    </div>
  );
};

export default SmartChart;