import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from "react";
import {
  PaperPlaneTilt,
  Microphone,
  Paperclip,
  FileText,
  DownloadSimple,
  Image as ImageIcon,
  Stop,
  Robot,
  Trash,
  CaretLeft,
  Info,
  Clock,
  Check,
  Checks,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { dataService } from "../../services/DataService";
import { socketService } from "../../services/SocketService";
import { assistantConversationStore } from "../../services/assistantConversationStore";
import { RateLimitError } from "../../services/apiService";
import "./PhoneAIChat.css";


function buildGreeting(name = "AI Assistant") {
  return [
    {
      id: uid(),
      role: "assistant",
      type: "text",
      content: `Hi! I'm ${name}. Ask me anything.`,
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

function formatMessageTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(timestamp));
}

function getAttachmentUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : url;
}

function getFileExtension(name) {
  return String(name || "file").split(".").pop().toUpperCase();
}

function MessageStatus({ status, retry }) {
  if (status === "sending") return <Clock size={10} weight="bold" aria-label="Sending" />;
  if (status === "seen") return <Checks size={11} weight="bold" className="phone-msg-seen" aria-label="Seen" />;
  if (status === "delivered") return <Checks size={11} weight="bold" aria-label="Delivered" />;
  if (status === "failed") return <button type="button" className="phone-msg-retry" onClick={retry} aria-label="Retry sending message" title="Retry"><ArrowClockwise size={11} weight="bold" /></button>;
  return <Check size={10} weight="bold" aria-label="Sent" />;
}

function PhoneBubble(props) {
  var m = props.message;
  var onRetry = props.onRetry;
  var isUser = m.role === "user";
  var body = null;
  if (m.type === "text") {
    body = <p className="phone-msg-text">{m.content}</p>;
  } else if (m.type === "file") {
    body = (
      <div className="phone-msg-file">
        <div className="phone-msg-file-icon"><FileText size={18} weight="duotone" /></div>
        <div className="phone-msg-file-details">
          <p className="phone-msg-file-name">{m.name || "Document"}</p>
          <p className="phone-msg-file-meta">{getFileExtension(m.name)} · {formatBytes(m.size || 0)}</p>
        </div>
        {m.url && (
          <a
            className="phone-msg-file-download"
            href={getAttachmentUrl(m.url)}
            target="_blank"
            rel="noreferrer"
            download={m.name || true}
            aria-label={`Open ${m.name || "document"}`}
            title="Open document"
          >
            <DownloadSimple size={14} weight="bold" />
          </a>
        )}
      </div>
    );
  } else if (m.type === "image") {
    var imageUrl = getAttachmentUrl(m.src || m.url);
    body = (
      <div className="phone-msg-image">
        {imageUrl ? (
          <a href={imageUrl} target="_blank" rel="noreferrer" title="Open image">
            <img src={imageUrl} alt={m.name || "Uploaded image"} />
          </a>
        ) : null}
        <div className="phone-msg-image-caption">
          <span>{m.name || "Image"}</span>
          <span>{formatBytes(m.size || 0)}</span>
        </div>
      </div>
    );
  }
  return (
    <div className={"phone-msg " + (isUser ? "phone-msg-user" : "phone-msg-bot")}>
      <div className="phone-msg-bubble">
        {body}
        <div className="phone-msg-meta">
          <span>{formatMessageTime(m.ts)}</span>
          {isUser && <MessageStatus status={m.status} retry={() => onRetry(m)} />}
        </div>
      </div>
    </div>
  );
}

export default function PhoneAIChat(props) {
  var onBack = props.onBack;
  var phoneVoiceEnabled = false;

  const conversation = useSyncExternalStore(
    assistantConversationStore.subscribe,
    assistantConversationStore.getSnapshot,
    assistantConversationStore.getSnapshot
  );
  const messages = conversation.messages || buildGreeting();
  const sessionId = conversation.sessionId;
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
    assistantName: "AI Assistant",
    assistantSubtitle: "",
    workingHours: "12:00 AM - 11:59 PM",
    statusText: "Online",
    availability: "Available now",
    personas: [],
    loading: true,
  });
  const [error, setError] = useState(null);
  const [chatLimited, setChatLimited] = useState(false);
  const [showLimitToast, setShowLimitToast] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const toastTimerRef = useRef(null);

  // Auto-dismiss toast after 2 seconds
  useEffect(() => {
    if (showLimitToast) {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowLimitToast(false), 2000);
    }
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, [showLimitToast]);

  // Helper: mark as limited and show toast
  function triggerRateLimit() {
    setChatLimited(true);
    setShowLimitToast(true);
  }

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversation.messages) {
      assistantConversationStore.update({ messages: buildGreeting() });
    }
  }, [conversation.messages]);

  // Fetch AI settings on mount
  const fetchAiSettings = useCallback(async () => {
    try {
      const data = await dataService.getAISettingsPublic();
      if (data) {
        setAiSettings(prev => ({ ...prev, ...data, loading: false }));
      }
    } catch (err) {
      console.error('Failed to fetch AI settings:', err);
      // If not authorized (401), use default settings and continue
      if (err.message && err.message.includes('401')) {
        console.log('AI settings require authentication, using defaults');
      }
      setAiSettings(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchAiSettings();
  }, [fetchAiSettings]);

  useEffect(() => {
    socketService.connect(null).catch(() => {
      // HTTP chat remains available when real-time status is unavailable.
    });
  }, []);

  // Subscribe to AI updates
  useEffect(() => {
    const unsubscribe = dataService.subscribe('ai', (data) => {
      if (data.type === 'settings') {
        setAiSettings(prev => ({ ...prev, ...data.data }));
      } else if (data.type === 'personas') {
        setAiSettings(prev => ({ ...prev, personas: data.data }));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = dataService.subscribe('ai-message-status', (data) => {
      if (data?.messageId && data.status === 'delivered') {
        updateMessage(data.messageId, { status: 'delivered', ts: data.sentAt || Date.now() });
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
    const message = Object.assign({ id: uid(), ts: Date.now() }, msg);
    const previousMessages = assistantConversationStore.getSnapshot().messages || [];
    assistantConversationStore.update({ messages: previousMessages.concat([message]) });
    return message.id;
  }

  function updateMessage(id, changes) {
    const previousMessages = assistantConversationStore.getSnapshot().messages || [];
    assistantConversationStore.update({
      messages: previousMessages.map(message => message.id === id ? { ...message, ...changes } : message),
    });
  }

  function clearConversation() {
    assistantConversationStore.reset(buildGreeting(aiSettings.assistantName || "AI Assistant"));
  }

  async function sendToAI(text, existingMessageId = null) {
    if (!aiSettings.assistantEnabled || !aiSettings.chatEnabled) {
      appendMessage({
        role: "assistant",
        type: "text",
        content: "AI Assistant is currently disabled. Please enable it from the admin panel.",
      });
      return;
    }

    // Prevent sending if chat is limited
    if (chatLimited) return;

    var t = (text || "").trim();
    if (!t) return;

    const messageId = existingMessageId || appendMessage({ role: "user", type: "text", content: t, status: "sending" });
    setInput("");
    setTyping(true);

    try {
      const response = await dataService.chatWithAI(t, undefined, undefined, sessionId, messageId);
      console.log('AI Response received:', response);
      setTyping(false);
      // Successful response means limit has reset
      setChatLimited(false);
      updateMessage(messageId, { status: "seen", ts: response?.sentAt || Date.now() });
      if (response?.sessionId) {
        assistantConversationStore.update({ sessionId: response.sessionId });
      }
      
      // Handle response structure
      const aiMessage = response?.response || response?.message || JSON.stringify(response);
      appendMessage({
        role: "assistant",
        type: "text",
        content: aiMessage,
      });
    } catch (err) {
      setTyping(false);
      console.error('AI response error:', err);

      // Detect rate-limit error
      const isRateLimitError = err.isRateLimit === true || (
        (() => {
          const msg = (err.message || '').toLowerCase();
          return msg.includes('rate limit') || msg.includes('too many requests') ||
                 msg.includes('limit exceeded') || msg.includes('chat limit') ||
                 msg.includes('429') || msg.includes('quota exceeded');
        })()
      );

      if (isRateLimitError) {
        triggerRateLimit();
        updateMessage(messageId, { status: "failed" });
        appendMessage({
          role: "assistant",
          type: "text",
          content: "Chat limit reached. Please try again later.",
        });
      } else {
        updateMessage(messageId, { status: "failed" });
        appendMessage({
          role: "assistant",
          type: "text",
          content: "Sorry, I encountered an error. Please try again.",
        });
      }
    }
  }

  function retryMessage(message) {
    if (message?.content) {
      updateMessage(message.id, { status: "sending", ts: Date.now() });
      sendToAI(message.content, message.id);
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
        content: "Voice not supported here. Try Chrome.",
      });
      return;
    }
    if (listening) {
      try {
        if (recognitionRef.current) recognitionRef.current.stop();
      } catch (err) {}
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
    recognition.onend = function () { setListening(false); };
    recognition.onerror = function () { setListening(false); };
    recognitionRef.current = recognition;
    setListening(true);
    try { recognition.start(); } catch (err) { setListening(false); }
  }

  async function uploadPickedFile(file, type) {
    if (file.size > 10 * 1024 * 1024) {
      appendMessage({ role: "assistant", type: "text", content: "Files must be 10 MB or smaller." });
      return;
    }

    // Prevent uploading if chat is limited
    if (chatLimited) return;

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
            `The user uploaded a file named "${uploaded.name}" (${uploaded.mime}, ${formatBytes(uploaded.size)}). Attachment URL: ${uploaded.url}. ${uploaded.extractedText ? `Here is the extracted PDF text:\n${uploaded.extractedText}\n\nSummarize the document and mention its important details.` : "Acknowledge the upload and ask what the user would like you to do with it."}`,
            undefined,
            undefined,
            sessionId
          );
      if (response?.sessionId) {
        assistantConversationStore.update({ sessionId: response.sessionId });
      }
      // Successful upload — limit has reset
      setChatLimited(false);
      appendMessage({
        role: "assistant",
        type: "text",
        content: response?.response || response?.message || "Your attachment was uploaded successfully. What would you like me to do with it?",
      });
    } catch (err) {
      console.error('Attachment upload error:', err);

      // Detect rate-limit error
      const isRateLimitError = err.isRateLimit === true || (
        (() => {
          const msg = (err.message || '').toLowerCase();
          return msg.includes('rate limit') || msg.includes('too many requests') ||
                 msg.includes('limit exceeded') || msg.includes('chat limit') ||
                 msg.includes('429') || msg.includes('quota exceeded');
        })()
      );

      if (isRateLimitError) {
        triggerRateLimit();
        appendMessage({
          role: "assistant",
          type: "text",
          content: "Chat limit reached. Please try again later.",
        });
      } else {
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

  function timeToMinutes(value) {
    if (!value) return null;
    const match = String(value).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'AM' && hours === 12) hours = 0;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    return hours * 60 + minutes;
  }

  function normalizeWorkingHours(value) {
    if (!value) return null;

    const rawText = String(value).trim();
    const match = rawText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (match) {
      return `${match[1].trim()} - ${match[2].trim()}`;
    }

    const lower = rawText.toLowerCase();
    if (lower.includes('night') && lower.includes('day')) {
      return '12:00 AM - 11:59 AM';
    }
    if (lower.includes('day') && lower.includes('night')) {
      return '12:00 PM - 11:59 PM';
    }
    if (lower.includes('night')) {
      return '12:00 AM - 11:59 AM';
    }
    if (lower.includes('day')) {
      return '12:00 PM - 11:59 PM';
    }

    return rawText;
  }

  function isWithinWorkingHours(value, now = new Date()) {
    const normalizedHours = normalizeWorkingHours(value);
    if (!normalizedHours) return true;

    const rangeMatch = normalizedHours.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*[-–to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (!rangeMatch) return true;

    const startMinutes = timeToMinutes(rangeMatch[1]);
    const endMinutes = timeToMinutes(rangeMatch[2]);
    if (startMinutes === null || endMinutes === null) return true;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  const activePersonas = (aiSettings.personas || []).filter(p => p.isActive);
  const activePersona = (() => {
    if (!activePersonas.length) return null;

    const matchingByTime = activePersonas.filter(p => isWithinWorkingHours(normalizeWorkingHours(p.timeSetting) || p.timeSetting || aiSettings.workingHours));
    if (matchingByTime.length) {
      return matchingByTime.find(p => p.isDefault) || matchingByTime[0];
    }

    return activePersonas.find(p => p.isDefault) || activePersonas[0];
  })();
  const activePersonaWorkingHours = normalizeWorkingHours(activePersona?.timeSetting || aiSettings.workingHours);
  const isPersonaOnShift = isWithinWorkingHours(activePersonaWorkingHours || aiSettings.workingHours);
  const assistantDisplayName = activePersona?.name || aiSettings.assistantName || "AI Assistant";
  const assistantAvatarUrl = activePersona?.avatar || null;
  const assistantStatus = aiSettings.statusText || (aiSettings.assistantEnabled ? (isPersonaOnShift ? 'Online' : 'Offline') : 'Offline');
  const rawAssistantSubtitle = (aiSettings.assistantSubtitle || '').replace(/^•\s*/, '').trim();
  const defaultAssistantSubtitle = 'Online';

  const assistantSubtitle = (() => {
    const hasCustomSubtitle = rawAssistantSubtitle && rawAssistantSubtitle !== defaultAssistantSubtitle;
    const statusLabel = assistantStatus || 'Online';

    return hasCustomSubtitle ? rawAssistantSubtitle : statusLabel;
  })();

  useEffect(() => {
    const currentMessages = assistantConversationStore.getSnapshot().messages || messages;
    if (!currentMessages.length) {
      assistantConversationStore.update({ messages: buildGreeting(assistantDisplayName) });
      return;
    }
    const first = currentMessages[0];
    if (first.role !== 'assistant' || !first.content || !first.content.startsWith('Hi! I\'m ')) {
      return;
    }
    assistantConversationStore.update({ messages: [{ ...first, content: `Hi! I'm ${assistantDisplayName} AI Business Assistant. Feel free to ask me anything.` }, ...currentMessages.slice(1)] });
  }, [assistantDisplayName]);

  var messageList = messages.map(function (m) {
    return <PhoneBubble key={m.id} message={m} onRetry={retryMessage} />;
  });

  var typingEl = null;
  if (typing) {
    typingEl = (
      <div className="phone-msg phone-msg-bot">
        <div className="phone-msg-bubble phone-typing">
          <span className="phone-dot" />
          <span className="phone-dot" />
          <span className="phone-dot" />
          <span className="phone-typing-label">Thinking...</span>
      </div>
    </div>
    );
  }

  var voiceBtnClass = "phone-tool-btn" + (listening ? " phone-tool-btn-active" : "");
  var voiceIcon = listening ? (
    <Stop size={14} weight="fill" />
  ) : (
    <Microphone size={14} weight="bold" />
  );
  var placeholder = chatLimited
    ? "Type Message..."
    : listening
      ? "Listening..."
      : "Type message...";


  function handleBack() {
    if (onBack) onBack();
  }

  if (aiSettings.loading) {
    return (
      <div className="phone-ai-chat opacity-60">
        <div className="phone-ai-header">
          <button type="button" className="phone-ai-back" onClick={handleBack} aria-label="Back">
            <CaretLeft size={16} weight="bold" />
          </button>
          <div className="phone-ai-avatar"><Robot size={14} weight="duotone" /></div>
          <div className="phone-ai-title-wrap">
            <p className="phone-ai-title">{assistantDisplayName}</p>
            <p className="phone-ai-sub">Loading...</p>
          </div>
        </div>
        <div className="phone-ai-messages">
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="phone-ai-chat">
      {/* iPhone-style chat header */}
      <div className="phone-ai-header">
        <button
          type="button"
          className="phone-ai-back"
          onClick={handleBack}
          aria-label="Back to Freelance Projects"
          title="Back"
        >
          <CaretLeft size={16} weight="bold" />
        </button>

        <div className="phone-ai-avatar">
          {assistantAvatarUrl ? (
            <img src={assistantAvatarUrl} alt={assistantDisplayName} className="phone-ai-avatar-image" />
          ) : (
            <Robot size={14} weight="duotone" />
          )}
        </div>

        <div className="phone-ai-title-wrap">
          <p className="phone-ai-title">{assistantDisplayName}</p>
          <p className="phone-ai-sub">{typing ? "Thinking..." : assistantSubtitle}</p>
        </div>

        <div className="phone-ai-header-actions">
          <button
            type="button"
            className="phone-ai-action"
            onClick={clearConversation}
            aria-label="Delete conversation"
            title="Delete conversation"
          >
            <Trash size={12} weight="bold" />
          </button>
          <button
            type="button"
            className="phone-ai-action"
            onClick={() => setShowInfo((visible) => !visible)}
            aria-label="Info"
            title="Info"
            aria-expanded={showInfo}
          >
            <Info size={14} weight="bold" />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="phone-ai-info-panel" role="note">
          <div className="phone-ai-info-item">
            <strong>Privacy notice</strong>
            <span>Your messages are processed to provide relevant and helpful responses. Please do not share passwords, payment details, or other sensitive information.</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="phone-ai-messages" ref={scrollRef}>
        {messageList}
        {typingEl}
      </div>

      {/* Rate Limit Toast — bottom-right, 2s auto-dismiss */}
      {showLimitToast && (
        <div className="phone-limit-toast" role="alert" aria-live="assertive">
          <span className="phone-limit-toast-icon">🚫</span>
          <span>Limit reached</span>
        </div>
      )}

      {/* Composer */}
      <div className="phone-ai-composer">
        <button
          type="button"
          className="phone-tool-btn"
          onClick={function () {
            if (fileInputRef.current) fileInputRef.current.click();
          }}
          aria-label={chatLimited ? "Attach file — chat limit reached" : "Attach file"}
          title={chatLimited ? "Chat limit reached" : "Attach file"}
          disabled={!aiSettings.fileUploadEnabled || chatLimited}
          style={{ opacity: (aiSettings.fileUploadEnabled && !chatLimited) ? 1 : 0.4 }}
        >
          <Paperclip size={14} weight="bold" />
        </button>
        <div className="phone-ai-input-wrap">
          <textarea
            className="phone-ai-input"
            placeholder={placeholder}
            value={input}
            onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={onKeyDown}
            rows={1}
            aria-label="Message input"
            disabled={!aiSettings.chatEnabled || chatLimited}
          />
          <button
            type="button"
            className="phone-ai-image-btn"
            onClick={function () {
              if (imageInputRef.current) imageInputRef.current.click();
            }}
            aria-label={chatLimited ? "Upload image — chat limit reached" : "Upload image"}
            title={chatLimited ? "Chat limit reached" : "Upload image"}
            disabled={!aiSettings.fileUploadEnabled || chatLimited}
            style={{ opacity: (aiSettings.fileUploadEnabled && !chatLimited) ? 1 : 0.4 }}
          >
            <ImageIcon size={14} weight="bold" />
          </button>
        </div>
      {/* Microphone temporarily locked/disabled hai. */}
        <button
          type="button"
          className={voiceBtnClass}
          onClick={toggleVoice}
          aria-label="Voice input temporarily unavailable"
          title="Voice input temporarily unavailable"
          disabled={!phoneVoiceEnabled}
          style={{ opacity: phoneVoiceEnabled ? 1 : 0.5 }}
        >
          {voiceIcon}
        </button>
        <button
          type="button"
          className="phone-ai-send"
          onClick={() => sendToAI(input.trim())}
          disabled={!input.trim() || !aiSettings.chatEnabled || chatLimited}
          aria-label={chatLimited ? "Cannot send — chat limit reached" : "Send message"}
          title={chatLimited ? "Chat limit reached" : "Send"}
        >
          <PaperPlaneTilt size={14} weight="fill" />
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
    </div>
  );
}
