import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WS_URL } from '../../constants';
import { AdminService } from '../../services/api';
import { TV, Order } from '../../types';
import { LogOut, Monitor, List, Settings, Plus, Power, Trash2 } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';

export const AdminDashboard: React.FC = () => {
  const { logout, tvs, setTVs, updateTV, orders, setOrders } = useAppStore();
  const [activeTab, setActiveTab] = useState<'tvs' | 'orders' | 'rates'>('tvs');
  const [wsConnected, setWsConnected] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tvRes, orderRes] = await Promise.all([
          AdminService.getAllTVs(),
          AdminService.getAllOrders()
        ]);
        setTVs(tvRes.data.tvs);
        setOrders(orderRes.data.orders);
      } catch (e) {
        console.error("Failed to load admin data", e);
      }
    };
    fetchData();
  }, [setTVs, setOrders]);

  // WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const ws = new WebSocket(`${WS_URL}/ws/admin?token=${token}`);

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'tv-status-update') {
        // Assume data.tv is the updated TV object
        updateTV(data.tv); 
      } else if (data.type === 'order-created') {
        // Refetch or append locally
        AdminService.getAllOrders().then(res => setOrders(res.data.orders));
      }
    };

    return () => ws.close();
  }, [updateTV, setOrders]);

  const handleToggleTV = async (tv: TV) => {
    const newState = tv.state === 'on' ? 'off' : 'on';
    try {
      // Optimistic update
      updateTV({ ...tv, state: newState });
      await AdminService.toggleTV(tv.tvNumber, newState);
    } catch (error) {
      updateTV(tv); // Revert
      alert("Failed to toggle TV. Device might be offline.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="font-heading font-bold text-xl">Admin Console</h1>
          <div className={`text-xs px-2 py-0.5 rounded-full border ${wsConnected ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-red-500/50 text-red-400 bg-red-500/10'}`}>
            {wsConnected ? 'System Live' : 'Connecting...'}
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
          <LogOut size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-4 py-6">
        {[
          { id: 'tvs', label: 'TVs', icon: Monitor },
          { id: 'orders', label: 'Orders', icon: List },
          { id: 'rates', label: 'Configuration', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'tvs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Managed Devices ({tvs.length})</h2>
              <button className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold">
                <Plus size={16} /> Add TV
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tvs.map((tv) => (
                <GlassCard key={tv.tvNumber} className="relative group hover:border-indigo-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold font-heading">{tv.tvNumber}</h3>
                      <p className="text-sm text-gray-400">{tv.location}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_8px] ${tv.state === 'on' ? 'bg-green-500 shadow-green-500' : 'bg-red-500 shadow-red-500'}`} />
                  </div>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remaining</span>
                      <span className="font-mono text-indigo-300">{(tv.remainingDuration / 60).toFixed(1)} hrs</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full" 
                        style={{ width: `${Math.min(100, (tv.remainingDuration / 1440) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleToggleTV(tv)}
                      className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors ${
                        tv.state === 'on' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      <Power size={16} /> {tv.state === 'on' ? 'Turn Off' : 'Turn On'}
                    </button>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <GlassCard className="overflow-hidden p-0">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-gray-400 text-sm uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">TV #</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5">
                    <td className="p-4 text-gray-300">{new Date(order.orderDate).toLocaleDateString()}</td>
                    <td className="p-4 font-bold">{order.tvNumber}</td>
                    <td className="p-4">{order.timeBought} Days</td>
                    <td className="p-4">€{order.totalCost}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${order.status === 'paid' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
        
        {activeTab === 'rates' && (
          <GlassCard>
            <h3 className="text-xl font-bold mb-4">Pricing Configuration</h3>
            <p className="text-gray-400 text-sm mb-6">Modify the Google Sheets "Rates" configuration directly via this interface.</p>
            {/* Rates form would go here */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
              Note: Updating rates here will immediately reflect for all new guest users.
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
};
