import React, { useState, useEffect } from 'react';
import { Trash2, Tag, Calendar, Maximize2 } from 'lucide-react';
import { StoredImage } from '../types';

interface ImageCardProps {
  image: StoredImage;
  onDelete: (id: string) => void;
  onView: (image: StoredImage) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({ image, onDelete, onView }) => {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    if (image.url) {
      // Prioritize remote URL
      setDisplaySrc(image.url);
    } else if (image.blob) {
      // Fallback to Blob if local (e.g. immediately after upload before refresh)
      objectUrl = URL.createObjectURL(image.blob);
      setDisplaySrc(objectUrl);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.blob, image.url]);

  const dateStr = new Date(image.createdAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden cursor-pointer" onClick={() => onView(image)}>
        {displaySrc ? (
          <img 
            src={displaySrc} 
            alt={image.name} 
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">Loading...</div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
             <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(image.id); }}
            className="p-1.5 bg-white/90 text-red-600 rounded-full hover:bg-red-50 shadow-sm backdrop-blur-sm"
            title="Delete Image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-sm font-semibold text-slate-900 truncate pr-2" title={image.analysis?.title || image.name}>
            {image.analysis?.title || image.name}
          </h3>
        </div>
        
        <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8">
          {image.analysis?.description || "No description available."}
        </p>

        <div className="mt-auto pt-2 border-t border-slate-100">
           {image.analysis?.tags && image.analysis.tags.length > 0 ? (
             <div className="flex flex-wrap gap-1 mb-2">
               {image.analysis.tags.slice(0, 3).map((tag, idx) => (
                 <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                   <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                   {tag}
                 </span>
               ))}
               {image.analysis.tags.length > 3 && (
                 <span className="text-[10px] text-slate-400 self-center">+{image.analysis.tags.length - 3}</span>
               )}
             </div>
           ) : (
             <div className="h-6 mb-2"></div>
           )}
           
           <div className="flex items-center justify-between text-[10px] text-slate-400">
             <span className="flex items-center">
               <Calendar className="w-3 h-3 mr-1" />
               {dateStr}
             </span>
             <span>{(image.size / 1024 / 1024).toFixed(2)} MB</span>
           </div>
        </div>
      </div>
    </div>
  );
};