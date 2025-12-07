'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import GlassCard from '@/components/ui/GlassCard';

const quotes = [
  "Believe you can and you're halfway there.",
  "The future belongs to those who believe in the beauty of their dreams.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [lastMood, setLastMood] = useState<any>(null);
  const [quote] = useState(quotes[Math.floor(Math.random() * quotes.length)]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((docSnap) => {
        if (docSnap.exists()) {
          setUserName(docSnap.data().name || 'Student');
        }
      });

      const moodQuery = query(
        collection(db, 'moodEntries'),
        where('uid', '==', user.uid),
        limit(1)
      );
      getDocs(moodQuery).then((snapshot) => {
        if (!snapshot.empty) {
          setLastMood(snapshot.docs[0].data());
        }
      }).catch(() => { });
    }
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const getMoodEmoji = (mood: string) => {
    const emojis: any = {
      stressed: '😰',
      tired: '😴',
      motivated: '🔥',
      neutral: '😊',
    };
    return emojis[mood] || '😊';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Hey, {userName} 👋
        </h1>
        <p className="text-xl text-gray-400">Welcome back to your Student Companion</p>
      </div>

      {lastMood && (
        <GlassCard className="mb-12 border-l-4 border-l-neon-purple">
          <div className="flex items-center space-x-6">
            <span className="text-6xl drop-shadow-lg">{getMoodEmoji(lastMood.moodLabel)}</span>
            <div>
              <h3 className="text-2xl font-bold mb-1">You seem {lastMood.moodLabel} today</h3>
              <p className="text-gray-400 text-sm">Last checked: {new Date(lastMood.timestamp).toLocaleDateString()}</p>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="mb-12 bg-gradient-to-tr from-white/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/20 blur-[100px] rounded-full pointer-events-none" />
        <p className="text-2xl italic text-center font-light leading-relaxed text-gray-200">
          "{quote}"
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <GlassCard onClick={() => router.push('/companion?tab=questionnaire')} className="group">
          <div className="text-center py-4">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧠</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Take Mood Check</h3>
            <p className="text-gray-400">Track your mental wellness</p>
          </div>
        </GlassCard>

        <GlassCard onClick={() => router.push('/companion?tab=chatbot')} className="group">
          <div className="text-center py-4">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">💬</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Open Chatbot</h3>
            <p className="text-gray-400">Get instant help & guidance</p>
          </div>
        </GlassCard>

        <GlassCard onClick={() => router.push('/travel')} className="group">
          <div className="text-center py-4">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">✈️</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Plan Travel</h3>
            <p className="text-gray-400">Book flights & hotels</p>
          </div>
        </GlassCard>

        <GlassCard onClick={() => router.push('/academics')} className="group">
          <div className="text-center py-4">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📚</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Check Marks</h3>
            <p className="text-gray-400">View your academic progress</p>
          </div>
        </GlassCard>

        <GlassCard onClick={() => router.push('/internships')} className="group">
          <div className="text-center py-4">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">💼</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Find Internships</h3>
            <p className="text-gray-400">Explore opportunities</p>
          </div>
        </GlassCard>

        <GlassCard onClick={() => router.push('/events')} className="group">
          <div className="text-center py-4">
            <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📅</div>
            <h3 className="text-2xl font-bold mb-2 text-white">Browse Events</h3>
            <p className="text-gray-400">Discover campus events</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
