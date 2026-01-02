import React, { useState } from 'react';
import { api } from '../services/backend';
import { User, UserRole } from '../types';
import { Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user;
      if (isRegistering) {
        // Simple Role detection for Demo
        let role = UserRole.STUDENT;
        if (email.toLowerCase().includes('admin')) {
            role = UserRole.ADMIN;
        } else if (email.toLowerCase().includes('delegue')) {
            role = UserRole.DELEGATE;
        }

        user = await api.auth.register(email, password, name, role);
      } else {
        user = await api.auth.login(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-[128px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-[128px]"></div>

      {/* Frame Removed: removed bg, border, shadow classes */}
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent font-chinese mb-3">Mandarin Connect</h1>
          <p className="text-slate-400 font-medium">
            {isRegistering ? "Rejoignez la classe virtuelle" : "Accédez à votre espace"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 mb-6 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {isRegistering && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Nom complet"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0B0B15]/60 pl-12 pr-4 py-4 border border-[#2A2A35] rounded-2xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all backdrop-blur-sm"
                required
              />
            </div>
          )}
          
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
            <input
              type="email"
              placeholder={isRegistering ? "Email (ex: delegue@...)" : "Adresse email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0B0B15]/60 pl-12 pr-4 py-4 border border-[#2A2A35] rounded-2xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all backdrop-blur-sm"
              required
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-violet-400 transition-colors" size={20} />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0B0B15]/60 pl-12 pr-4 py-4 border border-[#2A2A35] rounded-2xl text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all backdrop-blur-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold py-4 rounded-2xl transition duration-300 shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2 transform active:scale-[0.98] mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isRegistering ? "S'inscrire" : "Se connecter"
            )}
          </button>
        </form>

        <div className="mt-10 text-center text-sm text-slate-500">
          {isRegistering ? "Déjà un compte ?" : "Pas encore de compte ?"}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="ml-2 text-violet-400 hover:text-violet-300 hover:underline font-medium transition-colors"
          >
            {isRegistering ? "Se connecter" : "Créer un compte"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;