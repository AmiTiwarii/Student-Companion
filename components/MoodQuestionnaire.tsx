'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import GlassCard from './ui/GlassCard';
import PrimaryButton from './ui/PrimaryButton';

const questions = [
  'How stressed do you feel today?',
  'How well did you sleep last night?',
  'How motivated are you to study?',
  'How anxious do you feel?',
  'How energetic do you feel?',
  'How satisfied are you with your progress?',
];

export default function MoodQuestionnaire() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(3));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSliderChange = (index: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const calculateMood = () => {
    const avg = answers.reduce((a, b) => a + b, 0) / answers.length;
    let label = 'neutral';
    let suggestions = [];

    if (avg <= 2) {
      label = 'stressed';
      suggestions = [
        'Take a 10-minute break',
        'Try deep breathing exercises',
        'Talk to a friend or counselor',
        'Get some fresh air',
      ];
    } else if (avg <= 3) {
      label = 'tired';
      suggestions = [
        'Get 7-8 hours of sleep tonight',
        'Take short power naps',
        'Stay hydrated',
        'Reduce screen time before bed',
      ];
    } else if (avg >= 4) {
      label = 'motivated';
      suggestions = [
        'Great! Use this energy to tackle your goals',
        'Break down tasks into smaller steps',
        'Celebrate small wins',
        'Help others who might need support',
      ];
    } else {
      suggestions = [
        'Maintain a balanced routine',
        'Set achievable daily goals',
        'Stay connected with friends',
        'Practice self-care',
      ];
    }

    return { score: avg, label, suggestions };
  };

  const handleSubmit = async () => {
    const moodResult = calculateMood();
    setResult(moodResult);
    setSubmitted(true);

    if (user) {
      await addDoc(collection(db, 'moodEntries'), {
        uid: user.uid,
        timestamp: new Date().toISOString(),
        answers,
        moodScore: moodResult.score,
        moodLabel: moodResult.label,
      });
    }
  };

  if (submitted && result) {
    return (
      <GlassCard>
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">
            {result.label === 'stressed' && '😰'}
            {result.label === 'tired' && '😴'}
            {result.label === 'motivated' && '🔥'}
            {result.label === 'neutral' && '😊'}
          </div>
          <h2 className="text-2xl font-bold mb-2">You're feeling {result.label}</h2>
          <p className="text-gray-300">Mood Score: {result.score.toFixed(1)}/5</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Suggestions for you:</h3>
          {result.suggestions.map((suggestion: string, i: number) => (
            <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm">✨ {suggestion}</p>
            </div>
          ))}
        </div>

        <PrimaryButton onClick={() => setSubmitted(false)} className="w-full mt-6">
          Take Another Check
        </PrimaryButton>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <h2 className="text-2xl font-bold mb-6">How are you feeling today?</h2>
      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={index}>
            <label className="block text-sm font-medium mb-2">{question}</label>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">Low</span>
              <input
                type="range"
                min="1"
                max="5"
                value={answers[index]}
                onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-xs text-gray-400">High</span>
              <span className="text-sm font-semibold w-8 text-center">{answers[index]}</span>
            </div>
          </div>
        ))}
      </div>
      <PrimaryButton onClick={handleSubmit} className="w-full mt-6">
        Submit
      </PrimaryButton>
    </GlassCard>
  );
}
