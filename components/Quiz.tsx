import React, { useState, useEffect } from 'react';
import { api } from '../services/backend';
import { User, QuizQuestion, QuizResult } from '../types';
import { Brain, Sparkles, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface QuizProps {
  currentUser: User;
}

const DEFAULT_QUIZ = api.quiz.getDefaultQuiz();

const Quiz: React.FC<QuizProps> = ({ currentUser }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUIZ);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);

  useEffect(() => {
    api.quiz.checkSubmission(currentUser.id).then(setPreviousResult);
  }, [currentUser]);

  const hasHistory = !!previousResult;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setGenerating(true);
    setShowResult(false);
    
    try {
      const aiQuestions = await api.ai.generateQuiz(topic);
      setQuestions(aiQuestions);
      setScore(0);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswerChecked(false);
      setPreviousResult(null); // Clear history visually to show new quiz
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération du quiz.");
    } finally {
      setGenerating(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isAnswerChecked) return;
    setSelectedOption(option);
    setIsAnswerChecked(true);
    
    if (option === questions[currentQuestionIndex].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerChecked(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setShowResult(true);
    await api.quiz.submit(currentUser.id, score, questions.length);
  };

  const retry = () => {
    setScore(0);
    setCurrentQuestionIndex(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setQuestions(DEFAULT_QUIZ);
    setPreviousResult(null);
  };

  // --- VIEW: Result (History or Just Finished) ---
  if ((hasHistory && !generating && questions === DEFAULT_QUIZ) || showResult) {
    const finalScore = showResult ? score : (previousResult?.score || 0);
    const finalTotal = showResult ? questions.length : (previousResult?.total || 1);
    const percentage = Math.round((finalScore / finalTotal) * 100);

    const data = [
      { name: 'Correct', value: finalScore },
      { name: 'Incorrect', value: finalTotal - finalScore },
    ];
    const COLORS = ['#10b981', '#ef4444']; 

    return (
      <div className="max-w-md mx-auto bg-[#151521] p-8 rounded-3xl shadow-2xl border border-[#2A2A35] text-center mt-8">
        <h2 className="text-2xl font-bold text-white mb-2">Résultat du Quiz</h2>
        <p className="text-slate-400 mb-8">
            {showResult ? "Quiz terminé !" : "Votre dernier résultat enregistré"}
        </p>
        
        <div className="h-64 w-full mb-8 relative">
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-5xl font-bold text-white">{percentage}%</span>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>

        <p className="text-slate-300 mb-8 font-medium">Score: <span className="text-violet-400">{finalScore}</span> / {finalTotal}</p>

        <button 
            onClick={retry}
            className="flex items-center justify-center gap-2 w-full py-4 bg-[#2A2A35] text-white rounded-xl hover:bg-[#3A3A4A] transition border border-[#3A3A4A] font-semibold"
        >
            <RotateCcw size={20} /> Recommencer / Générer
        </button>
      </div>
    );
  }

  // --- VIEW: Active Quiz ---
  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Generator */}
      <div className="bg-gradient-to-r from-violet-900/40 to-fuchsia-900/40 p-6 rounded-3xl shadow-lg border border-violet-500/20 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 font-bold text-lg mb-2 text-white">
            <Sparkles className="text-fuchsia-400" /> 
            Générateur IA
        </h3>
        <p className="text-slate-300 text-sm mb-4">Générez un nouveau quiz sur un sujet spécifique (ex: "Les couleurs", "Au restaurant").</p>
        <form onSubmit={handleGenerate} className="flex gap-3">
            <input 
                type="text" 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Entrez un thème..."
                className="flex-1 bg-[#0B0B15]/50 border border-violet-500/30 rounded-xl px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent transition-all"
            />
            <button 
                type="submit" 
                disabled={generating}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-6 py-3 rounded-xl font-medium text-white transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-900/20"
            >
                {generating ? <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full" /> : 'Générer'}
            </button>
        </form>
      </div>

      {/* Question Card */}
      <div className="bg-[#151521] rounded-3xl shadow-xl border border-[#2A2A35] p-8 md:p-10 relative overflow-hidden">
        {/* Progress Bar background */}
        <div className="absolute top-0 left-0 h-1 bg-violet-600 transition-all duration-500" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>

        <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-bold tracking-widest text-violet-400 uppercase bg-violet-500/10 px-3 py-1 rounded-full">
                Question {currentQuestionIndex + 1} / {questions.length}
            </span>
            <div className="flex items-center gap-1.5 text-slate-500">
                <Brain size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Mandarin Quiz</span>
            </div>
        </div>

        <h3 className="text-2xl font-bold text-white mb-8 min-h-[4rem] leading-snug">
            {currentQ.question}
        </h3>

        <div className="space-y-4 mb-8">
            {currentQ.options.map((option: string, idx: number) => {
                let btnClass = "w-full text-left p-5 rounded-2xl border transition-all font-medium text-lg relative overflow-hidden ";
                
                if (isAnswerChecked) {
                    if (option === currentQ.correctAnswer) {
                        btnClass += "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
                    } else if (option === selectedOption) {
                        btnClass += "border-red-500/50 bg-red-500/10 text-red-400";
                    } else {
                        btnClass += "border-[#2A2A35] text-slate-500 opacity-50";
                    }
                } else {
                    btnClass += "border-[#2A2A35] bg-[#0B0B15] hover:border-violet-500/50 hover:bg-[#1E1E2E] text-slate-300 hover:text-white";
                }

                return (
                    <button
                        key={idx}
                        onClick={() => handleOptionClick(option)}
                        disabled={isAnswerChecked}
                        className={btnClass}
                    >
                        <div className="flex justify-between items-center z-10 relative">
                            <span>{option}</span>
                            {isAnswerChecked && option === currentQ.correctAnswer && <CheckCircle size={24} className="text-emerald-500" />}
                            {isAnswerChecked && option === selectedOption && option !== currentQ.correctAnswer && <XCircle size={24} className="text-red-500" />}
                        </div>
                    </button>
                )
            })}
        </div>

        {isAnswerChecked && (
            <div className="animate-fade-in mb-8 bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
                <p className="text-blue-300 text-sm leading-relaxed">
                    <strong className="block text-blue-400 mb-1 uppercase text-xs tracking-wider">Explication</strong> 
                    {currentQ.explanation}
                </p>
            </div>
        )}

        <div className="flex justify-end">
            <button
                onClick={nextQuestion}
                disabled={!isAnswerChecked}
                className="px-10 py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition transform active:scale-95"
            >
                {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Suivant'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;