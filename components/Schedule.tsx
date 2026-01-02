import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { User, UserRole } from '../types';
import { Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

interface ScheduleProps {
  currentUser: User;
}

const Schedule: React.FC<ScheduleProps> = ({ currentUser }) => {
  const schedule = useQuery(api.main.listSchedule) || [];
  const addSchedule = useMutation(api.main.addScheduleItem);
  const deleteSchedule = useMutation(api.main.deleteScheduleItem);

  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [day, setDay] = useState('Lundi');
  const [time, setTime] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');

  const canEdit = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DELEGATE;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time || !subject || !room) return;
    await addSchedule({ day, time, subject, room });
    setShowForm(false);
    setTime('');
    setSubject('');
    setRoom('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer ce cours ?')) {
      await deleteSchedule({ id: id as any });
    }
  };

  const daysOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
            <Calendar size={24} />
          </div>
          Emploi du temps
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2A2A35] text-white rounded-xl hover:bg-[#3A3A4A] transition border border-[#3A3A4A]"
          >
            {showForm ? 'Annuler' : <><Plus size={18} /> Ajouter un cours</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-[#151521] p-6 rounded-2xl shadow-xl border border-[#2A2A35] mb-8 grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-down">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Jour</label>
            <select 
                value={day} 
                onChange={e => setDay(e.target.value)}
                className="w-full bg-[#0B0B15] px-4 py-3 border border-[#2A2A35] rounded-xl text-white focus:ring-2 focus:ring-violet-500 outline-none"
            >
                {daysOrder.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Horaire</label>
            <input 
                type="text" 
                value={time} 
                onChange={e => setTime(e.target.value)} 
                className="w-full bg-[#0B0B15] px-4 py-3 border border-[#2A2A35] rounded-xl text-white focus:ring-2 focus:ring-violet-500 outline-none"
                placeholder="HH:MM - HH:MM"
                required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Matière</label>
            <input 
                type="text" 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="w-full bg-[#0B0B15] px-4 py-3 border border-[#2A2A35] rounded-xl text-white focus:ring-2 focus:ring-violet-500 outline-none"
                required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Salle</label>
            <input 
                type="text" 
                value={room} 
                onChange={e => setRoom(e.target.value)} 
                className="w-full bg-[#0B0B15] px-4 py-3 border border-[#2A2A35] rounded-xl text-white focus:ring-2 focus:ring-violet-500 outline-none"
                required 
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="px-8 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl hover:from-violet-500 hover:to-fuchsia-500 font-semibold shadow-lg">Enregistrer</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {daysOrder.map(d => {
            const dayItems = schedule.filter((s: any) => s.day === d);
            if (dayItems.length === 0) return null;
            
            return (
                <div key={d} className="bg-[#151521] rounded-2xl border border-[#2A2A35] overflow-hidden flex flex-col hover:border-violet-500/30 transition-colors">
                    <div className="bg-[#1E1E2E] px-6 py-4 border-b border-[#2A2A35] font-bold text-violet-400 uppercase tracking-wider text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                        {d}
                    </div>
                    <div className="divide-y divide-[#2A2A35]">
                        {dayItems.map((item: any) => (
                            <div key={item._id || item.id} className="p-6 hover:bg-[#1A1A2A] transition-colors group relative">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-lg text-white mb-2">{item.subject}</h4>
                                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                            <Clock size={14} className="text-fuchsia-500" /> {item.time}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-400">
                                            <MapPin size={14} className="text-emerald-500" /> {item.room}
                                        </div>
                                    </div>
                                    {canEdit && (
                                        <button 
                                            onClick={() => handleDelete(item._id || item.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default Schedule;