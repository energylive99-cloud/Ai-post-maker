
import React, { useState } from 'react';
import { analyzeImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import { LoadingSpinner } from './LoadingSpinner';
import { Eye, Upload, Image as ImageIcon } from 'lucide-react';

export const ImageAnalyzer: React.FC = () => {
    const [prompt, setPrompt] = useState<string>("Describe this image. If it contains a power generation setup, suggest how a PV Genset controller could be integrated.");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [analysis, setAnalysis] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile || !prompt) {
            setError('Please upload an image and provide a prompt.');
            return;
        }
        setLoading(true);
        setError('');
        setAnalysis('');

        try {
            const base64 = await fileToBase64(imageFile);
            const result = await analyzeImage(base64, imageFile.type, prompt);
            setAnalysis(result);
        } catch (err) {
            console.error(err);
            setError('Failed to analyze image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 bg-gray-800 rounded-lg shadow-xl max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-indigo-400">Image Analyzer</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Upload Image</label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="analyzer-file" className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600">
                                {imageUrl ? <img src={imageUrl} alt="preview" className="h-full w-full object-contain p-2" /> : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 mb-4 text-gray-400" />
                                        <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
                                    </div>
                                )}
                                <input id="analyzer-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                            </label>
                        </div> 
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Your Question</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="What do you want to know about the image?"
                            className="w-full h-28 p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Analysis Result</label>
                    <div className="w-full h-full p-4 bg-gray-700 border border-gray-600 rounded-md min-h-[200px] whitespace-pre-wrap">
                        {loading ? <div className="flex justify-center items-center h-full"><LoadingSpinner /></div> : (analysis || 'Analysis will appear here...')}
                    </div>
                </div>
            </div>
            
            <button onClick={handleAnalyze} disabled={loading || !imageFile} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 transition disabled:bg-gray-500 disabled:cursor-not-allowed">
                {loading ? <><LoadingSpinner /> Analyzing...</> : <><Eye className="w-5 h-5" /> Analyze Image</>}
            </button>

            {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
        </div>
    );
};
