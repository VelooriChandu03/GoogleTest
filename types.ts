
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: string;
  genre: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  songs: Song[];
}

export enum ViewType {
  HOME = 'home',
  SEARCH = 'search',
  LIBRARY = 'library',
  PLAYLIST = 'playlist',
  AI_DISCOVER = 'ai_discover'
}

export interface AppState {
  currentView: ViewType;
  selectedPlaylistId: string | null;
  isPlaying: boolean;
  currentSong: Song | null;
}

// Added missing interface for image generation results
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}
