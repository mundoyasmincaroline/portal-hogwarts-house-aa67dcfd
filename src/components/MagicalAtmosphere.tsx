import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { type House } from '@/lib/store';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export default function MagicalAtmosphere() {
  const location = useLocation();
  const { profile } = useAuth();
  const [time, setTime] = useState<TimeOfDay>('day');
  const [particles, setParticles] = useState<Particle[]>([]);

  const userHouse = (profile?.house as House) || 'gryffindor';

  // 1. Detect Time of Day
  useEffect(() => {
    const updateTime = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 8) setTime('dawn');
      else if (hour >= 8 && hour < 17) setTime('day');
      else if (hour >= 17 && hour < 20) setTime('dusk');
      else setTime('night');
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // 2. Generate Particles based on Room
  const currentRoom = useMemo(() => {
    const path = location.pathname;
    if (path.includes('store') || path.includes('shop')) return 'vault';
    if (path.includes('album') || path.includes('guide')) return 'library';
    if (path.includes('azkaban') || path.includes('challenges')) return 'dungeon';
    if (path === '/dashboard') return 'greathall';
    return 'castle';
  }, [location.pathname]);

  useEffect(() => {
    const count = currentRoom === 'greathall' ? 12 : 25;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      let color = 'rgba(255, 255, 255, 0.2)';
      
      // Override color based on room or house
      if (currentRoom === 'vault') color = 'rgba(234, 179, 8, 0.4)';
      else if (currentRoom === 'dungeon') color = 'rgba(34, 197, 94, 0.2)';
      else if (currentRoom === 'library') color = 'rgba(147, 197, 253, 0.3)';
      else {
        // House based colors if in general rooms
        if (userHouse === 'gryffindor') color = 'rgba(239, 68, 68, 0.4)'; // Fiery Red
        else if (userHouse === 'slytherin') color = 'rgba(34, 197, 94, 0.3)'; // Emerald Mist
        else if (userHouse === 'ravenclaw') color = 'rgba(59, 130, 246, 0.4)'; // Sapphire Spark
        else if (userHouse === 'hufflepuff') color = 'rgba(234, 179, 8, 0.4)'; // Golden Dust
      }

      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * (currentRoom === 'greathall' ? 4 : 2) + 1,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5,
        color
      };
    });
    setParticles(newParticles);
  }, [currentRoom, userHouse]);

  // 3. Time-based Lighting Overlays
  const timeOverlay = {
    dawn: 'bg-gradient-to-br from-pink-500/5 via-orange-500/5 to-transparent',
    day: 'bg-transparent',
    dusk: 'bg-gradient-to-b from-orange-950/10 via-purple-900/5 to-transparent',
    night: 'bg-[radial-gradient(circle_at_top,_rgba(30,58,138,0.1)_0%,_transparent_70%)]'
  };

  return (
    <div className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none transition-all duration-1000 ${timeOverlay[time]}`}>
      {/* ── MAGICAL FLARES ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 blur-[150px] animate-pulse-glow rounded-full opacity-40" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[180px] animate-pulse-glow rounded-full opacity-30 delay-1000" />
      </div>

      {/* ── HOUSE AURAS (STRONGER) ── */}
      <div className={`absolute inset-0 opacity-60 mix-blend-screen transition-opacity duration-1000 ${
        userHouse === 'gryffindor' ? 'bg-[radial-gradient(circle_at_bottom_right,_rgba(220,38,38,0.2),transparent_70%)]' :
        userHouse === 'slytherin' ? 'bg-[radial-gradient(circle_at_bottom_left,_rgba(16,185,129,0.2),transparent_70%)]' :
        userHouse === 'ravenclaw' ? 'bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.2),transparent_70%)]' :
        'bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.2),transparent_70%)]'
      }`} />

      {/* ── SPECIAL EFFECTS BY ROOM ── */}
      {currentRoom === 'vault' && (
        <div className="absolute inset-0">
           <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,_rgba(234,179,8,0.1)_0%,_transparent_50%)]" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        </div>
      )}

      {currentRoom === 'dungeon' && (
        <div className="absolute inset-0 bg-black/40">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_70%,_rgba(16,185,129,0.1)_0%,_transparent_60%)]" />
           <div className="absolute inset-0 animate-lightning-flare opacity-20" />
        </div>
      )}

      {/* ── PARTICLES ── */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-float-slow"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      </div>
  );
}
