
import React, { useState, useCallback } from 'react';
import { generatePostWithThinking, generateImage, editImage, generateHashtags, textToSpeech, factCheckWithSearch, findInstallersWithMaps } from '../services/geminiService';
import { AspectRatio, GroundingChunk } from '../types';
import { Bot, Image as ImageIcon, Volume2, Search, MapPin, Sparkles, Wand2, Mic } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { GroundingResults } from './GroundingResults';
import { useTranscription } from '../hooks/useTranscription';

const initialPrompt = "Create a compelling social media post about a 'PV Genset Controller'. Explain that it's a device that synchronizes solar and generator power to run simultaneously, drastically reducing fuel consumption. Highlight its key feature: an online monitoring dashboard for viewing real-time, per-second data. The tone should be professional yet exciting, targeting businesses looking to cut energy costs and improve sustainability.";

export const PostGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>(initialPrompt);
    const [post, setPost] = useState<string>('');
    const [image, setImage] = useState<string>('');
    const [hashtags, setHashtags] = useState<string>('');
    const [editPrompt, setEditPrompt] = useState<string>('');
    const [groundingResult, setGroundingResult] = useState<{ text: string; chunks: GroundingChunk[] } | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

    const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
    const [error, setError] = useState<string>('');

    const { isListening, transcript, startListening, stopListening } = useTranscription({
      onTranscript: (newTranscript) => setPrompt(newTranscript)
    });

    const handleGenerate = useCallback(async () => {
        setLoading({ all: true });
        setError('');
        setPost('');
        setImage('');
        setHashtags('');
        setGroundingResult(null);

        try {
            const postPromise = generatePostWithThinking(prompt);
            const imagePromise = generateImage(`High-tech, professional image representing a PV Genset Controller synchronizing solar panels and a generator, with a data dashboard visible. Clean, modern aesthetic.`, aspectRatio);

            const [generatedPost, generatedImage] = await Promise.all([postPromise, imagePromise]);
            
            setPost(generatedPost);
            setImage(generatedImage);

        } catch (err) {
            console.error(err);
            setError('Failed to generate content. Please check your API key and try again.');
        } finally {
            setLoading({ all: false });
        }
    }, [prompt, aspectRatio]);

    const handleAction = useCallback(async <T,>(action: () => Promise<T>, key: string, onSuccess: (result: T) => void) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        setError('');
        try {
            const result = await action();
            onSuccess(result);
        } catch (err) {
            console.error(err);
            setError(`Action '${key}' failed. Please try again.`);
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    }, []);

    const handleEditImage = async () => {
        if (!image || !editPrompt) return;
        const base64Data = image.split(',')[1];
        const mimeType = image.match(/data:(.*);base64,/)?.[1] || 'image/jpeg';
        await handleAction(() => editImage(base64Data, mimeType, editPrompt), 'edit', (newImage) => setImage(newImage));
    };

    const handleGetHashtags = () => handleAction(() => generateHashtags(post), 'hashtags', (newHashtags) => setHashtags(newHashtags));
    
    const handleTTS = async () => {
      await handleAction(() => textToSpeech(post), 'tts', (base64Audio) => {
        const audioSrc = `data:audio/webm;base64,${base64Audio}`;
        const audio = new Audio(audioSrc);
        audio.play().catch(e => setError("Audio playback failed. Please interact with the page first."));
      });
    };

    const handleFactCheck = () => handleAction(() => factCheckWithSearch(post), 'search', (result) => setGroundingResult(result));
    
    const handleFindInstallers = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                handleAction(
                    () => findInstallersWithMaps(position.coords.latitude, position.coords.longitude),
                    'maps',
                    (result) => setGroundingResult(result)
                );
            },
            () => setError("Unable to retrieve your location. Please enable location services.")
        );
    };

    const handleMicToggle = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Inputs */}
            <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold text-indigo-400">1. Content Prompt</h2>
                <div className="relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the post you want to create..."
                        className="w-full h-48 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        disabled={loading.all}
                    />
                    <button onClick={handleMicToggle} className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`} title={isListening ? 'Stop Listening' : 'Use Microphone'}>
                        <Mic className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full sm:w-1/2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Image Aspect Ratio</label>
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                          <option value="1:1">1:1 (Square)</option>
                          <option value="16:9">16:9 (Landscape)</option>
                          <option value="9:16">9:16 (Portrait)</option>
                          <option value="4:3">4:3</option>
                          <option value="3:4">3:4</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-1/2 self-end">
                      <button onClick={handleGenerate} disabled={loading.all} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                          {loading.all ? <><LoadingSpinner /> Generating...</> : <><Bot className="w-5 h-5" /> Generate Post</>}
                      </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Outputs */}
            <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-xl font-bold text-indigo-400">2. Generated Content</h2>
                {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
                
                <div className="bg-gray-700 p-4 rounded-md min-h-[150px] whitespace-pre-wrap">{post || "Your generated post will appear here..."}</div>
                
                <div className="bg-gray-700 rounded-md aspect-square flex items-center justify-center">
                    {loading.all ? <LoadingSpinner /> : (image ? <img src={image} alt="Generated" className="w-full h-full object-contain rounded-md" /> : <ImageIcon className="w-16 h-16 text-gray-500" />)}
                </div>

                {image && (
                    <div className="flex gap-2">
                        <input type="text" value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} placeholder="e.g., add a retro filter" className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                        <button onClick={handleEditImage} disabled={loading.edit} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition disabled:bg-gray-500">
                           {loading.edit ? <LoadingSpinner /> : <Wand2 className="w-5 h-5"/>} Refine
                        </button>
                    </div>
                )}
                
                {post && !loading.all && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 p-2 bg-gray-700 rounded-md">
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            <p className="flex-grow text-sm">{hashtags || "Click 'Suggest Hashtags' for ideas."}</p>
                            <button onClick={handleGetHashtags} disabled={loading.hashtags} className="bg-gray-600 text-xs px-3 py-1 rounded hover:bg-gray-500 disabled:bg-gray-500">{loading.hashtags ? '...' : 'Suggest Hashtags'}</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button onClick={handleTTS} disabled={loading.tts} className="action-button bg-blue-600 hover:bg-blue-700"><Volume2 className="w-5 h-5"/> {loading.tts ? '...' : 'Read Aloud'}</button>
                            <button onClick={handleFactCheck} disabled={loading.search} className="action-button bg-teal-600 hover:bg-teal-700"><Search className="w-5 h-5"/> {loading.search ? '...' : 'Fact-Check'}</button>
                            <button onClick={handleFindInstallers} disabled={loading.maps} className="action-button bg-orange-600 hover:bg-orange-700"><MapPin className="w-5 h-5"/> {loading.maps ? '...' : 'Find Installers'}</button>
                        </div>
                    </div>
                )}

                {groundingResult && <GroundingResults result={groundingResult} />}
            </div>
        </div>
    );
};
