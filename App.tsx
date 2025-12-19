
import React, { useState, useEffect, useRef } from 'react';
import { ViewType, Song, Playlist } from './types';
import { generateAIPlaylist, generateDJTalk, decodeBase64Audio, decodeAudioBuffer } from './services/gemini';

const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: '1',
    name: 'Lo-Fi Chill',
    description: 'Perfect for late night coding sessions.',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&h=400&auto=format&fit=crop',
    songs: [
      { id: 's1', title: 'Midnight Rain', artist: 'Neon Dreams', album: 'After Hours', duration: '3:45', genre: 'Lo-fi', coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=400&h=400&auto=format&fit=crop' },
      { id: 's2', title: 'Coffee & Code', artist: 'The Algorithm', album: 'Syntax', duration: '2:30', genre: 'Lo-fi', coverUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=400&h=400&auto=format&fit=crop' },
    ]
  },
  {
    id: '2',
    name: 'Synthwave Dreams',
    description: 'Escape into the neon grid.',
    coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&h=400&auto=format&fit=crop',
    songs: [
      { id: 's3', title: 'Grid Runner', artist: 'Vector Max', album: 'Outrun', duration: '4:12', genre: 'Synthwave', coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&h=400&auto=format&fit=crop' },
    ]
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>(ViewType.HOME);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(MOCK_PLAYLISTS[0].songs[0]);
  const [volume, setVolume] = useState(50);
  const [aiPlaylists, setAiPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDjTalking, setIsDjTalking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  const handlePlaySong = async (song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);

    // AI DJ Feature
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    setIsDjTalking(true);
    try {
      const base64Audio = await generateDJTalk(song.title, song.artist);
      if (base64Audio) {
        const audioBytes = decodeBase64Audio(base64Audio);
        const buffer = await decodeAudioBuffer(audioBytes, audioContextRef.current);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        source.onended = () => setIsDjTalking(false);
      } else {
        setIsDjTalking(false);
      }
    } catch (err) {
      console.error(err);
      setIsDjTalking(false);
    }
  };

  const handleCreateAIPlaylist = async () => {
    if (!searchQuery.trim()) return;
    setIsGenerating(true);
    const result = await generateAIPlaylist(searchQuery);
    if (result) {
      const newPlaylist: Playlist = {
        id: `ai-${Date.now()}`,
        name: result.name,
        description: result.description,
        coverUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=400&h=400&auto=format&fit=crop',
        songs: result.songs.map((s: any, idx: number) => ({
          ...s,
          id: `ai-s-${idx}`,
          coverUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?q=80&w=400&h=400&auto=format&fit=crop'
        }))
      };
      setAiPlaylists([newPlaylist, ...aiPlaylists]);
      setSearchQuery('');
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans overflow-hidden">
      {/* Top Container: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col gap-2">
          <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
            <button onClick={() => setCurrentView(ViewType.HOME)} className={`flex items-center gap-4 font-bold transition-colors ${currentView === ViewType.HOME ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zM13 20h-2v-6h2v6z"/></svg>
              Home
            </button>
            <button onClick={() => setCurrentView(ViewType.SEARCH)} className={`flex items-center gap-4 font-bold transition-colors ${currentView === ViewType.SEARCH ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10.533 1.271a9.262 9.262 0 1 0 5.738 16.535l4.514 4.514a1 1 0 0 0 1.414-1.414l-4.514-4.514a9.262 9.262 0 0 0-7.152-15.121zM2.271 10.533a8.262 8.262 0 1 1 16.524 0 8.262 8.262 0 0 1-16.524 0z"/></svg>
              Search
            </button>
          </div>

          <div className="bg-[#121212] rounded-lg flex-1 overflow-hidden flex flex-col">
            <div className="p-4 shadow-md">
               <button className="flex items-center gap-2 text-gray-400 font-bold hover:text-white transition-colors mb-4">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 2 0v18a1 1 0 0 1-1 1zM15.5 2.134A1 1 0 0 0 14 3v18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1.5-.866L15.5 5.134zM16 19.464V5.464l4-2.309V17.155l-4 2.309zM8 2h1a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/></svg>
                Your Library
              </button>
              <div className="flex gap-2">
                 <button className="px-3 py-1 bg-[#242424] rounded-full text-sm font-medium hover:bg-[#2a2a2a]">Playlists</button>
                 <button className="px-3 py-1 bg-[#242424] rounded-full text-sm font-medium hover:bg-[#2a2a2a]">Artists</button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-2">
              {/* Static Playlists */}
              {MOCK_PLAYLISTS.map(pl => (
                <button 
                  key={pl.id} 
                  onClick={() => { setSelectedPlaylist(pl); setCurrentView(ViewType.PLAYLIST); }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors text-left"
                >
                  <img src={pl.coverUrl} className="w-12 h-12 rounded-md object-cover" alt="" />
                  <div className="overflow-hidden">
                    <div className="font-semibold truncate">{pl.name}</div>
                    <div className="text-xs text-gray-400">Playlist • {pl.songs.length} songs</div>
                  </div>
                </button>
              ))}
              {/* AI Generated Playlists */}
              {aiPlaylists.map(pl => (
                <button 
                  key={pl.id} 
                  onClick={() => { setSelectedPlaylist(pl); setCurrentView(ViewType.PLAYLIST); }}
                  className="w-full flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-md transition-colors text-left"
                >
                   <div className="w-12 h-12 rounded-md bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-xl">✨</div>
                  <div className="overflow-hidden">
                    <div className="font-semibold truncate text-green-400">{pl.name}</div>
                    <div className="text-xs text-gray-400">AI Generator • {pl.songs.length} songs</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-gradient-to-b from-[#1e1e1e] to-[#121212] rounded-lg overflow-y-auto relative scroll-smooth">
          {/* Top Bar */}
          <header className="sticky top-0 z-20 p-4 flex items-center justify-between bg-[#121212]/50 backdrop-blur-md">
            <div className="flex gap-2">
              <button className="p-2 bg-black/40 rounded-full hover:bg-black/60"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15.957 3.535A1 1 0 0 1 15.957 4.95L10.414 10.5H20a1 1 0 1 1 0 2H10.414l5.543 5.543a1 1 0 0 1-1.414 1.414L7.336 12.25a1 1 0 0 1 0-1.414l7.207-7.301a1 1 0 0 1 1.414 0z"/></svg></button>
              <button className="p-2 bg-black/40 rounded-full hover:bg-black/60"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.043 20.465a1 1 0 0 1 0-1.414L13.586 13.5H4a1 1 0 1 1 0-2h9.586L8.043 5.957a1 1 0 0 1 1.414-1.414l7.207 7.207a1 1 0 0 1 0 1.414l-7.207 7.207a1 1 0 0 1-1.414 0z"/></svg></button>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-white text-black px-4 py-1 rounded-full font-bold text-sm hover:scale-105 transition-transform">Upgrade</button>
              <button className="p-2 bg-black/40 rounded-full hover:bg-black/60">
                <div className="w-7 h-7 bg-purple-500 rounded-full flex items-center justify-center text-xs">G</div>
              </button>
            </div>
          </header>

          <div className="p-6">
            {currentView === ViewType.HOME && (
              <div className="space-y-8">
                <section>
                  <h2 className="text-3xl font-bold mb-6">Good evening</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MOCK_PLAYLISTS.concat(aiPlaylists).slice(0, 6).map(pl => (
                      <div key={pl.id} onClick={() => { setSelectedPlaylist(pl); setCurrentView(ViewType.PLAYLIST); }} className="bg-[#ffffff1a] rounded flex items-center gap-4 hover:bg-[#ffffff33] cursor-pointer overflow-hidden transition-colors group">
                        <img src={pl.coverUrl} className="w-20 h-20 object-cover shadow-lg" alt="" />
                        <div className="flex-1 font-bold truncate pr-12">{pl.name}</div>
                        <button className="w-12 h-12 bg-[#1db954] rounded-full items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 hidden lg:flex">
                          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold hover:underline cursor-pointer">AI Discover Lab</h3>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-8 rounded-xl border border-white/5">
                    <div className="max-w-xl">
                      <h4 className="text-xl font-bold mb-2">Create your dream playlist with Gemini</h4>
                      <p className="text-gray-400 mb-6">Describe a mood, a situation, or a specific vibe, and our AI will curate a list of songs just for you.</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="e.g. A rainy day in 1980s Paris" 
                          className="flex-1 bg-white/10 border border-white/10 rounded-full px-6 py-3 outline-none focus:bg-white/20 transition-all"
                        />
                        <button 
                          onClick={handleCreateAIPlaylist}
                          disabled={isGenerating || !searchQuery.trim()}
                          className="bg-[#1db954] text-black font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {isGenerating ? 'Curating...' : 'Generate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {currentView === ViewType.PLAYLIST && selectedPlaylist && (
              <div>
                <div className="flex flex-col md:flex-row gap-6 items-end mb-8">
                  <img src={selectedPlaylist.coverUrl} className="w-52 h-52 shadow-2xl rounded-sm object-cover" alt="" />
                  <div className="flex-1">
                    <div className="text-sm font-bold uppercase tracking-widest mb-2">Playlist</div>
                    <h1 className="text-5xl md:text-7xl font-black mb-4">{selectedPlaylist.name}</h1>
                    <div className="text-gray-300 text-sm">{selectedPlaylist.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-8 mb-8">
                  <button className="w-14 h-14 bg-[#1db954] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                  </button>
                  <button className="text-gray-400 hover:text-white transition-colors">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M5.21 1.57a6.757 6.757 0 0 1 6.708 1.545.124.124 0 0 1 .165 0 6.741 6.741 0 0 1 6.707-1.545 6.99 6.99 0 0 1 4.777 8.24c-.2.929-.571 1.841-1.103 2.711a26.6 26.6 0 0 1-10.237 9.87.252.252 0 0 1-.254 0 26.6 26.6 0 0 1-10.238-9.87c-.532-.87-.903-1.782-1.102-2.711a6.99 6.99 0 0 1 4.777-8.24z"/></svg>
                  </button>
                </div>

                <table className="w-full text-left text-gray-400 text-sm">
                  <thead className="border-b border-white/10 uppercase tracking-widest text-xs">
                    <tr>
                      <th className="py-2 px-4 w-10">#</th>
                      <th className="py-2 px-4">Title</th>
                      <th className="py-2 px-4">Album</th>
                      <th className="py-2 px-4 text-right">
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.42V7z"/></svg>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPlaylist.songs.map((song, idx) => (
                      <tr key={song.id} 
                          onClick={() => handlePlaySong(song)}
                          className="hover:bg-white/10 group cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 group-hover:text-white">
                          <span className="group-hover:hidden">{idx + 1}</span>
                          <svg className="w-4 h-4 hidden group-hover:inline text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={song.coverUrl} className="w-10 h-10 object-cover" alt="" />
                            <div>
                              <div className={`font-medium ${currentSong?.id === song.id ? 'text-[#1db954]' : 'text-white'}`}>{song.title}</div>
                              <div className="text-xs group-hover:text-white">{song.artist}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 group-hover:text-white">{song.album}</td>
                        <td className="py-3 px-4 text-right group-hover:text-white">{song.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Music Player Bar */}
      <footer className="h-24 bg-black border-t border-[#282828] px-4 flex items-center justify-between">
        {/* Current Song Info */}
        <div className="flex items-center gap-4 w-1/3 min-w-[200px]">
          {currentSong && (
            <>
              <img src={currentSong.coverUrl} className="w-14 h-14 rounded shadow-lg object-cover" alt="" />
              <div className="overflow-hidden">
                <div className="font-semibold text-sm truncate hover:underline cursor-pointer">{currentSong.title}</div>
                <div className="text-xs text-gray-400 truncate hover:underline cursor-pointer">{currentSong.artist}</div>
              </div>
              <button className="text-gray-400 hover:text-white ml-2 transition-colors">
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M5.21 1.57a6.757 6.757 0 0 1 6.708 1.545.124.124 0 0 1 .165 0 6.741 6.741 0 0 1 6.707-1.545 6.99 6.99 0 0 1 4.777 8.24c-.2.929-.571 1.841-1.103 2.711a26.6 26.6 0 0 1-10.237 9.87.252.252 0 0 1-.254 0 26.6 26.6 0 0 1-10.238-9.87c-.532-.87-.903-1.782-1.102-2.711a6.99 6.99 0 0 1 4.777-8.24z"/></svg>
              </button>
            </>
          )}
        </div>

        {/* Player Controls */}
        <div className="flex flex-col items-center gap-2 w-1/3 max-w-[600px]">
          <div className="flex items-center gap-6">
            <button className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 6.89l.707-.707L12 13.086l6.793-6.903.707.707L12 14.5 4.5 6.89z"/></svg></button>
            <button className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.707 5.293L8.414 9.586 12.707 13.879 11.293 15.293 5.586 9.586 11.293 3.879zM18 5v10h-2V5h2z"/></svg></button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M10 5H7v14h3V5zm7 0h-3v14h3V5z"/></svg>
              ) : (
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/></svg>
              )}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.293 5.293L15.586 9.586 11.293 13.879 12.707 15.293 18.414 9.586 12.707 3.879zM6 5v10h2V5H6z"/></svg></button>
            <button className="text-gray-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M7 7h10v2H7z"/></svg></button>
          </div>
          <div className="w-full flex items-center gap-2 text-[10px] text-gray-400 font-medium">
            <span>0:45</span>
            <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1db954]" style={{ width: '30%' }}></div>
            </div>
            <span>{currentSong?.duration || '3:00'}</span>
          </div>
        </div>

        {/* Extra Controls */}
        <div className="flex items-center justify-end gap-3 w-1/3">
          <div className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${isDjTalking ? 'bg-green-500 text-black border-green-500' : 'text-gray-500 border-gray-800'}`}>
            AI DJ {isDjTalking ? 'LIVE' : 'AUTO'}
          </div>
          <button className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/></svg></button>
          <button className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm10 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2z"/></svg></button>
          <div className="flex items-center gap-2 w-24">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.9 2.1l-6.2 6.2H2v7.4h4.7l6.2 6.2V2.1zm-2 16.4l-4.1-4.1H4v-3.4h2.8l4.1-4.1v11.6zm5.4-4.2c.5-1.1.8-2.3.8-3.5s-.3-2.4-.8-3.5l-1.6.7c.4.9.6 1.8.6 2.8s-.2 1.9-.6 2.8l1.6.7zm3.3 1.4c1-1.9 1.5-4 1.5-6.3s-.5-4.4-1.5-6.3l-1.6.7c.9 1.6 1.3 3.5 1.3 5.6s-.4 4-1.3 5.6l1.6.7z"/></svg>
            <div className="flex-1 h-1 bg-[#4d4d4d] rounded-full relative">
              <div className="absolute top-0 left-0 h-full bg-white hover:bg-[#1db954]" style={{ width: `${volume}%` }}></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
