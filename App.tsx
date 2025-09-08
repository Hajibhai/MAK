


import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, ChatSession, Part } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import { MenuIcon, NewChatIcon, SettingsIcon, UserCircleIcon, SparklesIcon, SearchIcon, XIcon, SunIcon, MoonIcon, DownloadIcon, PencilIcon, CheckIcon, TrashIcon } from './components/Icons';

type Theme = 'light' | 'dark';

// Helper function to determine the initial theme
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('mak-theme') as Theme | null;
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  // Default to light theme if no preference is found
  return 'light';
};


const Sidebar: React.FC<{
  isOpen: boolean;
  onNewChat: () => void;
  chatHistory: ChatSession[];
  onLoadChat: (chatId: string) => void;
  currentChatId: string | null;
  theme: Theme;
  onToggleTheme: () => void;
  onExportChat: () => void;
  editingChatId: string | null;
  onStartRename: (chatId: string, currentTitle: string) => void;
  onConfirmRename: () => void;
  onDeleteChat: (chatId: string) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
}> = ({ isOpen, onNewChat, chatHistory, onLoadChat, currentChatId, theme, onToggleTheme, onExportChat, editingChatId, onStartRename, onConfirmRename, onDeleteChat, editingTitle, setEditingTitle }) => {
  
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onConfirmRename();
    }
  };

  return (
    <nav className={`flex flex-col justify-between bg-zinc-50 dark:bg-zinc-900 h-screen sticky top-0 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'w-64 p-2' : 'w-0 p-0 border-r-0'}`}>
      <div className="flex flex-col flex-1 min-w-[15rem]">
        <div className="flex items-center justify-end p-2">
            <button 
                title="New Chat" 
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg"
                onClick={onNewChat}
                aria-label="Start a new chat"
            >
                <NewChatIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <p className="px-3 mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-wider">Recent</p>
            <div className="space-y-1">
                {chatHistory.map(chat => (
                <div key={chat.id} className="group relative w-full flex items-center">
                    {editingChatId === chat.id ? (
                        <div className="flex-grow flex items-center bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                           <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={handleRenameKeyDown}
                                onBlur={onConfirmRename}
                                className="w-full bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none"
                                autoFocus
                            />
                            <button onClick={onConfirmRename} className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
                                <CheckIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => onLoadChat(chat.id)}
                                className={`w-full text-left px-3 py-2 text-sm rounded-lg truncate transition-colors ${
                                currentChatId === chat.id ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                }`}
                            >
                                {chat.title}
                            </button>
                            <div className="absolute right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onStartRename(chat.id, chat.title)} className="p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" title="Rename chat">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteChat(chat.id)} className="p-1 text-zinc-500 hover:text-red-500 dark:hover:text-red-400" title="Delete chat">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </>
                    )}
                </div>
                ))}
            </div>
        </div>
      </div>
      <div className="space-y-1 min-w-[15rem]">
        <button onClick={onToggleTheme} className="w-full flex items-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
        </button>
        <button onClick={onExportChat} className="w-full flex items-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm" title="Export current chat">
          <DownloadIcon className="w-6 h-6" />
          <span>Export Chat</span>
        </button>
        <button className="w-full flex items-center gap-2 p-3 text-gray-600 dark:text-gray-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-sm">
          <SettingsIcon className="w-6 h-6" />
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
};

