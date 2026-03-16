import { useState, useRef } from 'react';
import type { UploadFile } from '../types/api';
import './ChatInput.css';

interface ChatInputProps {
  onSend: (content: string) => void;
  onFileUpload: (files: UploadFile[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, onFileUpload, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const uploadedFiles: UploadFile[] = files.map((file) => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      type: getFileType(file.type),
      size: file.size,
    }));

    onFileUpload(uploadedFiles);

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileType = (mimeType: string): 'document' | 'image' | 'audio' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  };

  return (
    <div className={`chat-input-container ${isFocused ? 'focused' : ''}`}>
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          onChange={handleFileChange}
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
          multiple
        />
        <button
          type="button"
          className="attach-btn"
          onClick={handleFileClick}
          disabled={disabled}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          className="chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="输入消息... (Shift+Enter 换行)"
          disabled={disabled}
          rows={1}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={disabled || !inputValue.trim()}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
