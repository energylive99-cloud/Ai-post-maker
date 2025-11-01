
import React, { useState, useEffect, useCallback } from 'react';
import { generateVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingSpinner } from './LoadingSpinner';
import { Film, Upload, Key } from 'lucide-react';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    }
  }
}

const ApiKeySelector: React.FC<{ onKeySelected: () => void }> = ({ onKeySelected }) => {
    return (
        <div className="text-center p-8 bg-gray-800 rounded-lg border border-indigo-500/50">
            <Key className="w-12 h-12 mx-auto text-indigo-400 mb-4" />
            <h3 className="text-xl font-bold mb-2">API Key Required for VEO</h3>
            <p className="text-gray-400 mb-6">
                Video generation with VEO requires you to select your own API key.
                This allows you to manage your usage and billing directly.
            </p>
            <button
                onClick={async () => {
                    await window.aistudio.openSelectKey();
                    onKeySelected(); // Assume success to avoid race conditions
                }}
                className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-md hover:bg-indigo-700 transition"
            >
                Select API Key
            </button>
            <p className="text-xs text-gray-500 mt-4">
                For more info, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">billing documentation</a>.
            </p>
        </div>
    );
};

export const VideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A neon hologram of a cat driving at top speed');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
    const [duration, setDuration] = useState<number>(5);
    const [fps, setFps] = useState<number>(24);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [checkingKey, setCheckingKey] = useState<boolean>(true);

    const checkApiKey = useCallback(async () => {
        setCheckingKey(true);
        try {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const keyStatus = await window.aistudio.hasSelectedApiKey();
                setHasApiKey(keyStatus);
            } else {
                 setHasApiKey(false); // Fallback if aistudio is not available
            }
        } catch (e) {
            console.error("Error checking API key:", e);
            setHasApiKey(false);
        } finally {
            setCheckingKey(false);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);

    const handleGenerateVideo = async () => {
        setLoading(true);
        setError('');
        setVideoUrl('');
        try {
            let imagePayload: { base64: string; mimeType: string; } | undefined = undefined;
            if (imageFile) {
                const base64 = await fileToBase64(imageFile);
                imagePayload = { base64, mimeType: imageFile.type };
            }
            const enhancedPrompt = `${prompt}. The video should be ${duration} seconds long and run at ${fps} frames per second.`;
            const url = await generateVideo(enhancedPrompt, aspectRatio, imagePayload);
            setVideoUrl(url);
        } catch (err: any) {
            console.error(err);
             if (err.message && err.message.includes("Requested entity was not found.")) {
                setError("API Key not found. Please re-select your key.");
                setHasApiKey(false); // Reset key state
            } else {
                setError('Failed to generate video. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (checkingKey) {
        return <div className="flex justify-center items-center p-8"><LoadingSpinner /></div>;
    }

    if (!hasApiKey) {
        return <ApiKeySelector onKeySelected={() => { setHasApiKey(true); checkApiKey(); }} />;
    }

    return (
        <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-indigo-400">VEO Video Generation</h2>
            
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to create..."
                className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Optional Starting Image</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-4 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
                                {imageFile ? <p className="text-xs text-green-400">{imageFile.name}</p> : <p className="text-xs text-gray-500">PNG, JPG, etc.</p>}
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" onChange={e => e.target.files && setImageFile(e.target.files[0])} accept="image/*" />
                        </label>
                    </div> 
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                        <option value="16:9">16:9 (Landscape)</option>
                        <option value="9:16">9:16 (Portrait)</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">Duration ({duration}s)</label>
                    <input
                        id="duration"
                        type="range"
                        min="1"
                        max="15"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Frame Rate (FPS)</label>
                    <select value={fps} onChange={(e) => setFps(Number(e.target.value))} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none" disabled={loading}>
                        <option value="24">24 fps (Cinematic)</option>
                        <option value="30">30 fps (Standard)</option>
                        <option value="60">60 fps (Smooth)</option>
                    </select>
                </div>
            </div>
            
            <button onClick={handleGenerateVideo} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                {loading ? <><LoadingSpinner /> Generating Video...</> : <><Film className="w-5 h-5" /> Generate</>}
            </button>

            {loading && <p className="text-center text-indigo-300">Video generation can take a few minutes. Please be patient.</p>}
            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}

            {videoUrl && (
                <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Your Video:</h3>
                    <video src={videoUrl} controls autoPlay muted loop className="w-full rounded-lg shadow-lg" />
                </div>
            )}
        </div>
    );
};
