
import { GoogleGenAI, GenerateContentResponse, Chat, Modality } from "@google/genai";
import { AspectRatio } from '../types';

let ai: GoogleGenAI;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const generatePostWithThinking = async (prompt: string): Promise<string> => {
    const ai = getAi();
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const editImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64ImageData,
                        mimeType: mimeType,
                    },
                },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
        }
    }
    throw new Error('No image found in edit response');
};

export const generateHashtags = async (postContent: string): Promise<string> => {
    const ai = getAi();
    const prompt = `Based on the following social media post, generate 5-7 relevant and trending hashtags. Return only the hashtags separated by spaces. Post: "${postContent}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-flash-lite-latest',
        contents: prompt
    });
    return response.text;
};

export const textToSpeech = async (text: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Read this post: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");
    return base64Audio;
};

export const factCheckWithSearch = async (content: string) => {
    const ai = getAi();
    const prompt = `Fact-check and enhance the following text using up-to-date information. Provide a revised version and cite your sources. Text: "${content}"`;
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    return {
        text: response.text,
        chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

export const findInstallersWithMaps = async (latitude: number, longitude: number) => {
    const ai = getAi();
    const prompt = "Find renewable energy or solar panel installers near my current location.";
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude,
                        longitude,
                    }
                }
            }
        },
    });
    return {
        text: response.text,
        chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
    };
};

export const analyzeImage = async (base64ImageData: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: base64ImageData, mimeType } },
                { text: prompt },
            ],
        },
    });
    return response.text;
};


// Chat Service
let chatInstance: Chat;
export const getChatInstance = (): Chat => {
    if (!chatInstance) {
        const ai = getAi();
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a helpful AI assistant specialized in content creation and marketing. Answer questions concisely and clearly.",
            }
        });
    }
    return chatInstance;
};

export const sendChatMessage = async (message: string): Promise<string> => {
    const chat = getChatInstance();
    const response = await chat.sendMessage({ message });
    return response.text;
};

// Video Service
const getVeoAi = () => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  // Veo needs its own instance to use the latest key from the selector dialog
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateVideo = async (prompt: string, aspectRatio: '16:9' | '9:16', image?: { base64: string; mimeType: string; }) => {
    const ai = getVeoAi();
    const imagePayload = image ? { image: { imageBytes: image.base64, mimeType: image.mimeType } } : {};
    
    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        ...imagePayload,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no URI.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await response.blob();
    return URL.createObjectURL(videoBlob);
};
