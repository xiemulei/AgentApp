import { useState, useRef } from 'react';
import { FileList } from './FileList';
import './ChatInput.css';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  path?: string;
}

interface ChatInputProps {
  onSend: (content: string, files: UploadedFile[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((inputValue.trim() || uploadedFiles.length > 0) && !disabled) {
      onSend(inputValue, uploadedFiles);
      setInputValue('');
      setUploadedFiles([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0];

    // 验证文件大小 (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('文件大小超过 50MB 限制');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8091/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === '0000' || result.code === '200') {
          const uploadedFile: UploadedFile = {
            id: result.data?.fileId || `file-${Date.now()}-${file.name}`,
            name: result.data?.fileName || file.name,
            type: result.data?.fileType || file.type,
            size: result.data?.fileSize || file.size,
            url: result.data?.fileUrl,
            path: result.data?.path,
          };
          setUploadedFiles(prev => [...prev, uploadedFile]);
        } else {
          alert('上传失败：' + (result.info || '未知错误'));
        }
      } else {
        alert('上传失败：' + response.statusText);
      }
    } catch (error) {
      console.error('上传错误:', error);
      alert('上传失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  return (
    <div className={`chat-input-container ${isFocused ? 'focused' : ''}`}>
      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section">
          <FileList files={uploadedFiles} onRemove={handleFileRemove} disabled={disabled} />
        </div>
      )}

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          onChange={handleFileChange}
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.ppt,.pptx"
          disabled={disabled || isUploading}
        />
        <button
          type="button"
          className="attach-btn"
          onClick={handleFileClick}
          disabled={disabled || isUploading}
          title={isUploading ? '上传中...' : '上传文件'}
        >
          {isUploading ? (
            <div className="upload-spinner-small"></div>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          )}
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
          disabled={disabled || (!inputValue.trim() && uploadedFiles.length === 0)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
