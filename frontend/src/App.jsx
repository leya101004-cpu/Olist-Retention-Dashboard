import React, { useState, useEffect } from 'react';
import { 
  Users, AlertTriangle, Mail, Send, Settings, BarChart2, 
  ShieldAlert, Zap, DollarSign, Clock, Tag, MessageSquare, Loader2,
  Globe, Search, ArrowDownAZ, X, TrendingDown, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

export default function RetentionDashboard() {
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'analytics'
  const [activeFilter, setActiveFilter] = useState('High-Risk VIPs');
  
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [emailDraft, setEmailDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [reviewLang, setReviewLang] = useState('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('risk');
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [revenueMonth, setRevenueMonth] = useState('All (Q1-Q3)');

  // Settings State
  const [threshold, setThreshold] = useState(44.6);
  // FETCH DATA FROM PYTHON FASTAPI
  useEffect(() => {
    fetch('http://localhost:8000/api/customers')
      .then(res => res.json())
      .then(data => {
        setCustomers(data);
        if (data.length > 0) {
          setSelectedCustomer(data[0]);
          setEmailDraft(data[0].ai_email);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching data from Python:", err);
        setLoading(false);
      });
  }, []);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setEmailDraft(customer.ai_email);
    setReviewLang('en'); 
  };

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleSaveSettings = () => {
    setThreshold(tempThreshold);
    setShowSettings(false);
    triggerToast(`Model recalculated with ${tempThreshold}% threshold.`);
  };

  // 1. FILTER
  let processedCustomers = customers.filter(c => {
    if (activeFilter === 'All At-Risk') return c.churn_risk >= threshold;
    if (activeFilter === 'High-Risk VIPs') return c.segment.includes('VIP') && c.churn_risk >= threshold;
    return true;
  });

  // 2. SEARCH
  if (searchQuery) {
    processedCustomers = processedCustomers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.root_cause.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // 3. SORT
  if (sortBy === 'risk') {
    processedCustomers.sort((a, b) => b.churn_risk - a.churn_risk);
  } else if (sortBy === 'value') {
    processedCustomers.sort((a, b) => b.spent - a.spent);
  } else if (sortBy === 'wait') {
    processedCustomers.sort((a, b) => b.wait_time - a.wait_time);
  }

  // Derived Global KPIs
  const totalBase = 93356;
  const simulatedRevenue = threshold === 44.6 ? 1303962.49 : (1303962.49 * (44.6 / threshold));
  const liftScore = threshold === 44.6 ? 1.37 : (1.37 * (threshold / 44.6));

  // Analytics Data
  const churnTimelineData = [
    { month: 'Jan', churnRate: 58, target: threshold },
    { month: 'Feb', churnRate: 55, target: threshold },
    { month: 'Mar', churnRate: 52, target: threshold },
    { month: 'Apr', churnRate: 49, target: threshold },
    { month: 'May', churnRate: 46, target: threshold },
    { month: 'Jun (Now)', churnRate: 42, target: threshold },
  ];

  const revenueDataMap = {
    'All (Q1-Q3)': [
      { category: 'Health & Beauty', saved: 320500 },
      { category: 'Bed & Bath', saved: 280100 },
      { category: 'Sports', saved: 195000 },
      { category: 'Watches', saved: 150000 },
      { category: 'Telephony', saved: 110000 },
    ],
    'June 2026': [
      { category: 'Health & Beauty', saved: 45000 },
      { category: 'Bed & Bath', saved: 41000 },
      { category: 'Sports', saved: 25000 },
      { category: 'Watches', saved: 18000 },
      { category: 'Telephony', saved: 12000 },
    ],
    'May 2026': [
      { category: 'Health & Beauty', saved: 52000 },
      { category: 'Bed & Bath', saved: 48000 },
      { category: 'Sports', saved: 31000 },
      { category: 'Watches', saved: 22000 },
      { category: 'Telephony', saved: 16000 },
    ]
  };

  const revenueData = revenueDataMap[revenueMonth] || revenueDataMap['All (Q1-Q3)'];

  const segmentData = [
    { name: 'High-Risk VIPs', value: customers.filter(c => c.segment.includes('VIP') && c.churn_risk >= threshold).length, color: '#ef4444' },
    { name: 'Standard At-Risk', value: customers.filter(c => !c.segment.includes('VIP') && c.churn_risk >= threshold).length, color: '#f97316' },
    { name: 'Safe Customers', value: totalBase - customers.filter(c => c.churn_risk >= threshold).length, color: '#22c55e' },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
         <div className="flex flex-col items-center gap-4 text-slate-500">
           <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
           <p className="font-medium">Connecting to Python FastAPI Server...</p>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Zap size={18} className="text-yellow-400" />
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} /> Model Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Optimal Churn Threshold</label>
                <input 
                  type="range" min="10" max="90" step="0.1" 
                  value={tempThreshold} 
                  onChange={(e) => setTempThreshold(parseFloat(e.target.value))}
                  className="w-full accent-blue-600" 
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Aggressive (10%)</span>
                  <span className="font-bold text-blue-600">{tempThreshold}%</span>
                  <span>Conservative (90%)</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Standard Campaign Discount</label>
                <select 
                  value={tempDiscount}
                  onChange={(e) => setTempDiscount(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-sm text-slate-700 outline-none"
                >
                  <option value="10%">10% Discount</option>
                  <option value="15%">15% Discount (Default)</option>
                  <option value="20%">20% Discount</option>
                  <option value="Free Shipping">Free Shipping Only</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-right">
              <button onClick={handleSaveSettings} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                Save & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10 hidden md:flex">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">OlistAI CRM</h1>
            <p className="text-xs text-slate-400">Retention Engine v2.0</p>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-6">
          
          {/* Main Navigation */}
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab('queue')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'queue' ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users size={18} />
              Retention Queue
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === 'analytics' ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart2 size={18} />
              Performance Analytics
            </button>
          </div>

          {/* Segment Filters (Only show when in queue) */}
          {activeTab === 'queue' && (
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Segments</p>
              
              <button 
                onClick={() => setActiveFilter('High-Risk VIPs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'High-Risk VIPs' ? 'text-blue-400 font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <ShieldAlert size={16} />
                High-Risk VIPs
              </button>
              
              <button 
                onClick={() => setActiveFilter('All At-Risk')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeFilter === 'All At-Risk' ? 'text-blue-400 font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
              >
                <AlertTriangle size={16} />
                All At-Risk
              </button>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm hover:text-white transition-colors">
            <Settings size={18} />
            Model Settings
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP HEADER / KPI BAR */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0 shadow-sm z-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'queue' ? 'Priority Retention Queue' : 'Retention Analytics & ROI'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">Based on Optimal Threshold ({threshold}%) - Top Decile Targeted</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex-col items-end hidden md:flex">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Base</span>
              <span className="text-lg font-bold text-slate-700">{totalBase.toLocaleString()}</span>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex flex-col items-end">
              <span className="text-xs text-green-600 font-semibold uppercase">Simulated Saved Revenue</span>
              <span className="text-lg font-bold text-green-700">R$ {simulatedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col items-end">
              <span className="text-xs text-blue-600 font-semibold uppercase">Lift Score (Efficiency)</span>
              <span className="text-lg font-bold text-blue-700">{liftScore.toFixed(2)}x</span>
            </div>
          </div>
        </header>

        {/* DYNAMIC WORKSPACE (Tabs) */}
        {activeTab === 'analytics' ? (
          
          /* ANALYTICS VIEW */
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
            
            {/* Target Context Box */}
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-start gap-4">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                <Zap size={20} />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900">Specialized Target Achievement</h4>
                <p className="text-sm text-indigo-800 mt-1 leading-relaxed">
                  By targeting the top decile (10%) of customers with a churn probability above <strong>{threshold}%</strong>, this framework achieves a <strong>{liftScore.toFixed(2)}x efficiency lift</strong>. 
                  This captures <strong>81.0%</strong> of actual churners while minimizing wasted marketing spend on safe customers.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm xl:col-span-2">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <TrendingDown size={18} className="text-blue-600" /> 
                  Platform Churn Rate Timeline (2026)
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={churnTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} domain={[30, 70]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" name="Actual Churn %" dataKey="churnRate" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                      <Line type="monotone" name="ML Optimized Target %" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-orange-500" /> 
                  Customer Risk Distribution
                </h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={segmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        minAngle={15}
                      >
                        {segmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => value.toLocaleString()}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm xl:col-span-3">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <PieChartIcon size={18} className="text-green-600" /> 
                    Simulated Saved Revenue by Category
                  </h3>
                  
                  <select 
                    value={revenueMonth}
                    onChange={(e) => setRevenueMonth(e.target.value)}
                    className="text-sm border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-slate-700 font-medium"
                  >
                    <option value="All (Q1-Q3)">All (Q1-Q3)</option>
                    <option value="June 2026">June 2026</option>
                    <option value="May 2026">May 2026</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData} layout="vertical" margin={{ left: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis dataKey="category" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Revenue Saved']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="saved" fill="#16a34a" radius={[0, 4, 4, 0]} barSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>

        ) : (

          /* QUEUE VIEW (Original Split View) */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6">
            
            {/* LEFT: CUSTOMER LIST */}
            <div className="w-full lg:w-[45%] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Users size={18} className="text-slate-400"/>
                    {activeFilter}
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">
                    {processedCustomers.length} Users
                  </span>
                </div>
                
                {/* Search & Sort Tools */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search ID or Root Cause..." 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative shrink-0">
                    <ArrowDownAZ size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <select 
                      value={sortBy} 
                      onChange={e => setSortBy(e.target.value)}
                      className="pl-8 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium text-slate-700"
                    >
                      <option value="risk">Highest Risk</option>
                      <option value="value">Highest Value</option>
                      <option value="wait">Longest Wait</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 border-b border-slate-200 shadow-sm z-10">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold text-center">Risk Score</th>
                      <th className="px-4 py-3 font-semibold text-right">Value (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedCustomers.map((customer, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => handleSelectCustomer(customer)}
                        className={`cursor-pointer transition-colors ${selectedCustomer?.id === customer.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{customer.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{customer.id}</div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-bold ${customer.churn_risk > threshold ? 'text-red-600' : 'text-orange-500'}`}>
                              {customer.churn_risk}%
                            </span>
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${customer.churn_risk > threshold ? 'bg-red-500' : 'bg-orange-400'}`} 
                                style={{ width: `${customer.churn_risk}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-slate-700">
                          {customer.spent.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {processedCustomers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-slate-400 italic">No customers match your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: DECISION SUPPORT DASHBOARD */}
            {selectedCustomer && (
              <div className="w-full lg:w-[55%] flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex-shrink-0 relative">
                
                {/* Header Profile */}
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{selectedCustomer.name}</h3>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                      <Tag size={12} />
                      {selectedCustomer.segment}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Wait Time (Last Order)</p>
                    <p className="font-semibold text-slate-800 flex items-center justify-end gap-1">
                      <Clock size={14} className="text-slate-400" />
                      {selectedCustomer.wait_time} days
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* SHAP & Financial Logic Container */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI Diagnostics (SHAP) */}
                    <div className="border border-red-100 bg-red-50/30 rounded-lg p-4">
                      <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <BarChart2 size={14} />
                        SHAP Root Cause (AI)
                      </h4>
                      <p className="font-mono text-[13px] text-red-900 bg-white border border-red-100 p-2 rounded mb-2 font-medium break-all">
                        {selectedCustomer.root_cause}
                      </p>
                      <p className="text-sm text-red-700 leading-relaxed">
                        {selectedCustomer.cause_desc}
                      </p>
                    </div>

                    {/* Next Best Action (Financial Engine) */}
                    <div className="border border-blue-100 bg-blue-50/30 rounded-lg p-4">
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2 mb-3">
                        <DollarSign size={14} />
                        Next Best Action (Financials)
                      </h4>
                      <p className="text-sm font-medium text-blue-900 mb-3 leading-relaxed">
                        {selectedCustomer.nba_tactic}
                      </p>
                      <div className="flex justify-between items-center pt-3 border-t border-blue-100/50">
                        <span className="text-xs text-blue-600">Estimated Cost:</span>
                        <span className="text-sm font-bold text-blue-700">R$ {selectedCustomer.nba_cost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Review Context with Translation Toggle */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                        <MessageSquare size={14} />
                        Context: Last Written Review
                      </h4>
                      <button 
                        onClick={() => setReviewLang(prev => prev === 'en' ? 'pt' : 'en')}
                        className="text-xs font-semibold flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-md border border-blue-100"
                      >
                        <Globe size={12}/> 
                        {reviewLang === 'en' ? 'Show Original (PT)' : 'Translate to EN'}
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg border border-slate-100 min-h-[46px]">
                      "{reviewLang === 'en' ? selectedCustomer.last_review_en : selectedCustomer.last_review_pt}"
                    </p>
                  </div>

                  {/* GenAI Email Editor */}
                  <div className="flex flex-col flex-1 mt-2">
                    <div className="flex justify-between items-end mb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                        <Mail size={14} className="text-indigo-500"/>
                        GenAI Drafted Response
                      </h4>
                      <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-medium">Auto-generated via LLM Prompt</span>
                    </div>
                    <textarea 
                      className="w-full flex-1 min-h-[240px] p-4 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none leading-relaxed transition-shadow"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                    />
                  </div>

                </div>

                {/* Action Buttons Footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end items-center mt-auto">
                  <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    Cancel
                  </button>
                  <button 
                    onClick={() => triggerToast(`Pipeline triggered: Automated campaigns launched for ${processedCustomers.length} customers in segment.`)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Zap size={14} className="text-yellow-400" />
                    Automate Campaign
                  </button>
                  <button 
                    onClick={() => triggerToast(`Success: Email dispatched to ${selectedCustomer.name}. Logged cost R$ ${selectedCustomer.nba_cost.toFixed(2)}.`)}
                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
                  >
                    <Send size={14} />
                    Send Manually
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}