const Header: React.FC<{
  onToggleSidebar: () => void;
  isSearchActive: boolean;
  setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}> = ({ onToggleSidebar, isSearchActive, setIsSearchActive, searchQuery, setSearchQuery }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="p-2 md:p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
           <button onClick={onToggleSidebar} className="p-2 -ml-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors" aria-label="Toggle sidebar">
              <MenuIcon className="w-6 h-6" />
           </button>
          <h1 className="text-xl text-zinc-700 dark:text-zinc-300">MAK</h1>
        </div>
        <div className="flex items-center gap-4">
          {isSearchActive ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history..."
                className="w-48 bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg py-1 px-3 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
                autoFocus
              />
              <button onClick={() => { setIsSearchActive(false); setSearchQuery(''); }} className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" aria-label="Close search">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
          ) : (
              <button onClick={() => setIsSearchActive(true)} className="p-1 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" aria-label="Search history">
                <SearchIcon className="w-6 h-6" />
              </button>
          )}
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-indigo-500 rounded-full"
              aria-label="User menu"
              aria-haspopup="true"
            >
              <UserCircleIcon className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
            </button>
            {isDropdownOpen && (
              <div 
                ref={dropdownRef}
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-zinc-800 ring-1 ring-black ring-opacity-5 focus:outline-none border border-zinc-200 dark:border-zinc-700 z-10"
                role="menu" 
                aria-orientation="vertical" 
                aria-labelledby="user-menu-button"
              >
                <a href="#" className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" role="menuitem">Account Settings</a>
                <a href="#" className="block px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700" role="menuitem">Logout</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const SuggestionCard: React.FC<{ title: string; image: string; onClick: () => void; className?: string; }> = ({ title, image, onClick, className = '' }) => (
    <div 
        onClick={onClick}
        className={`relative rounded-2xl overflow-hidden cursor-pointer group bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors h-full ${className}`}
    >
        <img src={image} alt={title} className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        <p className="absolute bottom-2 left-3 md:bottom-4 md:left-4 font-semibold text-white text-base md:text-lg drop-shadow-md">{title}</p>
    </div>
);


const SuggestionPrompts: React.FC<{ onPromptClick: (prompt: string) => void }> = ({ onPromptClick }) => {
    const prompts = [
        { title: 'Make my own custom mini figure', image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=600&auto=format&fit=crop', className: 'lg:col-span-2 lg:row-span-2' },
        { title: 'Turn me into a superhero', image: 'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?q=80&w=600&auto=format&fit=crop', className: 'lg:row-span-2' },
        { title: 'Give me an 80s style makeover', image: 'https://images.unsplash.com/photo-1542089363-b555861642EC?q=80&w=600&auto=format&fit=crop' },
        { title: 'Create a professional headshot', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop' },
    ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-2 md:p-4">
      <div className="text-center mb-6 md:mb-10">
        <p className="text-4xl md:text-5xl font-semibold text-zinc-600 dark:text-zinc-400">MAK</p>
        <p className="mt-2 text-lg md:text-xl text-zinc-500 dark:text-zinc-500">Your powerful transcription and translation assistant.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 gap-2 md:gap-4 w-full max-w-4xl h-[300px] md:h-[400px]">
         {prompts.map((prompt, index) => (
             <SuggestionCard key={index} {...prompt} onClick={() => onPromptClick(prompt.title)} />
         ))}
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);


  const [isSidebarOpen, setIsSidebarOpen] = useState(
      typeof window !== 'undefined' ? window.innerWidth > 1024 : true
  );

  const chatRef = useRef<Chat | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Theme management
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mak-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const initChat = useCallback((history: Message[] = []) => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const sanitizedHistory = history.map(({ role, parts }) => ({
        role,
        parts: parts.map(part => {
          if ('text' in part) return { text: part.text };
          if ('inlineData' in part) return { inlineData: part.inlineData };
          return { text: '' };
        })
      }));

      return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: sanitizedHistory,
        config: {
            systemInstruction: "You are a helpful and friendly AI assistant named MAK. Format your responses using markdown. Before you provide the final answer, first think step-by-step about the user's query inside a `<thinking>...</thinking>` block. This thinking process should be brief and not part of the final answer itself. If the user provides an audio file, your task is to analyze it, detect the language, and provide a response that includes both a transcription in the original language and a translation in English. Format this clearly, for example: \n\n**Detected Language:** [Language]\n\n**Transcription:**\n[Transcription]\n\n**English Translation:**\n[Translation]",
        }
      });
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during initialization.";
        console.error("Initialization Error:", errorMessage);
        setError(`Failed to initialize AI Agent: ${errorMessage}`);
        return null;
    }
  }, []);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('mak-chat-history');
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setError("Could not load your chat history.");
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        localStorage.setItem('mak-chat-history', JSON.stringify(chatHistory));
      } catch (err) {
        console.error("Failed to save chat history:", err);
        setError("Could not save your chat history.");
      }
    }
  }, [chatHistory]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

 const handleSendMessage = useCallback(async (messageText: string, images: { data: string; mimeType: string }[] = [], audio?: { data: string; mimeType: string }) => {
    const textPart = messageText.trim() ? [{ text: messageText.trim() }] : [];
    const imageParts = images.map(img => ({
      inlineData: { data: img.data, mimeType: img.mimeType }
    }));
    const audioPart = audio ? [{ inlineData: { data: audio.data, mimeType: audio.mimeType } }] : [];
    
    const allParts: Part[] = [...imageParts, ...audioPart, ...textPart];

    if (allParts.length === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', parts: allParts };
    setMessages(prev => [...prev, userMessage]);

    let activeChatId = currentChatId;
    
    if (!activeChatId) {
      const newChatId = Date.now().toString();
      const newChatSession: ChatSession = {
        id: newChatId,
        title: messageText.substring(0, 40) + (messageText.length > 40 ? '...' : (audio ? 'Audio message' : 'New Chat')),
        messages: [userMessage],
      };
      setChatHistory(prev => [newChatSession, ...prev]);
      setCurrentChatId(newChatId);
      activeChatId = newChatId;
      chatRef.current = initChat();
    } else {
      setChatHistory(prev => prev.map(c => 
        c.id === activeChatId ? { ...c, messages: [...c.messages, userMessage] } : c
      ));
    }

    if (!chatRef.current) {
      chatRef.current = initChat(messages);
    }
    if (!chatRef.current) {
        console.error("Chat not initialized.");
        setError("Chat is not initialized. Please select a chat or start a new one.");
        setIsLoading(false);
        return;
    }

    try {
      const stream = await chatRef.current.sendMessageStream({ message: allParts });
      const initialModelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', parts: [{ text: '' }], thoughts: '' };
      setMessages(prev => [...prev, initialModelMessage]);

      let fullModelResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullModelResponse += chunkText;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            const firstPart = lastMessage.parts[0];
            if (firstPart && 'text' in firstPart) {
              firstPart.text = fullModelResponse;
            }
          }
          return newMessages;
        });
      }

      let thoughts = '';
      let finalAnswer = fullModelResponse;
      const thinkingMatch = fullModelResponse.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch && thinkingMatch[1]) {
        thoughts = thinkingMatch[1].trim();
        finalAnswer = fullModelResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
      }
      
      const finalModelMessage: Message = { id: initialModelMessage.id, role: 'model', parts: [{ text: finalAnswer }], thoughts };
      
      setMessages(prev => {
          const updatedMessages = [...prev];
          updatedMessages[updatedMessages.length - 1] = finalModelMessage;
          return updatedMessages;
      });

       setChatHistory(prev => prev.map(c => 
        c.id === activeChatId ? { ...c, messages: [...c.messages, finalModelMessage] } : c
      ));

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      console.error("API Error:", errorMessage);
      setError(`Sorry, something went wrong. Please try again. Error: ${errorMessage}`);
       setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if(lastMessage?.role === 'model' && lastMessage.parts[0] && 'text' in lastMessage.parts[0] && lastMessage.parts[0].text === ''){
              return prev.slice(0, -1);
          }
          return prev;
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, currentChatId, initChat, messages]);
  
  const handlePromptClick = (prompt: string) => {
      handleSendMessage(prompt);
  }

  const handleNewChat = useCallback(() => {
    // Save the current chat before starting a new one
    if (currentChatId && messages.length > 0) {
      setChatHistory(prev => prev.map(c => 
        c.id === currentChatId ? { ...c, messages: messages } : c
      ));
    }

    // Reset for the new chat
    setCurrentChatId(null);
    setMessages([]);
    setError(null);
    chatRef.current = null;
  }, [messages, currentChatId]);

  const handleLoadChat = useCallback((chatId: string) => {
    const chatToLoad = chatHistory.find(c => c.id === chatId);
    if (chatToLoad) {
      setCurrentChatId(chatId);
      setMessages(chatToLoad.messages);
      setError(null);
      chatRef.current = initChat(chatToLoad.messages);
    }
  }, [chatHistory, initChat]);
  
  const handleExportChat = useCallback(() => {
    if (!currentChatId) {
      alert("Please select a chat to export.");
      return;
    }
    const chatToExport = chatHistory.find(c => c.id === currentChatId);
    if (!chatToExport) {
      alert("Could not find the current chat to export.");
      return;
    }

    const formattedContent = chatToExport.messages.map(msg => {
      const author = msg.role === 'user' ? 'User' : 'MAK';
      const text = msg.parts.map(p => ('text' in p) ? p.text : '[Image]').join('\n');
      return `${author}:\n${text}\n\n`;
    }).join('');

    const blob = new Blob([formattedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = chatToExport.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle || 'chat-export'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  }, [currentChatId, chatHistory]);

  const handleStartRename = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
  };
  
  const handleConfirmRename = () => {
    if (!editingChatId) return;
    setChatHistory(prev => prev.map(chat => 
      chat.id === editingChatId ? { ...chat, title: editingTitle || "Untitled Chat" } : chat
    ));
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleDeleteChat = useCallback((chatIdToDelete: string) => {
    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) {
        return;
    }

    setChatHistory(prev => prev.filter(c => c.id !== chatIdToDelete));

    // If the deleted chat was the current one, reset the view
    if (currentChatId === chatIdToDelete) {
        setCurrentChatId(null);
        setMessages([]);
        setError(null);
        chatRef.current = null;
    }
  }, [currentChatId]);

  const handleStartEditMessage = (messageId: string) => {
    setEditingMessageId(messageId);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
  };

  const handleSaveEditMessage = useCallback(async (messageId: string, newText: string) => {
    const editIndex = messages.findIndex(m => m.id === messageId);
    if (editIndex === -1) {
        console.error("Cannot find message to edit.");
        setEditingMessageId(null);
        return;
    }

    const historyBeforeEdit = messages.slice(0, editIndex);
    const originalMessage = messages[editIndex];
    // NOTE: This assumes we are editing the first text part. A more complex UI would be needed for multiple text parts.
    const updatedParts: Part[] = [{ text: newText }];
    const updatedUserMessage: Message = { ...originalMessage, parts: updatedParts };

    const newMessages = [...historyBeforeEdit, updatedUserMessage];
    setMessages(newMessages);
    setEditingMessageId(null);
    setIsLoading(true);
    setError(null);

    chatRef.current = initChat(historyBeforeEdit);
    if (!chatRef.current) {
        setError("Failed to re-initialize chat for editing.");
        setIsLoading(false);
        return;
    }

    try {
      const stream = await chatRef.current.sendMessageStream({ message: updatedParts });
      const initialModelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', parts: [{ text: '' }], thoughts: '' };
      setMessages(prev => [...prev, initialModelMessage]);

      let fullModelResponse = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullModelResponse += chunkText;
        setMessages(prev => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.role === 'model') {
            const firstPart = lastMessage.parts[0];
            if (firstPart && 'text' in firstPart) firstPart.text = fullModelResponse;
          }
          return updated;
        });
      }

      let thoughts = '';
      let finalAnswer = fullModelResponse;
      const thinkingMatch = fullModelResponse.match(/<thinking>([\s\S]*?)<\/thinking>/);
      if (thinkingMatch?.[1]) {
        thoughts = thinkingMatch[1].trim();
        finalAnswer = fullModelResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
      }
      
      const finalModelMessage: Message = { id: initialModelMessage.id, role: 'model', parts: [{ text: finalAnswer }], thoughts };
      
      setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = finalModelMessage;
          if (currentChatId) {
            setChatHistory(hist => hist.map(c => 
                c.id === currentChatId ? { ...c, messages: updated } : c
            ));
          }
          return updated;
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      setError(`Sorry, something went wrong while regenerating the response. Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [messages, currentChatId, initChat]);


  const filteredChatHistory = useMemo(() => {
    if (!searchQuery) {
        return chatHistory;
    }
    return chatHistory.filter(chat => {
        const query = searchQuery.toLowerCase();
        const titleMatch = chat.title.toLowerCase().includes(query);
        if (titleMatch) return true;

        const messageMatch = chat.messages.some(message =>
            message.parts.some(part => 'text' in part && part.text.toLowerCase().includes(query))
        );
        return messageMatch;
    });
  }, [chatHistory, searchQuery]);

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-200 font-sans">
      <Sidebar 
        isOpen={isSidebarOpen}
        onNewChat={handleNewChat} 
        chatHistory={filteredChatHistory}
        onLoadChat={handleLoadChat}
        currentChatId={currentChatId}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onExportChat={handleExportChat}
        editingChatId={editingChatId}
        onStartRename={handleStartRename}
        onConfirmRename={handleConfirmRename}
        onDeleteChat={handleDeleteChat}
        editingTitle={editingTitle}
        setEditingTitle={setEditingTitle}
      />
      <div className="flex flex-col flex-1 h-screen">
        <Header 
            onToggleSidebar={handleToggleSidebar}
            isSearchActive={isSearchActive}
            setIsSearchActive={setIsSearchActive}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        />
        
        <main ref={chatContainerRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            {messages.length === 0 ? (
                <SuggestionPrompts onPromptClick={handlePromptClick} />
            ) : (
                <div className="p-2 md:p-4 space-y-6">
                    {messages.map((msg) => (
                        <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            theme={theme}
                            editingMessageId={editingMessageId}
                            onStartEdit={handleStartEditMessage}
                            onCancelEdit={handleCancelEditMessage}
                            onSaveEdit={handleSaveEditMessage}
                         />
                    ))}
                     {isLoading && messages[messages.length-1]?.role !== 'model' && (
                        <ChatMessage key="loading" message={{id: 'loading', role: 'model', parts: [{text: ''}]}} isLoading theme={theme} />
                    )}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                            <p className="font-bold">Error</p>
                            <p>{error}</p>
                        </div>
                    )}
                </div>
            )}
          </div>
        </main>

        <footer className="p-2 md:p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
            <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-3">
              MAK may display inaccurate info, including about people, so double-check its responses.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;