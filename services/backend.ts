import { User, UserRole, Message, Announcement, ScheduleItem, QuizResult, QuizQuestion, TranslationResponse } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

// --- Mock Database State ---
interface DbState {
  users: User[];
  messages: Message[];
  announcements: Announcement[];
  schedule: ScheduleItem[];
  quizResults: QuizResult[];
  currentUser: User | null;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { id: '1', day: 'Lundi', time: '09:00 - 11:00', subject: 'Grammaire Fondamentale', room: 'Bâtiment A, Salle 101' },
  { id: '2', day: 'Mercredi', time: '14:00 - 16:00', subject: 'Pratique Orale', room: 'Labo Langues 3' },
];

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Bienvenue au semestre', content: 'Le cours commencera la semaine prochaine. Préparez vos manuels.', priority: 'NORMAL', created_at: new Date().toISOString() },
];

const DEFAULT_QUIZ: QuizQuestion[] = [
  { id: 'q1', question: 'Comment dit-on "Bonjour" ?', options: ['Ni hao', 'Zai jian', 'Xie xie', 'Bu ke qi'], correctAnswer: 'Ni hao', explanation: '"Ni hao" (你好) est la salutation standard.' },
  { id: 'q2', question: 'Que signifie "Xie xie" ?', options: ['Bonjour', 'Merci', 'Au revoir', 'De rien'], correctAnswer: 'Merci', explanation: '"Xie xie" (谢谢) signifie merci.' },
];

// Initial State Loader
const loadState = (): DbState => {
  const stored = localStorage.getItem('mandarin_app_db');
  if (stored) return JSON.parse(stored);
  return {
    users: [],
    messages: [],
    announcements: DEFAULT_ANNOUNCEMENTS,
    schedule: DEFAULT_SCHEDULE,
    quizResults: [],
    currentUser: null
  };
};

let state = loadState();

const saveState = () => {
  localStorage.setItem('mandarin_app_db', JSON.stringify(state));
};

// --- Google Gemini Setup ---
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// --- API Service Simulation ---

export const api = {
  auth: {
    login: async (email: string, password: string): Promise<User> => {
      await new Promise(r => setTimeout(r, 500)); // Simulate latency
      const user = state.users.find(u => u.email === email && password === 'password'); // Mock password check
      if (!user) {
        throw new Error("Utilisateur non trouvé ou mot de passe incorrect (utilisez 'password').");
      }
      state.currentUser = user;
      saveState();
      return user;
    },
    register: async (email: string, password: string, name: string, role: UserRole): Promise<User> => {
      await new Promise(r => setTimeout(r, 500));
      if (state.users.some(u => u.email === email)) throw new Error("Email déjà utilisé.");
      const newUser: User = { id: crypto.randomUUID(), email, name, role };
      state.users.push(newUser);
      state.currentUser = newUser;
      saveState();
      return newUser;
    },
    logout: async () => {
      state.currentUser = null;
      saveState();
    },
    getCurrentUser: async () => state.currentUser,
  },

  chat: {
    list: async (): Promise<Message[]> => {
      return [...state.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    },
    send: async (content: string, userId: string, is_mandarin = false, pinyin = '') => {
      const user = state.users.find(u => u.id === userId);
      const msg: Message = {
        id: crypto.randomUUID(),
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
        profile: user ? { name: user.name, role: user.role } : { name: 'Inconnu', role: 'élève' },
        is_mandarin,
        pinyin
      };
      state.messages.push(msg);
      saveState();
    }
  },

  announcements: {
    list: async () => [...state.announcements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    post: async (title: string, content: string, priority: 'NORMAL' | 'URGENT', imageUrl?: string) => {
      state.announcements.push({ 
        id: crypto.randomUUID(), 
        title, 
        content, 
        priority, 
        imageUrl,
        created_at: new Date().toISOString() 
      });
      saveState();
    },
    delete: async (id: string) => {
      state.announcements = state.announcements.filter(a => a.id !== id);
      saveState();
    }
  },

  schedule: {
    list: async () => state.schedule,
    add: async (item: Omit<ScheduleItem, 'id'>) => {
      state.schedule.push({ ...item, id: crypto.randomUUID() });
      saveState();
    },
    delete: async (id: string) => {
      state.schedule = state.schedule.filter(s => s.id !== id);
      saveState();
    }
  },

  quiz: {
    checkSubmission: async (userId: string) => {
      return state.quizResults.find(r => r.user_id === userId) || null;
    },
    submit: async (userId: string, score: number, total: number) => {
      state.quizResults = state.quizResults.filter(r => r.user_id !== userId); // Replace previous
      const result: QuizResult = { id: crypto.randomUUID(), user_id: userId, score, total, created_at: new Date().toISOString() };
      state.quizResults.push(result);
      saveState();
    },
    getDefaultQuiz: () => DEFAULT_QUIZ
  },

  ai: {
    translate: async (text: string): Promise<TranslationResponse> => {
      try {
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Translate the following text (which is in French or English) into Simplified Chinese (Hanzi). Also provide the Pinyin.
            Text: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hanzi: { type: Type.STRING },
                        pinyin: { type: Type.STRING }
                    },
                    required: ["hanzi", "pinyin"]
                }
            }
        });
        const jsonText = response.text;
        if (!jsonText) throw new Error("No response from AI");
        return JSON.parse(jsonText) as TranslationResponse;
      } catch (e) {
        console.error("AI Error:", e);
        return { hanzi: "你好 (Simulation)", pinyin: "Nǐ hǎo" };
      }
    },

    generateQuiz: async (topic: string): Promise<QuizQuestion[]> => {
      try {
        const response = await genAI.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `You are an expert Mandarin teacher. Generate 5 multiple-choice quiz questions for a beginner/intermediate student based on the topic: "${topic}".
            Return a JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correctAnswer: { type: Type.STRING },
                            explanation: { type: Type.STRING }
                        },
                        required: ["question", "options", "correctAnswer", "explanation"]
                    }
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("No response from AI");
        const questions = JSON.parse(jsonText) as any[];
        return questions.map((q, idx) => ({ ...q, id: `gen_${Date.now()}_${idx}` }));
      } catch (e) {
        console.error("AI Error:", e);
        return DEFAULT_QUIZ;
      }
    },

    generateImage: async (prompt: string, baseImageBase64?: string): Promise<string | undefined> => {
      try {
        const parts: any[] = [];
        if (baseImageBase64) {
           const cleanBase64 = baseImageBase64.split(',')[1] || baseImageBase64;
           parts.push({
             inlineData: {
               data: cleanBase64,
               mimeType: 'image/jpeg'
             }
           });
        }
        parts.push({ text: prompt });

        const response = await genAI.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts },
        });

        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        throw new Error("No image generated.");
      } catch (e) {
        console.error("AI Image Generation Error:", e);
        throw e;
      }
    }
  }
};