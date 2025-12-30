import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WS_URL } from '../../constants';
import { AdminService } from '../../services/api';
import { TV, Order, AgendaEvent } from '../../types';
import { LogOut, Monitor, List, Settings, Plus, Power, Trash2, Calendar as CalendarIcon, Edit2, Check, X } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { CalendarView } from '../../components/CalendarView';

export const AdminDashboard: React.FC = () => {
  const { 
    logout, 
    tvs, setTVs, updateTV, 
    orders, setOrders,
    events, setEvents, addEvent, removeEvent 
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'tvs' | 'orders' | 'rates' | 'agenda'>('tvs');
  const [wsConnected, setWsConnected] = useState(false);
  
  // Edit State
  const [editingTv, setEditingTv] = useState<string | null>(null);
  const [editLocationValue, setEditLocationValue] = useState('');

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tvRes, orderRes, agendaRes] = await Promise.all([
          AdminService.getAllTVs(),
          AdminService.getAllOrders(),
          AdminService.getAgenda()
        ]);
        setTVs(tvRes.data.tvs);
        setOrders(orderRes.data.orders);
        setEvents(agendaRes.data.events);
      } catch (e) {
        console.error("Failed to load admin data", e);
      }
    };
    fetchData();
  }, [setTVs, setOrders, setEvents]);

  // WebSocket Connection
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!WS_URL) return; // Skip if not configured
    
    const ws = new WebSocket(`${WS_URL}/ws/admin?token=${token}`);

    ws.onopen = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'tv-status-update') {
        updateTV(data.tv); 
      } else if (data.type === 'order-created') {
        AdminService.getAllOrders().then(res => setOrders(res.data.orders));
      }
    };

    return () => ws.close();
  }, [updateTV, setOrders]);

  const handleToggleTV = async (tv: TV) => {
    const newState = tv.state === 'on' ? 'off' : 'on';
    try {
      updateTV({ ...tv, state: newState });
      await AdminService.toggleTV(tv.tvNumber, newState);
    } catch (error) {
      updateTV(tv);
      alert("Failed to toggle TV. Device might be offline.");
    }
  };

  const handleAddAgendaEvent = async (eventData: Partial<AgendaEvent>) => {
    try {
      const { data } = await AdminService.addAgendaEvent(eventData);
      if (data.event) {
          // @ts-ignore - Backend returns strict type, UI handles optional
          addEvent(data.event);
      }
    } catch (error) {
      alert("Failed to add event");
    }
  };

  const handleDeleteAgendaEvent = async (id: string) => {
    try {
      await AdminService.deleteAgendaEvent(id);
      removeEvent(id);
    } catch (error) {
      alert("Failed to delete event");
    }
  };
  
  // Editing Logic
  const startEditing = (tv: TV) => {
    setEditingTv(tv.tvNumber);
    setEditLocationValue(tv.location);
  };

  const cancelEditing = () => {
    setEditingTv(null);
    setEditLocationValue('');
  };

  const saveLocation = async (tvNumber: string) => {
    if (!editLocationValue.trim()) return;
    try {
      // Optimistic update
      const tvToUpdate = tvs.find(t => t.tvNumber === tvNumber);
      if (tvToUpdate) {
          updateTV({ ...tvToUpdate, location: editLocationValue });
      }
      setEditingTv(null);
      await AdminService.updateTVLocation(tvNumber, editLocationValue);
    } catch (error) {
      alert("Failed to update location");
    }
  };

  // Combine Manual Events with Dynamic TV Expirations
  const getCombinedEvents = () => {
    const dynamicEvents: AgendaEvent[] = tvs
      .filter(tv => tv.remainingDuration > 0 && tv.state === 'on')
      .map(tv => {
        // Calculate expiry date
        const now = new Date();
        const expiryDate = new Date(now.getTime() + tv.remainingDuration * 60000);
        return {
          id: `expiry-${tv.tvNumber}`,
          title: `TV ${tv.tvNumber} Expires`,
          date: expiryDate.toISOString(),
          type: 'expiry' as const,
          description: `Location: ${tv.location}`
        };
      });

    return [...events, ...dynamicEvents];
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="font-heading font-bold text-xl">Admin Console</h1>
          <div className={`text-xs px-2 py-0.5 rounded-full border ${wsConnected ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-gray-500/50 text-gray-400 bg-gray-500/10'}`}>
            {wsConnected ? 'System Live' : 'Polling Mode'}
          </div>
        </div>
        <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
          <LogOut size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex justify-center gap-4 py-6 overflow-x-auto px-4">
        {[
          { id: 'tvs', label: 'TVs', icon: Monitor },
          { id: 'orders', label: 'Orders', icon: List },
          { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
          { id: 'rates', label: 'Configuration', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all whitespace-nowrap ${
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
                    <div className="flex-1 mr-4">
                      <h3 className="text-2xl font-bold font-heading">{tv.tvNumber}</h3>
                      
                      {editingTv === tv.tvNumber ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-indigo-500 text-white"
                            value={editLocationValue}
                            onChange={(e) => setEditLocationValue(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveLocation(tv.tvNumber);
                                if (e.key === 'Escape') cancelEditing();
                            }}
                          />
                          <button onClick={() => saveLocation(tv.tvNumber)} className="text-green-400 hover:text-green-300 p-1"><Check size={16} /></button>
                          <button onClick={cancelEditing} className="text-red-400 hover:text-red-300 p-1"><X size={16} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/edit h-8">
                          <p className="text-sm text-gray-400 truncate max-w-[150px]" title={tv.location}>{tv.location}</p>
                          <button 
                            onClick={() => startEditing(tv)}
                            className="opacity-0 group-hover/edit:opacity-100 text-gray-500 hover:text-indigo-400 transition-opacity p-1"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_8px] shrink-0 ${tv.state === 'on' ? 'bg-green-500 shadow-green-500' : 'bg-red-500 shadow-red-500'}`} />
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

        {activeTab === 'agenda' && (
           <CalendarView 
              events={getCombinedEvents()} 
              onAddEvent={handleAddAgendaEvent}
              onDeleteEvent={handleDeleteAgendaEvent}
           />
        )}
        
        {activeTab === 'rates' && (
          <GlassCard>
            <h3 className="text-xl font-bold mb-4">Pricing Configuration</h3>
            <p className="text-gray-400 text-sm mb-6">Modify the Google Sheets "Rates" configuration directly via this interface.</p>
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 text-sm">
              Note: Updating rates here will immediately reflect for all new guest users.
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
};