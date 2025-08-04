import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, MoreHorizontal } from 'lucide-react';
import { useTheme } from './DesignSystem.jsx';

export const DataTable = ({ 
  data = [],
  columns = [],
  sortable = true,
  searchable = false,
  filterable = false,
  pagination = false,
  pageSize = 10,
  className = ''
}) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { colors } = useTheme();
  
  const handleSort = (field) => {
    if (!sortable) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const filteredData = searchable && searchTerm
    ? data.filter(row => 
        columns.some(col => 
          String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;
  
  const sortedData = sortField
    ? [...filteredData].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        
        if (aVal < bVal) return -1 * modifier;
        if (aVal > bVal) return 1 * modifier;
        return 0;
      })
    : filteredData;
  
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;
  
  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {(searchable || filterable) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Søg..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 rounded-md py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
              />
            </div>
          )}
          {filterable && (
            <button className="inline-flex items-center px-4 py-2 bg-slate-700 rounded-md text-white text-sm hover:bg-slate-600 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          )}
        </div>
      )}
      
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider ${
                      sortable && column.sortable !== false ? 'cursor-pointer hover:bg-slate-600' : ''
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortable && column.sortable !== false && sortField === column.key && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="w-4 h-4" />
                          : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3 text-sm text-slate-300">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagination && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Viser {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, sortedData.length)} af {sortedData.length} resultater
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Forrige
              </button>
              <span className="text-sm text-slate-400">
                Side {currentPage} af {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                Næste
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const StatCard = ({ 
  title,
  value,
  icon: Icon,
  change,
  trend,
  className = ''
}) => {
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';
  
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-slate-400" />}
      </div>
      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
        {value}
      </div>
      {change && (
        <div className={`text-sm ${trendColor}`}>
          {change}
        </div>
      )}
    </div>
  );
};

export const ProgressBar = ({ 
  value,
  max = 100,
  label,
  showPercentage = true,
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const { colors } = useTheme();
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };
  
  const variants = {
    primary: colors.primary,
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };
  
  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-slate-300">{label}</span>}
          {showPercentage && <span className="text-sm text-slate-400">{percentage.toFixed(0)}%</span>}
        </div>
      )}
      <div className={`w-full bg-slate-700 rounded-full ${sizes[size]}`}>
        <div 
          className={`${variants[variant]} ${sizes[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const MetricCard = ({ 
  title,
  value,
  unit,
  description,
  icon: Icon,
  color = 'primary',
  className = ''
}) => {
  const { colors } = useTheme();
  
  const colorClasses = {
    primary: colors.primaryText,
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    info: 'text-blue-400'
  };
  
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wide">{title}</h3>
        {Icon && <Icon className={`w-6 h-6 ${colorClasses[color]}`} />}
      </div>
      <div className="flex items-baseline space-x-2 mb-2">
        <span className="text-3xl font-bold text-white">{value}</span>
        {unit && <span className="text-lg text-slate-400">{unit}</span>}
      </div>
      {description && (
        <p className="text-slate-400 text-sm">{description}</p>
      )}
    </div>
  );
};

export const KeyValueList = ({ 
  items = [],
  orientation = 'vertical',
  className = ''
}) => {
  const isHorizontal = orientation === 'horizontal';
  
  return (
    <div className={`${isHorizontal ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'space-y-3'} ${className}`}>
      {items.map((item, index) => (
        <div key={index} className={`${isHorizontal ? '' : 'flex justify-between items-center py-2 border-b border-slate-700 last:border-b-0'}`}>
          <span className="text-slate-400 text-sm font-medium">{item.key}</span>
          <span className="text-white text-sm">{item.value}</span>
        </div>
      ))}
    </div>
  );
};

export const DataList = ({ 
  items = [],
  renderItem,
  emptyState,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800 border border-slate-700 rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  if (items.length === 0) {
    return emptyState || (
      <div className="text-center py-8 text-slate-400">
        Ingen data tilgængelig
      </div>
    );
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem ? renderItem(item, index) : (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              {JSON.stringify(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const Pagination = ({ 
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  maxButtons = 5,
  className = ''
}) => {
  const getVisiblePages = () => {
    const delta = Math.floor(maxButtons / 2);
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, start + maxButtons - 1);
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };
  
  const visiblePages = getVisiblePages();
  
  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {showFirstLast && currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Første
        </button>
      )}
      
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Forrige
      </button>
      
      {visiblePages.map(page => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-2 text-sm rounded transition-colors ${
            page === currentPage
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Næste
      </button>
      
      {showFirstLast && currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          Sidste
        </button>
      )}
    </div>
  );
};

export default {
  DataTable,
  StatCard,
  ProgressBar,
  MetricCard,
  KeyValueList,
  DataList,
  Pagination
};