

import React, { useState, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, coy } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Message, Part } from '../types';
import { UserIcon, SparklesIcon, ClipboardIcon, CheckIcon, LightBulbIcon, PencilIcon } from './Icons';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  theme: 'light' | 'dark';
  editingMessageId?: string | null;
  onStartEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, newText: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false, theme, editingMessageId, onStartEdit, onCancelEdit, onSaveEdit }) => {
  const { id, role, parts, thoughts } = message;
  const isModel = role === 'model';
  const hasContent = parts.some(p => ('text' in p && p.text) || 'inlineData' in p);
  const [showThoughts, setShowThoughts] = useState(false);
  
  const isEditing = id === editingMessageId;
  const [editedText, setEditedText] = useState('');

  const originalText = useMemo(() => {
    const textPart = parts.find(p => 'text' in p);
    return textPart && 'text' in textPart ? textPart.text : '';
  }, [parts]);
  
  useEffect(() => {
    if (isEditing) {
      setEditedText(originalText);
    }
  }, [isEditing, originalText]);


  const CodeBlock = React.memo(({ node, inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : 'text';

    const handleCopy = () => {
      const codeString = String(children).replace(/\n$/, '');
      navigator.clipboard.writeText(codeString).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }, (err) => {
        console.error('Could not copy text: ', err);
      });
    };

    return !inline ? (
      <div className="relative my-2 bg-zinc-900/70 rounded-lg overflow-hidden group border border-zinc-300 dark:border-zinc-700">
        <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
          <span>{lang}</span>
          <button
            onClick={handleCopy}
            disabled={isCopied}
            className={`flex items-center gap-1.5 transition-colors duration-200 ${
              isCopied
                ? 'text-emerald-500 dark:text-emerald-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            {isCopied ? <CheckIcon className="w-4 h-4" /> : <ClipboardIcon className="w-4 h-4" />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <SyntaxHighlighter
          style={theme === 'dark' ? vscDarkPlus : coy}
          language={lang}
          PreTag="div"
          customStyle={{ background: 'transparent', padding: '1rem', margin: 0 }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code className="bg-zinc-200 dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    );
  });
  
  const LoadingIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"></div>
    </div>
  );
  
  const handleSaveClick = () => {
      if (onSaveEdit) {
          onSaveEdit(id, editedText);
      }
  };

  const renderPart = (part: Part, index: number) => {
    if ('inlineData' in part) {
        const { mimeType, data } = part.inlineData;
        if (mimeType.startsWith('image/')) {
            const imageUrl = `data:${mimeType};base64,${data}`;
            return <img key={index} src={imageUrl} alt="User upload" className="rounded-lg max-w-full h-auto mt-2" />;
        }
        if (mimeType.startsWith('audio/')) {
            const audioUrl = `data:${mimeType};base64,${data}`;
            return (
                <audio key={index} controls src={audioUrl} className="w-full sm:w-80 mt-2 filter dark:invert">
                    Your browser does not support the audio element.
                </audio>
            );
        }
    }
    if ('text' in part && part.text) {
        return (
            <div key={index} className="prose prose-sm md:prose-base max-w-none 
                          dark:prose-invert 
                          prose-p:text-zinc-700 dark:prose-p:text-zinc-300 
                          prose-headings:text-zinc-900 dark:prose-headings:text-white
                          prose-strong:text-zinc-900 dark:prose-strong:text-white
                          prose-a:text-indigo-600 dark:prose-a:text-indigo-400 
                          hover:prose-a:text-indigo-500 dark:hover:prose-a:text-indigo-300
                          prose-ul:list-disc prose-ol:list-decimal 
                          prose-li:marker:text-indigo-500 dark:prose-li:marker:text-indigo-400">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock,
                }}
              >
                {part.text}
              </ReactMarkdown>
            </div>
        )
    }
    return null;
  }

  return (
    <div className={`flex items-start gap-2 md:gap-4 ${!isModel && 'justify-end'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${isModel ? 'bg-indigo-500' : 'bg-zinc-600 dark:bg-zinc-700'}`}>
        {isModel ? <SparklesIcon className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
      </div>
      <div className={`w-full max-w-2xl px-1 ${!isModel && 'text-right'}`}>
        <div className={`relative group inline-block px-4 py-3 md:px-5 md:py-4 rounded-xl ${isModel ? 'bg-zinc-100 dark:bg-zinc-800 text-left' : 'bg-zinc-100 dark:bg-zinc-800'}`}>
          {!isModel && onStartEdit && !isEditing && (
            <button
                onClick={() => onStartEdit(id)}
                className="absolute top-1 right-1 p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                aria-label="Edit message"
            >
                <PencilIcon className="w-4 h-4" />
            </button>
          )}

         {isLoading && !hasContent ? (
            <LoadingIndicator />
          ) : isEditing ? (
            <div className="w-full">
                <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full bg-zinc-200 dark:bg-zinc-900/80 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-200 resize-y"
                    rows={Math.max(3, editedText.split('\n').length)}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button onClick={onCancelEdit} className="px-3 py-1 text-sm rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700">Cancel</button>
                    <button onClick={handleSaveClick} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save</button>
                </div>
            </div>
          ) : (
            <div className="space-y-2">
                {parts.map(renderPart)}
            </div>
          )}
          {isModel && thoughts && (
            <div className="mt-4 pt-3 border-t border-zinc-200/80 dark:border-zinc-700/50">
                <button 
                    onClick={() => setShowThoughts(!showThoughts)}
                    className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                    aria-expanded={showThoughts}
                >
                    <LightBulbIcon className="w-4 h-4" />
                    <span>{showThoughts ? 'Hide' : 'Show'} thoughts</span>
                </button>
                {showThoughts && (
                    <div className="mt-2 p-3 bg-zinc-200/50 dark:bg-zinc-900/80 rounded-lg border border-zinc-300 dark:border-zinc-700">
                        <pre className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap font-mono">
                            {thoughts}
                        </pre>
                    </div>
                )}
            </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
