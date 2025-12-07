'use client';

import { useState } from 'react';
import { callLLM } from '@/lib/llm';
import { searchYouTube, getCareerQuery, getSkillQuery, getExamQuery, YouTubeVideo } from '@/lib/youtube';
import { searchNearbyPlaces, detectPlaceType, Place } from '@/lib/places';
import GlassCard from './ui/GlassCard';
import PrimaryButton from './ui/PrimaryButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  videos?: YouTubeVideo[];
  places?: Place[];
}

export default function Chatbot({ initialPrompt }: { initialPrompt?: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);

  const detectIntent = (query: string) => {
    const lower = query.toLowerCase();

    if (lower.includes('nearby') || lower.includes('near me')) {
      return 'places';
    }

    if (lower.includes('become') || lower.includes('career')) {
      return 'career';
    }

    if (lower.includes('skill') || lower.includes('learn')) {
      return 'skill';
    }

    if (lower.includes('jee') || lower.includes('gate') || lower.includes('cat') || lower.includes('exam')) {
      return 'exam';
    }

    return 'general';
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const intent = detectIntent(input);
      let response = '';
      let videos: YouTubeVideo[] = [];
      let places: Place[] = [];

      if (intent === 'places') {
        const placeType = detectPlaceType(input);
        if (placeType) {
          places = await searchNearbyPlaces(placeType);
          response = `Found ${places.length} ${placeType}s near you:`;
        } else {
          response = await callLLM(input);
        }
      } else if (intent === 'career') {
        const careerMatch = input.match(/become (?:a |an )?(\w+)/i);
        if (careerMatch) {
          const career = careerMatch[1];
          videos = await searchYouTube(getCareerQuery(career));
          response = `Here are some great resources to become a ${career}:`;
        } else {
          response = await callLLM(input);
        }
      } else if (intent === 'skill') {
        const skillMatch = input.match(/(?:learn|improve) (?:my )?(\w+)/i);
        if (skillMatch) {
          const skill = skillMatch[1];
          videos = await searchYouTube(getSkillQuery(skill));
          response = `Here are tutorials to improve your ${skill} skills:`;
        } else {
          response = await callLLM(input);
        }
      } else if (intent === 'exam') {
        videos = await searchYouTube(input);
        response = 'Here are some helpful exam preparation resources:';
      } else {
        response = await callLLM(input);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        videos: videos.length > 0 ? videos : undefined,
        places: places.length > 0 ? places : undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="h-[600px] flex flex-col">
      <h2 className="text-2xl font-bold mb-4">AI Companion Chat 💬</h2>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p>Ask me about careers, skills, exams, or nearby places!</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block p-3 rounded-2xl max-w-[80%] ${msg.role === 'user'
                ? 'bg-gradient-to-r from-neon-purple to-neon-pink text-white'
                : 'bg-white/10 border border-white/20'
                }`}
            >
              <div className="text-sm prose prose-invert max-w-none">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                      li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-bold text-neon-cyan" {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {msg.videos && msg.videos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.videos.map((video) => (
                    <a
                      key={video.id}
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <img src={video.thumbnail} alt={video.title} className="w-20 h-14 rounded object-cover" />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-semibold line-clamp-2">{video.title}</p>
                          <p className="text-xs text-gray-400">{video.channel}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {msg.places && msg.places.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.places.map((place, i) => (
                    <a
                      key={i}
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all text-left"
                    >
                      <p className="text-xs font-semibold">{place.name}</p>
                      <p className="text-xs text-gray-400">{place.type} • ⭐ {place.rating || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{place.address}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="text-left">
            <div className="inline-block p-3 rounded-2xl bg-white/10 border border-white/20">
              <p className="text-sm">Thinking...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask me anything..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-neon-purple focus:outline-none"
        />
        <PrimaryButton onClick={handleSend} disabled={loading}>
          Send
        </PrimaryButton>
      </div>
    </GlassCard>
  );
}
