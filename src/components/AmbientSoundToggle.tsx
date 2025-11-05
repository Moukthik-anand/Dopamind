'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Music } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const tracks = [
  { name: 'Ocean Waves', path: '/sounds/ocean.mp3' },
  { name: 'Lo-fi Loop', path: '/sounds/lofi.mp3' },
];

export function AmbientSoundToggle() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio on the client
    const audio = new Audio(tracks[currentTrackIndex].path);
    audio.loop = true;
    audioRef.current = audio;

    const savedState = localStorage.getItem('ambientSound');
    if (savedState) {
      const { playing, trackIndex } = JSON.parse(savedState);
      setIsPlaying(playing);
      setCurrentTrackIndex(trackIndex);
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = tracks[currentTrackIndex].path;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
    localStorage.setItem(
      'ambientSound',
      JSON.stringify({ playing: isPlaying, trackIndex: currentTrackIndex })
    );
  }, [currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
    localStorage.setItem(
      'ambientSound',
      JSON.stringify({ playing: isPlaying, trackIndex: currentTrackIndex })
    );
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const changeTrack = (index: number) => {
    setCurrentTrackIndex(index);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center">
      <Button variant="ghost" size="icon" onClick={togglePlay}>
        {isPlaying ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <Music className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="glass-card">
          {tracks.map((track, index) => (
            <DropdownMenuItem key={track.name} onClick={() => changeTrack(index)}>
              {track.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
