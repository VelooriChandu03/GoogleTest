
import React, { useState } from 'react';
import { generateImage } from '../services/gemini';
import { GeneratedImage } from '../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const url = await generateImage(prompt);
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        url,
        prompt,
        timestamp: Date.now()
      };
      setImages(prev => [newImage, ...prev]);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto space-y-8">
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          The Visionary
        </h2>
        <form onSubmit={handleGenerate} className="flex gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your vision (e.g., 'An astronaut playing jazz on Mars')"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            type="submit"
            disabled={isGenerating || !prompt.trim()}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold shadow-lg transition-all whitespace-nowrap"
          >
            {isGenerating ? 'Envisioning...' : 'Generate'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isGenerating && (
          <div className="aspect-square rounded-2xl bg-slate-800 animate-pulse border border-slate-700 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <span className="text-slate-400 font-medium">Painting with pixels...</span>
          </div>
        )}
        {images.map(img => (
          <div key={img.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 shadow-lg transition-all hover:scale-[1.02]">
            <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
              <p className="text-sm text-slate-200 line-clamp-2">{img.prompt}</p>
              <span className="text-[10px] text-slate-400 mt-2">
                {new Date(img.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {images.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <svg className="w-20 h-20 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xl font-light">No visions manifested yet</p>
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
