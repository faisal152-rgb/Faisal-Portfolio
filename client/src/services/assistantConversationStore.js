const initialState = {
  messages: null,
  sessionId: null,
};

let state = initialState;
const listeners = new Set();

function emit() {
  listeners.forEach(listener => listener());
}

export const assistantConversationStore = {
  getSnapshot() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  update(nextState) {
    state = { ...state, ...nextState };
    emit();
  },

  reset(messages) {
    state = { messages, sessionId: null };
    emit();
  },
};