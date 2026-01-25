'use client';

import { useState, useRef } from 'react';
import { Info, Upload, Check, X, Trash2 } from 'lucide-react';
import { Task } from '@/app/lib/definitions';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
}

export default function TaskCard({ task, onUpdate }: TaskCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(task.id, { completed: e.target.checked });
  };

  const handleRemoveImage = () => {
    if (confirm('Are you sure you want to remove this photo/video?')) {
        onUpdate(task.id, { image: null }); 
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Use Vercel Client Upload for Production (supports large files)
      // We assume if we are not on localhost, we are on Vercel
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      if (isProduction) {
          try {
            const newBlob = await upload(file.name, file, {
                access: 'public',
                handleUploadUrl: '/api/upload',
            });
            onUpdate(task.id, { image: newBlob.url });
            setUploading(false);
            return;
          } catch (err) {
              console.error('Vercel Client Upload failed, falling back...', err);
              // Fallback to legacy upload if client upload fails
          }
      }

      // Legacy / Local Upload Logic
      // Check if it's an image for client-side compression
      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        const reader = new FileReader();

        reader.onload = (event) => {
          img.src = event.target?.result as string;
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
              if (blob) {
                await uploadFile(blob, file.name);
              }
            }, 'image/jpeg', 0.7);
          };
        };
        reader.readAsDataURL(file);
      } else {
        // For video or other types, upload directly
        await uploadFile(file, file.name);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setUploading(false);
    }
  };

  const uploadFile = async (fileBlob: Blob, fileName: string) => {
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        onUpdate(task.id, { image: data.url });
      } else {
        alert('Upload failed: ' + data.message);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isVideo = (url?: string) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleCheckboxChange}
            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
          />
          <h3 className={`font-semibold text-lg ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-blue-500 hover:text-blue-700 focus:outline-none"
            aria-label="Task details"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {showInfo && (
        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 border border-blue-100 animate-in fade-in slide-in-from-top-1">
          <p>{task.description}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-2">
        <div className="flex-1 w-full">
           {task.image ? (
            <div className="relative w-full h-48 sm:w-40 sm:h-40 rounded-md overflow-hidden border border-gray-300 group bg-black">
              {isVideo(task.image) ? (
                 <video 
                   src={task.image} 
                   className="w-full h-full object-cover" 
                   controls 
                 />
              ) : (
                <Image
                  src={task.image}
                  alt="Task proof"
                  fill
                  className="object-cover"
                />
              )}
              
              <div className="absolute inset-0 bg-black/30 sm:bg-transparent sm:group-hover:bg-black/30 transition-all flex items-start justify-center pt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 pointer-events-none">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm hover:bg-gray-100 pointer-events-auto"
                  >
                    Change
                  </button>
              </div>

              <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                }}
                className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md hover:bg-red-700 transition-colors z-10 pointer-events-auto"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors w-full sm:w-auto justify-center"
            >
              {uploading ? (
                <span className="animate-pulse">Uploading...</span>
              ) : (
                <>
                  <Upload size={18} />
                  <span>Upload Photo/Video</span>
                </>
              )}
            </button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
