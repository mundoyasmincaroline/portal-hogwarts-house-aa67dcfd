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
        if (userHouse === 'gryffindor') color = 'rgba(239, 68, 68, 0.3)';
        else if (userHouse === 'slytherin') color = 'rgba(16, 185, 129, 0.3)';
        else if (userHouse === 'ravenclaw') color = 'rgba(59, 130, 246, 0.3)';
        else if (userHouse === 'hufflepuff') color = 'rgba(245, 158, 11, 0.3)';
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Time-based Color Filter */}
      <div className={`absolute inset-0 transition-colors duration-[5000ms] ${timeOverlay[time]}`} />
      
      {/* Background Texture based on Room */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{
        backgroundImage: `url('https://www.transparenttextures.com/patterns/carbon-fibre.png')`
      }} />

      {/* Dynamic Particles / Floating Elements */}
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
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* House Specific Visual Filters */}
      {userHouse === 'slytherin' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(5,150,105,0.05)_0%,_transparent_50%)]" />
      )}
      {userHouse === 'gryffindor' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(220,38,38,0.05)_0%,_transparent_50%)]" />
      )}
      {userHouse === 'ravenclaw' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.05)_0%,_transparent_50%)]" />
      )}
      {userHouse === 'hufflepuff' && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(217,119,6,0.05)_0%,_transparent_50%)]" />
      )}

      {/* Special Effects for Rooms */}
      {currentRoom === 'greathall' && (
        <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-50" />
      )}
      
      {currentRoom === 'dungeon' && (
        <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-emerald-950/20 to-transparent blur-3xl animate-pulse" />
      )}

      {currentRoom === 'vault' && (
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(234,179,8,0.05)_0%,_transparent_50%)]" />
      )}

      {/* Night Sky Stars */}
      {time === 'night' && (
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: '1px',
                height: '1px',
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
