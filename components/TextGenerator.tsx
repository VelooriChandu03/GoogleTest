
import React, { useState, useRef, useEffect } from 'react';
import { generateTextStream } from '../services/gemini';

const TextGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const outputEndRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setOutput('');
    try {
      const stream = generateTextStream(prompt);
      for await (const chunk of stream) {
        setOutput(prev => prev + chunk);
      }
    } catch (err) {
      console.error(err);
      setOutput('Error generating text. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          The Prompt Lab
        </h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should we write today? (e.g., 'A poem about a neon cyberpunk rainstorm')"
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Magic...</span>
              </>
            ) : (
              <span>Manifest Story</span>
            )}
          </button>
        </form>
      </div>

      {output && (
        <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 shadow-xl min-h-[200px] prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed text-slate-300">
            {output}
          </div>
          <div ref={outputEndRef} />
        </div>
      )}
    </div>
  );
};

export default TextGenerator;
