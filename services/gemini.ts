
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Create a new GoogleGenAI instance right before making an API call as per guidelines
export const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function generateAIPlaylist(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Create a themed music playlist for: ${prompt}. Return a list of 8 fictional but realistic-sounding songs.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          songs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                album: { type: Type.STRING },
                duration: { type: Type.STRING },
                genre: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  try {
    // response.text is a property, not a method
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI playlist", e);
    return null;
  }
}

export async function generateDJTalk(songTitle: string, artist: string) {
  const ai = getAI();
  const prompt = `You are a cool, late-night radio DJ. Give a short, 15-word intro for the song "${songTitle}" by "${artist}". Make it sound professional and vibe-y.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
    },
  });

  // Extract the audio data from response parts
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  return null;
}

// Added missing generateTextStream as an async generator
export async function* generateTextStream(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContentStream({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  for await (const chunk of response) {
    // Access chunk.text property directly
    yield chunk.text || "";
  }
}

// Added missing generateImage using gemini-2.5-flash-image
export async function generateImage(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  // Iterate parts to find the image data
  const parts = response.candidates?.[0]?.content?.parts || [];
  for (const part of parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}

export function decodeBase64Audio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Added missing manual base64 encoding for raw PCM audio data
export function encodeAudioPCM(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  const bytes = new Uint8Array(int16.buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
