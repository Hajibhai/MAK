
import React, { useRef, useEffect, useState } from 'react';
import { MicrophoneIcon, PlusIcon, XCircleIcon, TrashIcon } from './Icons';

interface AttachedImage {
  name: string;
  data: string;
  mimeType: string;
}

interface ChatInputProps {
  onSendMessage: (userInput: string, images: { data: string; mimeType: string }[], audio?: { data: string; mimeType: string }) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [userInput, setUserInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${scrollHeight}px`;
    }
  }, [userInput, attachedImages]);

  const handleSendMessage = () => {
    if (isLoading || (!userInput.trim() && attachedImages.length === 0)) return;
    onSendMessage(userInput, attachedImages);
    setUserInput('');
    setAttachedImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = (e.target?.result as string).split(',')[1];
        if (base64Data) {
          setAttachedImages(prev => [
            ...prev,
            { name: file.name, data: base64Data, mimeType: file.type }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset file input to allow selecting the same file again
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (imageName: string) => {
    setAttachedImages(prev => prev.filter(img => img.name !== imageName));
  };
  
  const startRecording = async () => {
    if (isLoading || isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            if (audioBlob.size > 0) {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const base64Data = (reader.result as string).split(',')[1];
                  onSendMessage('', [], { data: base64Data, mimeType: audioBlob.type });
              };
              reader.readAsDataURL(audioBlob);
            }
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error starting audio recording:", err);
        alert("Could not start recording. Please ensure you have granted microphone permissions.");
    }
  };
  
  const stopRecording = (send: boolean) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        const recorder = mediaRecorderRef.current;
        if (!send) {
            const stream = recorder.stream;
            recorder.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
            };
        }
        recorder.stop();
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
        stopRecording(true); // Stop and send
    } else {
        startRecording();
    }
  };

  const handleCancelRecording = () => {
      stopRecording(false); // Stop and discard
  };

  return (
    <div className="relative w-full">
      <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl transition-all duration-200 border border-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.3)]">
        {attachedImages.length > 0 && (
            <div className="p-2 md:p-3 border-b border-zinc-300 dark:border-zinc-700/50">
                <div className="max-h-36 overflow-y-auto flex flex-wrap gap-2 p-2 rounded-lg bg-zinc-200/50 dark:bg-zinc-900/50">
                  {attachedImages.map(image => (
                      <div key={image.name} className="relative group flex-shrink-0">
                          <img src={`data:${image.mimeType};base64,${image.data}`} alt={image.name} className="h-16 w-16 object-cover rounded-md" />
                          <button onClick={() => removeImage(image.name)} className="absolute top-0 right-0 -mt-1 -mr-1 bg-zinc-700 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" aria-label={`Remove ${image.name}`}>
                              <XCircleIcon className="w-4 h-4" />
                          </button>
                      </div>
                  ))}
                </div>
            </div>
        )}
        <div className="flex items-start">
            <div className="absolute left-3 bottom-3.5 md:left-4 md:bottom-4 flex items-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 transition-colors" 
                aria-label="Add files">
                  <PlusIcon className="w-5 h-5"/>
              </button>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
              />
            </div>
            <textarea
                ref={textareaRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Recording audio..." : "Ask MAK"}
                rows={1}
                className="w-full bg-transparent py-3.5 md:py-4 pl-10 md:pl-12 pr-24 md:pr-28 resize-none focus:outline-none min-h-[56px] text-zinc-900 dark:text-zinc-200 placeholder-zinc-500 dark:placeholder-zinc-400"
                disabled={isLoading || isRecording}
                style={{ maxHeight: '200px' }}
            />
            <div className="absolute right-3 bottom-3.5 md:right-4 md:bottom-4 flex items-center gap-2">
              {isRecording ? (
                <>
                  <button
                    onClick={handleCancelRecording}
                    className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                    aria-label="Cancel recording"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleMicClick}
                    className="p-1 rounded-full bg-red-500 text-white animate-pulse-ring"
                    aria-label="Stop recording and send"
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <button 
                    onClick={handleMicClick}
                    disabled={isLoading}
                    className="p-1 rounded-full transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                    aria-label="Click to record audio"
                >
                    <MicrophoneIcon className="w-5 h-5"/>
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
