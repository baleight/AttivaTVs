import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { WS_URL } from '../../constants';
import { AdminService } from '../../services/api';
import { TV, Order, AgendaEvent } from '../../types';
import { LogOut, Monitor, List, Settings, Plus, Power, Trash2, Calendar as CalendarIcon, Edit2, Check, X, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { GlassCard } from '../../components/GlassCard';
import { CalendarView } from '../../components/CalendarView';

export const AdminDashboard: React.FC = () => {
  const { 
    logout, 
    tvs, setTVs, updateTV, updateTVStatus, addTV,
    orders, setOrders,
    events, setEvents, addEvent, removeEvent 
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'tvs' | 'orders' | 'rates' | 'agenda'>('tvs');
  const [wsConnected, setWsConnected] = useState(false);
  
  // Edit State
  const [editingTv, setEditingTv] = useState<string | null>(null);
  const [editLocationValue, setEditLocationValue] = useState('');

  // Add TV Modal State
  const [showAddTvModal, setShowAddTvModal] = useState(false);
  const [newTvData, setNewTvData] = useState({ number: '', location: '' });
  const [addingTv, setAddingTv] = useState(false);

  // Toggle Confirmation State
  const [tvToToggle, setTvToToggle] = useState<TV | null>(null);

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
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'tv-status-update' && data.tv) {
          updateTVStatus(data.tv.tvNumber, {
            connected: data.tv.connected,
            state: data.tv.state, // Sync state if provided
            last_updated: data.tv.last_updated 
          });
        } else if (data.type === 'order-created') {
          AdminService.getAllOrders().then(res => setOrders(res.data.orders));
        } else if (data.type === 'initial-state' && Array.isArray(data.devices)) {
          // Sync online status for all connected devices
          data.devices.forEach((dev: any) => {
             updateTVStatus(dev.tvNumber, { connected: true, last_updated: dev.last_updated });
          });
        }
      } catch (e) {
        console.error("WS Parse Error", e);
      }
    };

    return () => ws.close();
  }, [updateTVStatus, setOrders]);

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

  const executeToggle = async () => {
    if (tvToToggle) {
        await handleToggleTV(tvToToggle);
        setTvToToggle(null);
    }
  };

  const handleAddTvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newTvData.number || !newTvData.location) return;
    
    setAddingTv(true);
    try {
        await AdminService.addTV({ tvNumber: newTvData.number, location: newTvData.location });
        
        // Optimistic update
        const newTv: TV = {
            tvNumber: newTvData.number,
            location: newTvData.location,
            state: 'off',
            remainingDuration: 0,
            balance: 0,
            last_updated: new Date().toISOString(),
            connected: false
        };
        addTV(newTv);
        
        setShowAddTvModal(false);
        setNewTvData({ number: '', location: '' });
    } catch (error) {
        alert("Failed to add TV");
    } finally {
        setAddingTv(false);
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
          <div className={`flex items-center gap-2 text-xs px-2 py-0.5 rounded-full border ${wsConnected ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-gray-500/50 text-gray-400 bg-gray-500/10'}`}>
            {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
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
              <button 
                onClick={() => setShowAddTvModal(true)}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-lg shadow-green-500/20 transition-all active:scale-95"
              >
                <Plus size={16} /> Add TV
              </button>
            </div>
            
            <GlassCard className="overflow-hidden p-0">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-400 text-sm uppercase font-semibold">
                  <tr>
                    <th className="p-4 w-32">TV #</th>
                    <th className="p-4">Location</th>
                    <th className="p-4 w-40">Connectivity</th>
                    <th className="p-4 w-32">Power</th>
                    <th className="p-4 w-40">Remaining</th>
                    <th className="p-4 w-32 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {tvs.map((tv) => (
                    <tr key={tv.tvNumber} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 font-bold font-heading text-lg">{tv.tvNumber}</td>
                      
                      <td className="p-4">
                        {editingTv === tv.tvNumber ? (
                          <div className="flex items-center gap-2">
                            <input 
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm w-full focus:outline-none focus:border-indigo-500 text-white min-w-[150px]"
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
                          <div className="flex items-center gap-2 group/edit">
                            <span className="text-gray-300">{tv.location}</span>
                            <button 
                              onClick={() => startEditing(tv)}
                              className="opacity-0 group-hover/edit:opacity-100 text-gray-500 hover:text-indigo-400 transition-opacity p-1"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                           {tv.connected ? (
                             <>
                               <Wifi size={16} className="text-green-400" />
                               <span className="text-green-400 font-medium">Online</span>
                             </>
                           ) : (
                             <>
                               <WifiOff size={16} className="text-gray-500" />
                               <span className="text-gray-500">Offline</span>
                             </>
                           )}
                        </div>
                      </td>

                      <td className="p-4">
                         <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${
                             tv.state === 'on' 
                             ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                             : 'bg-red-500/10 text-red-400 border-red-500/20'
                         }`}>
                           {tv.state}
                         </span>
                      </td>

                      <td className="p-4">
                         <div className="flex flex-col gap-1">
                           <span className="font-mono text-gray-300">{(tv.remainingDuration / 60).toFixed(1)} hrs</span>
                           {tv.remainingDuration > 0 && (
                             <div className="w-24 bg-gray-700 h-1 rounded-full overflow-hidden">
                               <div 
                                 className="bg-indigo-500 h-full transition-all duration-500" 
                                 style={{ width: `${Math.min(100, (tv.remainingDuration / 1440) * 100)}%` }} 
                               />
                             </div>
                           )}
                         </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button 
                              onClick={() => setTvToToggle(tv)}
                              title={tv.state === 'on' ? 'Turn Off' : 'Turn On'}
                              className={`p-2 rounded-lg transition-colors ${
                                tv.state === 'on' 
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
                                : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                              }`}
                           >
                             <Power size={18} />
                           </button>
                           {/* Add delete functionality if needed, currently just UI */}
                           <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors">
                              <Trash2 size={18} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tvs.length === 0 && (
                     <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                           No devices found. Add a TV to get started.
                        </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </GlassCard>
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

      {/* Toggle Confirmation Modal */}
      {tvToToggle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <GlassCard className="w-full max-w-sm text-center">
            <div className="flex justify-center mb-4">
               <div className="p-3 bg-yellow-500/20 rounded-full">
                  <AlertTriangle className="text-yellow-500 w-8 h-8" />
               </div>
            </div>
            <h3 className="text-xl font-bold font-heading mb-2">Confirm Power Action</h3>
            <p className="text-gray-300 text-sm mb-6">
                Are you sure you want to turn <span className="font-bold text-white">{tvToToggle.state === 'on' ? 'OFF' : 'ON'}</span> TV <span className="font-bold text-white">{tvToToggle.tvNumber}</span>?
                <br/>
                <span className="text-xs text-gray-500 block mt-2">Location: {tvToToggle.location}</span>
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setTvToToggle(null)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeToggle}
                className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                    tvToToggle.state === 'on' 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                Confirm
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Add TV Modal */}
      {showAddTvModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <GlassCard className="w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold font-heading">Add New Device</h3>
              <button onClick={() => setShowAddTvModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTvSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">TV Number (ID)</label>
                <input
                  type="text"
                  placeholder="e.g. 1003"
                  maxLength={4}
                  value={newTvData.number}
                  onChange={(e) => setNewTvData({ ...newTvData, number: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Room 205"
                  value={newTvData.location}
                  onChange={(e) => setNewTvData({ ...newTvData, location: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={addingTv || !newTvData.number || !newTvData.location}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {addingTv ? 'Adding...' : <><Plus size={18} /> Add Device</>}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};