import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { UploadCloud, Image as ImageIcon, Search, AlertCircle, X } from 'lucide-react';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { ImageCard } from './components/ImageCard';
import { StoredImage } from './types';
import { saveImage, getImages, deleteImage } from './services/db';
import { analyzeImage } from './services/geminiService';

const App: React.FC = () => {
  const [images, setImages] = useState<StoredImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load images on mount
  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      const loadedImages = await getImages();
      setImages(loadedImages);
    } catch (error) {
      console.error("Failed to load images", error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
    // Reset input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setUploadError('File size too large. Maximum 10MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // 1. Analyze with Gemini
      const analysis = await analyzeImage(file, file.type);

      // 2. Create Record (Blob is used locally for upload, but not returned by getImages later)
      const newImage: StoredImage = {
        id: uuidv4(),
        blob: file,
        name: file.name,
        type: file.type,
        size: file.size,
        createdAt: Date.now(),
        analysis: analysis
      };

      // 3. Save to Firebase (Uploads blob, gets URL, saves metadata)
      await saveImage(newImage);
      
      // 4. Update State
      await loadImages();

    } catch (err) {
      console.error(err);
      setUploadError("Failed to process or save image. Please check your API key and Firebase Config.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteImage(id);
        await loadImages();
        if (selectedImage?.id === id) {
          setSelectedImage(null);
        }
      } catch (err) {
        console.error("Delete failed", err);
        alert("Failed to delete image. Check your permission rules.");
      }
    }
  };

  const filteredImages = images.filter(img => {
    const query = searchQuery.toLowerCase();
    const title = img.analysis?.title?.toLowerCase() || '';
    const desc = img.analysis?.description?.toLowerCase() || '';
    const tags = img.analysis?.tags?.join(' ').toLowerCase() || '';
    const name = img.name.toLowerCase();
    
    return title.includes(query) || desc.includes(query) || tags.includes(query) || name.includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Upload Section */}
        <section className="mb-12">
          <div 
            className={`
              relative group rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300
              ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 bg-white'}
              ${isUploading ? 'opacity-70 pointer-events-none' : 'hover:border-indigo-400 hover:bg-slate-50'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              onChange={handleFileSelect}
              accept="image/*"
              disabled={isUploading}
            />
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`p-4 rounded-full bg-indigo-50 text-indigo-600 transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
                <UploadCloud className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-900">
                  {isUploading ? 'Processing Image...' : 'Upload an image'}
                </h3>
                <p className="text-sm text-slate-500">
                  {isUploading ? 'AI is analyzing your photo' : 'Drag and drop or click to select'}
                </p>
              </div>
              {!isUploading && (
                 <p className="text-xs text-slate-400">
                   Supports JPG, PNG, WebP (Max 10MB)
                 </p>
              )}
            </div>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
                 <div className="flex flex-col items-center animate-pulse">
                    <div className="h-2 w-48 bg-indigo-200 rounded mb-2"></div>
                    <div className="h-2 w-32 bg-indigo-200 rounded"></div>
                 </div>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start text-red-700">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{uploadError}</span>
            </div>
          )}
        </section>

        {/* Gallery Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <ImageIcon className="w-6 h-6 mr-2 text-indigo-600" />
              My Gallery <span className="ml-2 text-sm font-normal text-slate-400">({filteredImages.length})</span>
            </h2>
            
            <div className="relative max-w-md w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search tags, titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredImages.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <div className="mx-auto h-24 w-24 text-slate-200 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <ImageIcon className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No images found</h3>
              <p className="mt-1 text-sm text-slate-500">Upload your first image to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredImages.map((image) => (
                <ImageCard 
                  key={image.id} 
                  image={image} 
                  onDelete={handleDelete} 
                  onView={setSelectedImage}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="w-full md:w-2/3 bg-slate-100 flex items-center justify-center p-2">
               <ImagePreview image={selectedImage} />
            </div>
            
            <div className="w-full md:w-1/3 p-6 overflow-y-auto bg-white border-l border-slate-100">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedImage.analysis?.title || selectedImage.name}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedImage.analysis?.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed">
                  {selectedImage.analysis?.description || "No description available."}
                </p>
              </div>
              
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Metadata</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500 text-xs">File Name</span>
                    <span className="text-slate-900 truncate block" title={selectedImage.name}>{selectedImage.name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Size</span>
                    <span className="text-slate-900">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Type</span>
                    <span className="text-slate-900 uppercase">{selectedImage.type.split('/')[1]}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Added</span>
                    <span className="text-slate-900">{new Date(selectedImage.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <Button 
                   variant="danger" 
                   className="w-full"
                   onClick={() => {
                     handleDelete(selectedImage.id);
                   }}
                >
                  Delete Image
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component for preview in modal to handle object URL lifecycle
const ImagePreview: React.FC<{image: StoredImage}> = ({ image }) => {
  const [src, setSrc] = useState<string>('');
  
  useEffect(() => {
    let url = '';
    if (image.url) {
        url = image.url;
        setSrc(url);
    } else if (image.blob) {
        url = URL.createObjectURL(image.blob);
        setSrc(url);
    }
    
    return () => {
        if (image.blob && !image.url) {
            URL.revokeObjectURL(url);
        }
    };
  }, [image]);

  if (!src) return <div className="animate-pulse bg-slate-200 w-full h-full"></div>;
  
  return <img src={src} alt={image.name} className="max-w-full max-h-full object-contain" />;
}

export default App;