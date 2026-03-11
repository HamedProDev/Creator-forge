import { GoogleGenAI, Type, Modality } from "@google/genai";

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("GEMINI_API_KEY is missing in the frontend environment.");
  }
  return new GoogleGenAI({ apiKey: key });
}

// For models that might require user-provided keys (like Pro Image)
function getProAI() {
  // The platform automatically injects the user's key into process.env.API_KEY if selected
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.error("No API key found for Pro features. Please select an API key.");
  }
  return new GoogleGenAI({ apiKey: key });
}

export async function generateTitlesAndDescriptions(topic: string, platform: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Generate 5 SEO-optimized, viral titles and descriptions for a ${platform} video about: ${topic}. Use current trends and search data. Return as a JSON array of objects with 'title' and 'description' properties.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error in generateTitlesAndDescriptions:", error);
    // Fallback if JSON parsing or API fails
    return [{ title: `Viral ${topic} Title`, description: `Engaging description for your ${platform} video about ${topic}.` }];
  }
}

export async function generateScript(topic: string, platform: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Write a short video script for ${platform} about: ${topic}. Include scene descriptions and dialogue. Use search data for accuracy.`,
      config: {
        systemInstruction: "You are a professional content creator scriptwriter.",
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error in generateScript:", error);
    return `[Scene 1: Introduction]\nHost: Welcome back! Today we're talking about ${topic}...\n\n[Scene 2: Main Content]\nHost: ${topic} is important because...`;
  }
}

export async function generateHashtags(topic: string) {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: `Suggest 15 trending hashtags for a video about: ${topic}. Return as a comma-separated list.`,
    });
    return response.text;
  } catch (error) {
    console.error("Error in generateHashtags:", error);
    return "#contentcreator, #trending, #viral, #creatorforge";
  }
}

export async function generateThumbnail(prompt: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high-quality, eye-catching YouTube thumbnail for: ${prompt}. Professional lighting, vibrant colors, minimalist design, high contrast.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateImage(prompt: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1") {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A professional, high-quality digital art piece of: ${prompt}. Modern aesthetic, cinematic lighting, detailed textures.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateProImage(prompt: string, size: "1K" | "2K" | "4K" = "1K", aspectRatio: "1:1" | "16:9" | "9:16" = "1:1") {
  const ai = getProAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        {
          text: `Ultra-high resolution, professional masterpiece of: ${prompt}. Hyper-realistic, cinematic masterpiece, 8k resolution, intricate details.`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
}

export async function generateSpeech(text: string, voice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' = 'Kore') {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read this content naturally: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/wav;base64,${base64Audio}`;
  }
  return null;
}
