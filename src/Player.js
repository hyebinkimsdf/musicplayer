import { useState, useEffect, useRef, useCallback } from 'react';

const REPEAT = ['none', 'all', 'one'];

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

function RepeatIcon({ mode }) {
  if (mode === 'one') return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      ↻<span style={{ position: 'absolute', top: -4, right: -6, fontSize: 9, fontWeight: 700 }}>1</span>
    </span>
  );
  return <span>↻</span>;
}

function loadYTApi() {
  return new Promise((resolve) => {
    if (window.YT?.Player) { resolve(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = resolve;
  });
}

export default function Player({
  playlist, currentIndex, setCurrentIndex, removeSong,
  moveSong, mode, setMode, urlInput, setUrlInput, addSong, isAdding, addError,
}) {
  const ytRef = useRef(null);
  const ytReadyRef = useRef(false);
  const pendingIdRef = useRef(null);
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);
  const repeatIdxRef = useRef(0);
  const loadAndPlayRef = useRef(null);
  const setCurrentIndexRef = useRef(setCurrentIndex);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repeatIdx, setRepeatIdx] = useState(0);
  const [opacity, setOpacity] = useState(1.0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [showThumb, setShowThumb] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const repeatMode = REPEAT[repeatIdx];
  const song = playlist[currentIndex];

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { repeatIdxRef.current = repeatIdx; }, [repeatIdx]);
  useEffect(() => { setCurrentIndexRef.current = setCurrentIndex; }, [setCurrentIndex]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      if (!ytRef.current) return;
      try {
        setElapsed(ytRef.current.getCurrentTime() || 0);
        const d = ytRef.current.getDuration();
        if (d > 0) setDuration(d);
      } catch {}
    }, 500);
    return () => clearInterval(id);
  }, [isPlaying]);

  const loadAndPlay = useCallback((idx) => {
    const target = playlistRef.current[idx];
    if (!target) return;
    setIsLoading(true);
    setIsPlaying(false);
    setElapsed(0);
    setDuration(target.duration || 0);
    setLoadError('');
    if (ytReadyRef.current && ytRef.current) {
      ytRef.current.loadVideoById(target.id);
    } else {
      pendingIdRef.current = target.id;
    }
  }, []);

  loadAndPlayRef.current = loadAndPlay;

  useEffect(() => {
    loadYTApi().then(() => {
      ytRef.current = new window.YT.Player('yt-bg', {
        height: '90',
        width: '160',
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
            if (pendingIdRef.current) {
              ytRef.current.loadVideoById(pendingIdRef.current);
              pendingIdRef.current = null;
            }
          },
          onStateChange: (e) => {
            const S = window.YT?.PlayerState;
            if (!S) return;
            if (e.data === S.PLAYING) {
              setIsLoading(false);
              setIsPlaying(true);
            } else if (e.data === S.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === S.BUFFERING) {
              setIsLoading(true);
            } else if (e.data === S.ENDED) {
              setIsPlaying(false);
              setElapsed(0);
              const rep = REPEAT[repeatIdxRef.current];
              const idx = currentIndexRef.current;
              const pl = playlistRef.current;
              if (rep === 'one') {
                ytRef.current?.seekTo(0);
                ytRef.current?.playVideo();
              } else if (rep === 'all' || idx < pl.length - 1) {
                const next = (idx + 1) % pl.length;
                setCurrentIndexRef.current(next);
                currentIndexRef.current = next;
                loadAndPlayRef.current(next);
              }
            }
          },
          onError: () => {
            setIsLoading(false);
            setLoadError('재생 실패');
          },
        },
      });
    });
    return () => { ytRef.current?.destroy(); ytRef.current = null; };
  }, []); // eslint-disable-line

  const togglePlay = () => {
    if (!song) return;
    if (!ytRef.current) return;
    if (isPlaying) {
      ytRef.current.pauseVideo();
    } else if (elapsed > 0) {
      ytRef.current.playVideo();
    } else {
      loadAndPlay(currentIndex);
    }
  };

  const goTo = (idx) => {
    if (idx < 0 || idx >= playlist.length) return;
    setCurrentIndex(idx);
    loadAndPlay(idx);
  };

  const handleDragStart = (e, idx) => {
    setDragIndex(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer.getData('text/plain'));
    setDragIndex(null);
    if (!Number.isInteger(from)) return;
    moveSong(from, idx);
  };

  const cycleRepeat = () => setRepeatIdx(i => (i + 1) % REPEAT.length);

  const changeOpacity = (o) => {
    setOpacity(o);
    window.api.setOpacity(o);
  };

  const progress = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;

  const ytBgEl = (
    <div style={{ position: 'fixed', left: '-200px', top: '-200px', pointerEvents: 'none', zIndex: -1 }}>
      <div id="yt-bg" />
    </div>
  );

  // ─── COMPACT MODE ───────────────────────────────────────────────────────────
  if (mode === 'compact') {
    return (
      <>
        {ytBgEl}
        <div className="compact-root" style={{ opacity }}>
          <div className="compact-drag" />
          <div
            className="compact-thumb"
            onClick={() => setShowThumb(p => !p)}
            title={showThumb ? '썸네일 숨기기' : '썸네일 보기'}
          >
            {showThumb && song?.thumbnail
              ? <img src={song.thumbnail} alt="" />
              : <div className="compact-thumb-ph" />}
          </div>
          <span className="compact-title">{song?.title || '재생 목록 없음'}</span>
          <div className="compact-controls">
            <button
              className={`icon-btn ${repeatMode !== 'none' ? 'active' : ''}`}
              onClick={cycleRepeat}
              title="반복"
            ><RepeatIcon mode={repeatMode} /></button>
            <button className="icon-btn" onClick={togglePlay} disabled={isLoading}>
              {isLoading ? '…' : isPlaying ? '⏸' : '▶'}
            </button>
            <button className="icon-btn" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex >= playlist.length - 1}>⏭</button>
            <button
              className="icon-btn opacity-btn"
              onClick={() => changeOpacity(opacity > 0.5 ? 0.3 : opacity > 0.3 ? 1.0 : 0.7)}
              title="투명도"
            >◑</button>
            <button className="icon-btn" onClick={() => setMode('full')} title="전체 보기">⛶</button>
          </div>
        </div>
      </>
    );
  }

  // ─── FULL MODE ──────────────────────────────────────────────────────────────
  return (
    <>
      {ytBgEl}
      <div className="full-root">
        <div className="titlebar">
          <div className="traffic-lights">
            <button className="tl close" onClick={() => window.api.close()} />
            <button className="tl minimize" onClick={() => window.api.minimize()} />
            <button className="tl compact-toggle" onClick={() => setMode('compact')} title="간소화" />
          </div>
          <span className="titlebar-label">Music Player</span>
        </div>

        <div className="add-section">
          <div className="add-row">
            <input
              className="url-input"
              placeholder="YouTube URL 붙여넣기"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSong()}
            />
            <button className="add-btn" onClick={addSong} disabled={isAdding}>
              {isAdding ? '…' : '+'}
            </button>
          </div>
          {addError && <p className="error-text">{addError}</p>}
        </div>

        <div className="art-wrap compact-art-wrap">
          {song?.thumbnail
            ? <img className="art compact-art" src={song.thumbnail} alt="" />
            : <div className="art compact-art art-ph"><span>♪</span></div>}
        </div>

        <div className="song-info">
          <p className="song-title">{song?.title || '—'}</p>
          <p className="song-author">{song?.author || ''}</p>
        </div>

        <div className="progress-wrap">
          <span className="time">{fmt(elapsed)}</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="time">{fmt(duration || song?.duration)}</span>
        </div>

        <div className="main-controls">
          <button
            className={`icon-btn lg ${repeatMode !== 'none' ? 'active' : ''}`}
            onClick={cycleRepeat}
          ><RepeatIcon mode={repeatMode} /></button>
          <button className="icon-btn lg" onClick={() => goTo(currentIndex - 1)} disabled={currentIndex <= 0}>⏮</button>
          <button className="play-btn" onClick={togglePlay} disabled={isLoading || !song}>
            {isLoading ? <span className="loading-dot" /> : isPlaying ? '⏸' : '▶'}
          </button>
          <button className="icon-btn lg" onClick={() => goTo(currentIndex + 1)} disabled={currentIndex >= playlist.length - 1}>⏭</button>
        </div>

        {loadError && <p className="error-text">{loadError}</p>}

        <div className="playlist">
          {playlist.length === 0 && <p className="playlist-empty">목록이 비어있습니다</p>}
          {playlist.map((s, i) => (
              <div
                key={s.id + i}
                className={`playlist-item ${i === currentIndex ? 'active' : ''} ${i === dragIndex ? 'dragging' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, i)}
                onDragOver={e => e.preventDefault()}
                onDrop={e => handleDrop(e, i)}
                onDragEnd={() => setDragIndex(null)}
                onClick={() => { setCurrentIndex(i); loadAndPlay(i); }}
              >
                <img className="pl-thumb" src={s.thumbnail} alt="" />
                <div className="pl-info">
                  <p className="pl-title">{s.title}</p>
                  <p className="pl-author">{s.author} · {fmt(s.duration)}</p>
                </div>
                <button className="pl-remove" onClick={e => { e.stopPropagation(); removeSong(i); }}>✕</button>
              </div>
          ))}
        </div>
      </div>
    </>
  );
}
