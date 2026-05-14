import { useState, useEffect } from 'react';
import Player from './Player';
import './App.css';

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [mode, setMode] = useState('compact');

  useEffect(() => {
    window.api.loadPlaylist().then(pl => {
      if (pl.length) setPlaylist(pl);
    });
  }, []);

  useEffect(() => {
    if (playlist.length > 0) window.api.savePlaylist(playlist);
  }, [playlist]);

  useEffect(() => {
    window.api.setWindowMode?.(mode);
  }, [mode]);

  const addSong = async () => {
    if (!urlInput.trim()) return;
    setIsAdding(true);
    setAddError('');
    try {
      const info = await window.api.getVideoInfo(urlInput.trim());
      setPlaylist(prev => {
        const updated = [...prev, info];
        window.api.savePlaylist(updated);
        return updated;
      });
      setUrlInput('');
    } catch {
      setAddError('링크를 불러올 수 없습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  const removeSong = (idx) => {
    setPlaylist(prev => {
      const next = prev.filter((_, i) => i !== idx);
      window.api.savePlaylist(next);
      if (currentIndex >= next.length) setCurrentIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const moveSong = (from, to) => {
    if (to < 0 || to >= playlist.length || from === to) return;
    setPlaylist(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      if (currentIndex === from) {
        setCurrentIndex(to);
      } else if (from < currentIndex && to >= currentIndex) {
        setCurrentIndex(currentIndex - 1);
      } else if (from > currentIndex && to <= currentIndex) {
        setCurrentIndex(currentIndex + 1);
      }

      window.api.savePlaylist(next);
      return next;
    });
  };

  return (
    <div className={`app-root ${mode}`}>
      <Player
        playlist={playlist}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        removeSong={removeSong}
        moveSong={moveSong}
        mode={mode}
        setMode={setMode}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        addSong={addSong}
        isAdding={isAdding}
        addError={addError}
      />
    </div>
  );
}
