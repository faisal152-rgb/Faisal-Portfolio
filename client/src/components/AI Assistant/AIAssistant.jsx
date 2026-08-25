import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  PaperPlaneTilt,
  Microphone,
  Paperclip,
  Image as ImageIcon,
  Stop,
  Sparkle,
  Robot,
  Code,
  Trash,
  CaretDoubleDown,
} from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { RateLimitError } from "../../services/apiService";
import "./AIAssistant.css";


function buildGreeting() {
  return [
    {
      id: uid(),
      role: "assistant",
      type: "text",
      content: "Hi! I'm Faisal Abbas's AI Business Assistant. I can answer questions using verified information from the knowledge base. Ask me about services, projects, pricing, or schedule a meeting. I only share verified information - if something isn't in my knowledge base, I'll let you know.",
      ts: Date.now(),
    },
  ];
}

function formatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  return (b / (1024 * 1024)).toFixed(1) + " MB";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function getSpeechLanguage(language) {
  const locales = {
    English: "en-US", Urdu: "ur-PK", Spanish: "es-ES", French: "fr-FR",
    German: "de-DE", Chinese: "zh-CN", Japanese: "ja-JP", Russian: "ru-RU",
    Arabic: "ar-SA", Portuguese: "pt-PT", Hindi: "hi-IN", Bengali: "bn-BD",
  };
  return locales[language] || navigator.language || "en-US";
}

