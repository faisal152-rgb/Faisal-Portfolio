import axios from 'axios';

// We'll use process.env directly for simplicity.

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';

/**
 * Fetch models from NVIDIA catalog
 * @returns {Promise<Array>} List of models from NVIDIA
 */
export const fetchNVIDIAModels = async () => {
  try {
    const response = await axios.get(`${NVIDIA_BASE_URL}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Accept': 'application/json',
      },
    });
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching NVIDIA models:', error.response ? error.response.data : error.message);
    throw new Error('Failed to fetch NVIDIA models');
  }
};

/**
 * Normalize and categorize NVIDIA model data
 * @param {Array} rawModels Raw models from NVIDIA API
 * @returns {Object} Categorized models and counts
 */
export const categorizeNVIDIAModels = (rawModels) => {
  const categories = {
    LLM: [],
    VISION: [],
    STT: [],
    TTS: [],
  };

  rawModels.forEach(model => {
    const id = model.id || model.modelId || model.name;
    const name = model.name || model.id || 'Unknown';
    // Determine capabilities from the model object
    // NVIDIA model format may vary; we adapt to common fields
    const capability = model.capability || model.type || '';
    const description = (model.description || '').toLowerCase();

    // We'll check for keywords in capability and description
    let isLLM = false, isVision = false, isSTT = false, isTTS = false;

    if (capability.includes('chat') || capability.includes('completion') || capability.includes('llm') || description.includes('language model') || description.includes('chat')) {
      isLLM = true;
    }
    if (capability.includes('vision') || capability.includes('image') || description.includes('vision') || description.includes('image')) {
      isVision = true;
    }
    if (capability.includes('speech-to-text') || capability.includes('stt') || description.includes('speech to text') || description.includes('transcription')) {
      isSTT = true;
    }
    if (capability.includes('text-to-speech') || capability.includes('tts') || description.includes('text to speech') || description.includes('speech synthesis')) {
      isTTS = true;
    }

    // If none matched, default to LLM for safety (as per NVIDIA catalog mostly LLMs)
    if (!isLLM && !isVision && !isSTT && !isTTS) {
      isLLM = true;
    }

    const modelObj = {
      id,
      name,
      provider: 'nvidia',
      // We'll store the raw model for reference if needed
      _raw: model,
    };

    if (isLLM) categories.LLM.push(modelObj);
    if (isVision) categories.VISION.push(modelObj);
    if (isSTT) categories.STT.push(modelObj);
    if (isTTS) categories.TTS.push(modelObj);
  });

  // Compute counts
  const counts = {
    LLM: categories.LLM.length,
    VISION: categories.VISION.length,
    STT: categories.STT.length,
    TTS: categories.TTS.length,
  };

  return { categories, counts };
};

export default { fetchNVIDIAModels, categorizeNVIDIAModels };