import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { AgendaEvent } from '../types';

interface CalendarViewProps {
  events: AgendaEvent[];
  onAddEvent: (event: Partial<AgendaEvent>) => void;
  onDeleteEvent: (id: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ events, onAddEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'manual' | 'maintenance'>('manual');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
    setSelectedDate(dateStr);
    setShowModal(true);
  };

  const handleSaveEvent = () => {
    if (selectedDate && newEventTitle) {
      onAddEvent({
        title: newEventTitle,
        date: selectedDate,
        type: newEventType,
        description: ''
      });
      setShowModal(false);
      setNewEventTitle('');
    }
  };

  const getEventsForDay = (day: number) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
    return events.filter(e => e.date.split('T')[0] === dateStr);
  };

  const renderCells = () => {
    const cells = [];
    // Padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-white/5 opacity-50 h-32"></div>);
    }
    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDay(day);
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      cells.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`h-32 border border-white/10 p-2 relative hover:bg-white/5 transition-colors cursor-pointer group ${isToday ? 'bg-indigo-900/20' : ''}`}
        >
          <span className={`text-sm font-bold ${isToday ? 'text-indigo-400' : 'text-gray-400'}`}>{day}</span>
          <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-indigo-500 rounded-full">
            <Plus size={12} />
          </button>
          
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[85px] scrollbar-thin">
            {dayEvents.map(evt => (
              <div 
                key={evt.id} 
                className={`text-xs p-1 rounded border truncate flex justify-between items-center ${
                  evt.type === 'expiry' ? 'bg-red-500/20 border-red-500/30 text-red-200' :
                  evt.type === 'maintenance' ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200' :
                  'bg-blue-500/20 border-blue-500/30 text-blue-200'
                }`}
                title={evt.title}
              >
                <span>{evt.title}</span>
                {evt.type !== 'expiry' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteEvent(evt.id); }}
                    className="ml-1 hover:text-white"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="bg-black/20 rounded-xl overflow-hidden backdrop-blur-sm border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5">
        <h2 className="text-xl font-bold font-heading">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft /></button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight /></button>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 border-b border-white/10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-xs text-gray-400 uppercase tracking-wider font-semibold">
            {day}
          </div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7">
        {renderCells()}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
             <h3 className="text-xl font-bold mb-4">Add Event</h3>
             <p className="text-gray-400 text-sm mb-4">Date: {selectedDate}</p>
             
             <div className="space-y-4">
                <input 
                  type="text"
                  placeholder="Event Title"
                  className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                />
                
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="type" 
                            checked={newEventType === 'manual'} 
                            onChange={() => setNewEventType('manual')}
                        />
                        <span className="text-sm">General</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                            type="radio" 
                            name="type" 
                            checked={newEventType === 'maintenance'} 
                            onChange={() => setNewEventType('maintenance')}
                        />
                        <span className="text-sm">Maintenance</span>
                    </label>
                </div>

                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleSaveEvent}
                        disabled={!newEventTitle}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-semibold"
                    >
                        Save
                    </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};