function Bubble(props) {
  var m = props.message;
  var isUser = m.role === "user";
  var avatar = null;
  if (!isUser) {
    avatar = (
      <div className="ai-msg-avatar">
        <Robot size={14} weight="fill" />
      </div>
    );
  }
  var body = null;
  if (m.type === "text" || m.type === "reschedule-confirm") {
    body = (
      <div>
        {m.type === "reschedule-confirm" && (
          <div className="ai-reschedule-badge">
            <span>✅ Meeting Rescheduled</span>
            {m.rescheduledMeeting && (
              <span className="ai-reschedule-detail">
                {m.rescheduledMeeting.preferredDate} at {m.rescheduledMeeting.preferredTime}
                {m.rescheduledMeeting.timezone ? ` (${m.rescheduledMeeting.timezone})` : ""}
              </span>
            )}
          </div>
        )}
        <p className="ai-msg-text">{m.content}</p>
      </div>
    );
  } else if (m.type === "file") {
    body = (
      <div className="ai-msg-file">
        <Paperclip size={16} weight="bold" />
        <div>
          {m.url ? (
            <a className="ai-msg-file-name" href={m.url} target="_blank" rel="noreferrer">
              {m.name}
            </a>
          ) : <p className="ai-msg-file-name">{m.name}</p>}
          <p className="ai-msg-file-meta">{formatBytes(m.size)}</p>
        </div>
      </div>
    );
  } else if (m.type === "image") {
    var nameEl = null;
    if (m.name) {
      nameEl = <p className="ai-msg-file-meta">{m.name}</p>;
    }
    body = (
      <div className="ai-msg-image">
        {m.src ? <img src={m.src} alt={m.name || "upload"} /> : null}
        {nameEl}
      </div>
    );
  }
  var wrapClass = "ai-msg" + (isUser ? " ai-msg-user" : " ai-msg-bot");
  return (
    <div className={wrapClass}>
      {avatar}
      <div className="ai-msg-bubble">{body}</div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState(buildGreeting());
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [typing, setTyping] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    assistantEnabled: true,
    chatEnabled: true,
    voiceEnabled: true,
    fileUploadEnabled: false,
    defaultMode: "Chat",
    language: "Auto Detect",
    emotionDetect: "Auto Detect",
    personas: [],
    models: [],
    knowledgeBase: [],
    loading: true,
  });
  const [chatLimited, setChatLimited] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  // Fetch AI settings on mount
  const fetchAiSettings = useCallback(async () => {
    try {
      const data = await dataService.getAISettingsPublic();
      if (data) {
        setAiSettings(prev => ({ ...prev, ...data, loading: false }));
      }
    } catch (err) {
      console.error('Failed to fetch AI settings:', err);
      setAiSettings(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchAiSettings();
  }, [fetchAiSettings]);

  // Subscribe to AI updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe('ai', (data) => {
      if (data.type === 'settings') {
        setAiSettings(prev => ({ ...prev, ...data.data }));
      } else if (data.type === 'personas') {
        setAiSettings(prev => ({ ...prev, personas: data.data }));
      } else if (data.type === 'models') {
        setAiSettings(prev => ({ ...prev, models: data.data }));
      } else if (data.type === 'knowledge') {
        setAiSettings(prev => ({ ...prev, knowledgeBase: data.data }));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(
    function () {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    },
    [messages, typing]
  );

  function appendMessage(msg) {
    setMessages(function (prev) {
      return prev.concat([Object.assign({ id: uid(), ts: Date.now() }, msg)]);
    });
  }

  function clearConversation() {
    setMessages(buildGreeting());
    setSessionId(null);
  }

  function scrollToTop() {
    var el = document.getElementById("top");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function sendToAI(text) {
    if (!aiSettings.assistantEnabled || !aiSettings.chatEnabled) {
      appendMessage({
        role: "assistant",
        type: "text",
        content: "AI Assistant is currently disabled. Please enable it from the admin panel.",
      });
      return;
    }

    // Prevent sending if chat is limited
    if (chatLimited) {
      return;
    }

    appendMessage({ role: "user", type: "text", content: text });
    setInput("");
    setTyping(true);

    try {
      // Call the backend AI workflow API
      const response = await dataService.chatWithAI(text, null, null, sessionId);
      setTyping(false);
      // If we get a successful response, the limit has reset
      setChatLimited(false);
      if (response?.sessionId) setSessionId(response.sessionId);
      appendMessage({
        role: "assistant",
        type: response?.meetingRescheduled ? "reschedule-confirm" : "text",
        content: response.response,
        rescheduledMeeting: response?.rescheduledMeeting || null,
      });
    } catch (err) {
      setTyping(false);
      console.error('AI response error:', err);
      
      // Check if error is a rate limit (429) — use RateLimitError class or fallback message parsing
      const isRateLimitError = err.isRateLimit === true || (
        (() => {
          const msg = (err.message || '').toLowerCase();
          return msg.includes('rate limit') || msg.includes('too many requests') ||
                 msg.includes('limit exceeded') || msg.includes('chat limit') ||
                 msg.includes('429') || msg.includes('quota exceeded');
        })()
      );
      
      if (isRateLimitError) {
        setChatLimited(true);
        appendMessage({
          role: "assistant",
          type: "text",
          content: "Chat limit reached (50 messages per 24 hours). Please try again later.",
        });
      } else {
        // For other errors, we don't change the chatLimited state
        appendMessage({
          role: "assistant",
          type: "text",
          content: "Sorry, I encountered an error. Please try again.",
        });
      }
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToAI(input.trim());
    }
  }

  function toggleVoice() {
    var SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      appendMessage({
        role: "assistant",
        type: "text",
        content:
          "Voice input isn't supported on this browser. Try Chrome on Android for speech-to-text.",
      });
      return;
    }
    if (listening) {
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch (err) {
        /* ignore */
      }
      setListening(false);
      return;
    }
    var recognition = new SpeechRecognition();
    recognition.lang = getSpeechLanguage(aiSettings.language);
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = function (e) {
      var transcript = "";
      for (var i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onend = function () {
      setListening(false);
    };
    recognition.onerror = function () {
      setListening(false);
    };

    recognitionRef.current = recognition;
    setListening(true);
    try {
      recognition.start();
    } catch (err) {
      setListening(false);
    }
  }

  async function uploadPickedFile(file, type) {
    if (file.size > 10 * 1024 * 1024) {
      appendMessage({ role: "assistant", type: "text", content: "Files must be 10 MB or smaller." });
      return;
    }

    // Prevent uploading if chat is limited
    if (chatLimited) {
      return;
    }

    setTyping(true);
    try {
      const uploaded = await dataService.uploadAIAttachment(file);
      appendMessage({
        role: "user",
        type,
        src: uploaded.url,
        url: uploaded.url,
        name: uploaded.name,
        size: uploaded.size,
        mime: uploaded.mime,
      });
      const response = type === "image" && uploaded.imageData
        ? await dataService.analyzeAIImage(uploaded.imageData, uploaded.name)
        : await dataService.chatWithAI(
          `The user uploaded a file named "${uploaded.name}" (${uploaded.mime}, ${formatBytes(uploaded.size)}). Attachment URL: ${uploaded.url}. ${uploaded.extractedText ? `Here is the extracted PDF text:\\n${uploaded.extractedText}\\n\\nSummarize the document and mention its important details.` : "Acknowledge the upload and ask what the user would like you to do with it."}`,
          undefined,
          undefined,
          sessionId
        );
      if (response?.sessionId) setSessionId(response.sessionId);
      // If we get a successful response, the limit has reset
      setChatLimited(false);
      appendMessage({
        role: "assistant",
        type: "text",
        content: response?.response || response?.message || "Your attachment was uploaded successfully. What would you like me to do with it?",
      });
    } catch (err) {
      console.error('Attachment upload error:', err);
      
      // Check if error is a rate limit (429) — use RateLimitError class or fallback message parsing
      const isRateLimitError = err.isRateLimit === true || (
        (() => {
          const msg = (err.message || '').toLowerCase();
          return msg.includes('rate limit') || msg.includes('too many requests') ||
                 msg.includes('limit exceeded') || msg.includes('chat limit') ||
                 msg.includes('429') || msg.includes('quota exceeded');
        })()
      );
      
      if (isRateLimitError) {
        setChatLimited(true);
        appendMessage({
          role: "assistant",
          type: "text",
          content: "Chat limit reached (50 messages per 24 hours). Please try again later.",
        });
      } else {
        // For other errors, we don't change the chatLimited state
        appendMessage({
          role: "assistant",
          type: "text",
          content: err.message || "The upload failed. Please try again.",
        });
      }
    } finally {
      setTyping(false);
    }
  }

  function handleFilePick(e) {
    if (!aiSettings.fileUploadEnabled) {
      appendMessage({
        role: "assistant",
        type: "text",
        content: "File upload is currently disabled. Please enable it from the admin panel.",
      });
      return;
    }
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = "";
    uploadPickedFile(file, "file");
  }

  function handleImagePick(e) {
    if (!aiSettings.fileUploadEnabled) {
      appendMessage({
        role: "assistant",
        type: "text",
        content: "Image upload is currently disabled. Please enable it from the admin panel.",
      });
      return;
    }
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    e.target.value = "";
    uploadPickedFile(file, "image");
  }

  var messageList = messages.map(function (m) {
    return <Bubble key={m.id} message={m} />;
  });

  var typingEl = null;
  if (typing) {
    typingEl = (
      <div className="ai-msg ai-msg-bot">
        <div className="ai-msg-avatar">
          <Robot size={14} weight="fill" />
        </div>
        <div className="ai-msg-bubble ai-typing">
          <span className="ai-dot" />
          <span className="ai-dot" />
          <span className="ai-dot" />
        </div>
      </div>
    );
  }

  var voiceBtnClass =
    "ai-tool-btn" + (listening ? " ai-tool-btn-active" : "");

  var voiceIcon = listening ? (
    <Stop size={18} weight="fill" />
  ) : (
    <Microphone size={18} weight="bold" />
  );

  var inputPlaceholder = chatLimited
    ? "Chat limit reached — cannot send messages"
    : listening
    ? "Listening... speak now"
    : "Type message...";


  if (aiSettings.loading) {
    return (
      <section
        id="ai-assistant"
        className="ai-assistant-section scroll-mt-20"
        aria-label="AI Business Assistant"
      >
        <div className="ai-assistant-container opacity-60">
          <div className="ai-header">
            <div className="ai-header-left">
              <div className="ai-avatar">
                <Robot size={20} weight="duotone" />
              </div>
              <div>
                <h3 className="ai-title">
                  <Code size={14} weight="bold" /> AI BUSINESS ASSISTANT
                  <Sparkle size={12} weight="fill" className="ai-title-spark" />
                </h3>
                <p className="ai-subtitle">Loading...</p>
              </div>
            </div>
          </div>
          <div className="ai-messages">
            <div className="skeleton skeleton-card" style={{ height: '300px' }} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="ai-assistant"
      className="ai-assistant-section scroll-mt-20"
      aria-label="AI Business Assistant"
    >
      <div className="ai-assistant-container">
        {/* ---------- Header ---------- */}
        <div className="ai-header">
          <div className="ai-header-left">
            <div className="ai-avatar">
              <Robot size={20} weight="duotone" />
            </div>
            <div>
              <h3 className="ai-title">
                <Code size={14} weight="bold" /> AI BUSINESS ASSISTANT
                <Sparkle size={12} weight="fill" className="ai-title-spark" />
              </h3>
              <p className="ai-subtitle">
                {aiSettings.assistantEnabled ? 'Online' : 'Offline'} •
                {aiSettings.voiceEnabled ? 'Voice Enabled' : 'Voice Disabled'} •
                {aiSettings.fileUploadEnabled ? 'Files Enabled' : 'Files Disabled'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="ai-delete"
            onClick={clearConversation}
            aria-label="Delete conversation"
            title="Delete conversation"
          >
            <Trash size={16} weight="bold" />
            <span className="ai-delete-label">Delete</span>
          </button>
        </div>

        {/* ---------- Messages ---------- */}
        <div className="ai-messages" ref={scrollRef}>
          {messageList}
          {typingEl}
        </div>

        {/* ---------- Chat Limit Banner (below messages, above composer) ---------- */}
        {chatLimited && (
          <div className="ai-chat-limit-banner" role="alert" aria-live="assertive">
            🚫 Chat limit reached (50 messages per 24 hours). Please try again later.
          </div>
        )}

        {/* ---------- Composer ---------- */}
        <div className="ai-composer">
          <button
            type="button"
            className="ai-tool-btn"
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            aria-label="Attach file"
            title="Attach file"
            disabled={!aiSettings.fileUploadEnabled || chatLimited}
            style={{ opacity: (aiSettings.fileUploadEnabled && !chatLimited) ? 1 : 0.5 }}
          >
            <Paperclip size={18} weight="bold" />
          </button>
          <button
            type="button"
            className="ai-tool-btn"
            onClick={() => {
              if (imageInputRef.current) imageInputRef.current.click();
            }}
            aria-label="Upload image"
            title="Upload image"
            disabled={!aiSettings.fileUploadEnabled || chatLimited}
            style={{ opacity: (aiSettings.fileUploadEnabled && !chatLimited) ? 1 : 0.5 }}
          >
            <ImageIcon size={18} weight="bold" />
          </button>

          <textarea
            className="ai-input"
            placeholder={inputPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message input"
            disabled={!aiSettings.chatEnabled || chatLimited}
          />

          <button
            type="button"
            className={voiceBtnClass}
            onClick={toggleVoice}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
            title={listening ? "Stop voice input" : "Voice input"}
            disabled={!aiSettings.voiceEnabled || chatLimited}
            style={{ opacity: (aiSettings.voiceEnabled && !chatLimited) ? 1 : 0.5 }}
          >
            {voiceIcon}
          </button>

          <button
            type="button"
            className="ai-send"
            onClick={() => sendToAI(input.trim())}
            disabled={!input.trim() || !aiSettings.chatEnabled || chatLimited}
            aria-label={chatLimited ? "Cannot send — chat limit reached" : "Send message"}
            title={chatLimited ? "Chat limit reached (50 messages per 24 hours)" : "Send"}
          >
            <PaperPlaneTilt size={18} weight="fill" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFilePick}
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImagePick}
          />
        </div>

        {/* ---------- Section navigation trigger ---------- */}
        <div className="ai-scroll-trigger">
          <button
            type="button"
            onClick={scrollToTop}
            className="ai-scroll-btn"
            aria-label="Scroll back up to the Freelance Project section"
          >
            <span className="ai-scroll-label">Scroll up to explore more</span>
            <CaretDoubleDown
              size={16}
              weight="bold"
              className="ai-scroll-arrow ai-scroll-arrow-up"
            />
          </button>
        </div>
      </div>
    </section>
  );
}