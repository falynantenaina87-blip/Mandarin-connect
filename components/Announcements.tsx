import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { User, UserRole } from '../types';
import { Bell, Plus, Trash2, AlertTriangle, Image as ImageIcon, Sparkles, Wand2, Upload, X } from 'lucide-react';

interface AnnouncementsProps {
  currentUser: User;
}

const Announcements: React.FC<AnnouncementsProps> = ({ currentUser }) => {
  // Récupération automatique des données temps réel
  const announcements = useQuery(api.main.listAnnouncements) || [];
  
  const postAnnouncement = useMutation(api.main.postAnnouncement);
  const deleteAnnouncement = useMutation(api.main.deleteAnnouncement);
  const generateImage = useAction(api.actions.generateImage);

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  // Image Gen/Edit State
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canEdit = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.DELEGATE;

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;
    
    const finalImage = generatedImage || null;

    await postAnnouncement({
        title: newTitle, 
        content: newContent, 
        priority: isUrgent ? 'URGENT' : 'NORMAL', 
        imageUrl: finalImage || undefined
    });
    
    // Reset Form
    setNewTitle('');
    setNewContent('');
    setIsUrgent(false);
    setGeneratedImage(null);
    setBaseImage(null);
    setImagePrompt('');
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Supprimer cette annonce ?")) {
      await deleteAnnouncement({ id: id as any });
    }
  };

  // Handle file upload for editing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt && !newTitle) return;
    
    setIsGeneratingImg(true);
    try {
      const promptToUse = imagePrompt || `Create a vibrant illustration summarizing this announcement: ${newTitle}. ${newContent}`;
      
      const result = await generateImage({
        prompt: promptToUse, 
        baseImage: baseImage || undefined
      });
      
      if (result) {
        setGeneratedImage(result);
      }
    } catch (error) {
      console.error("Failed to generate image", error);
      alert("Erreur lors de la génération de l'image.");
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const autoFillPrompt = () => {
    if (newTitle) {
      setImagePrompt(`Une illustration cyberpunk néon pour l'annonce: ${newTitle}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 rounded-lg text-violet-400">
            <Bell size={24} />
          </div>
          Tableau d'affichage
        </h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2A2A35] text-white rounded-xl hover:bg-[#3A3A4A] transition border border-[#3A3A4A] shadow-lg"
          >
            {showForm ? 'Annuler' : <><Plus size={18} /> Nouvelle annonce</>}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handlePost} className="bg-[#151521] p-6 rounded-2xl shadow-xl border border-[#2A2A35] animate-fade-in-down mb-8">
          <div className="space-y-4">
            {/* Text Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Titre</label>
                    <input
                        type="text"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        className="w-full bg-[#0B0B15] px-4 py-3 border border-[#2A2A35] rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                        required
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Contenu</label>
                    <textarea
                        value={newContent}
                        onChange={e => setNewContent(e.target.value)}
                        rows={4}
                        className="w-full bg-[#0B0B15] px-4 py-3 border border-[#2A2A35] rounded-xl text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
                        required
                    />
                    </div>
                </div>

                {/* AI Image Generation Section */}
                <div className="bg-[#0B0B15]/50 p-4 rounded-xl border border-[#2A2A35] space-y-3">
                    <label className="flex items-center gap-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                        <Sparkles size={16} className="text-fuchsia-400" /> 
                        Illustration IA (Gemini 2.5)
                    </label>
                    
                    {/* Mode Selector / Info */}
                    <div className="text-xs text-slate-500 mb-2">
                        Générez une image à partir du texte ou modifiez une image existante.
                    </div>

                    {/* Image Preview Area */}
                    <div className="relative w-full h-40 bg-[#151521] rounded-lg border border-dashed border-[#3A3A4A] flex items-center justify-center overflow-hidden group">
                        {generatedImage ? (
                            <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                        ) : baseImage ? (
                            <img src={baseImage} alt="Base" className="w-full h-full object-cover opacity-70" />
                        ) : (
                            <div className="text-slate-600 flex flex-col items-center">
                                <ImageIcon size={24} />
                                <span className="text-xs mt-1">Aucune image</span>
                            </div>
                        )}
                        
                        {(generatedImage || baseImage) && (
                            <button 
                                type="button"
                                onClick={() => { setGeneratedImage(null); setBaseImage(null); }}
                                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={imagePrompt}
                            onChange={e => setImagePrompt(e.target.value)}
                            placeholder={baseImage ? "Ex: Ajouter un filtre rétro..." : "Décrivez l'image..."}
                            className="flex-1 bg-[#0B0B15] px-3 py-2 border border-[#2A2A35] rounded-lg text-xs text-white focus:ring-1 focus:ring-violet-500 outline-none"
                        />
                         <button 
                            type="button" 
                            onClick={autoFillPrompt}
                            className="p-2 text-slate-400 hover:text-violet-400 bg-[#1E1E2E] rounded-lg border border-[#2A2A35]"
                            title="Suggérer un prompt depuis le titre"
                        >
                            <Wand2 size={16} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 py-2 px-3 bg-[#1E1E2E] hover:bg-[#2A2A35] border border-[#2A2A35] rounded-lg text-xs text-slate-300 flex items-center justify-center gap-2 transition"
                        >
                            <Upload size={14} /> {baseImage ? "Changer image" : "Uploader base"}
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            accept="image/*"
                        />
                        
                        <button
                            type="button"
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImg || (!imagePrompt && !newTitle)}
                            className="flex-1 py-2 px-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-xs font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isGeneratingImg ? <div className="animate-spin h-3 w-3 border-2 border-white/50 border-t-white rounded-full"/> : <><Sparkles size={14} /> Générer</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-[#2A2A35] mt-4">
                <div className="flex items-center gap-3 bg-[#0B0B15] p-2 rounded-lg border border-[#2A2A35]">
                    <input 
                        type="checkbox" 
                        id="urgent" 
                        checked={isUrgent} 
                        onChange={e => setIsUrgent(e.target.checked)}
                        className="w-4 h-4 accent-fuchsia-500 rounded cursor-pointer"
                    />
                    <label htmlFor="urgent" className="text-sm font-medium text-slate-300 cursor-pointer">Marquer URGENT</label>
                </div>
                <button type="submit" className="px-8 py-3 bg-white text-black rounded-xl hover:bg-slate-200 font-bold shadow-lg transition">
                    Publier l'annonce
                </button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-5">
        {announcements.map((ann: any) => (
          <div 
            key={ann._id || ann.id} 
            className={`bg-[#151521] rounded-2xl overflow-hidden relative transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl border ${
                ann.priority === 'URGENT' 
                ? 'border-fuchsia-500/30 shadow-[0_0_20px_rgba(232,121,249,0.05)]' 
                : 'border-[#2A2A35]'
            }`}
          >
            {/* Image Banner if present */}
            {ann.imageUrl && (
                <div className="w-full h-48 overflow-hidden relative group">
                    <img src={ann.imageUrl} alt={ann.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#151521] to-transparent opacity-80"></div>
                </div>
            )}

            <div className="p-6 relative">
                <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        {ann.priority === 'URGENT' && (
                            <span className="bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(232,121,249,0.2)]">
                                <AlertTriangle size={12} /> URGENT
                            </span>
                        )}
                        <h3 className="text-xl font-bold text-white">{ann.title}</h3>
                    </div>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#2A2A35]">
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                        <span className="text-xs text-slate-500">
                        Publié le {new Date(ann.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                {canEdit && (
                    <button 
                    onClick={() => handleDelete(ann._id || ann.id)}
                    className="p-2.5 text-slate-500 hover:text-red-400 bg-[#0B0B15] rounded-xl border border-[#2A2A35] hover:border-red-500/30 transition-all ml-4"
                    >
                    <Trash2 size={18} />
                    </button>
                )}
                </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
            <div className="text-center py-16 text-slate-500 bg-[#151521]/50 rounded-2xl border border-dashed border-[#2A2A35]">
                <Bell className="mx-auto mb-3 opacity-20" size={48} />
                Aucune annonce pour le moment.
            </div>
        )}
      </div>
    </div>
  );
};

export default Announcements;