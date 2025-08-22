"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { Button } from "./button";
import { casasService } from "@/lib/api";

interface PhotoCarouselProps {
  photos: string[];
  casaId: number;
  onUpload?: (newPhotos: string[]) => void;
  className?: string;
}

export function PhotoCarousel({ photos = [], casaId, onUpload, className = "" }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const goToNext = () => {
    if (photos.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }
  };

  const goToPrevious = () => {
    if (photos.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if we're not exceeding 10 photos
    if (files.length + photos.length > 10) {
      alert("Você pode enviar no máximo 10 fotos para uma casa.");
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload the files
      const fileArray = Array.from(files);
      await casasService.uploadFotosCasa(casaId, fileArray);
      
      // Reload photos using the new endpoint
      const updatedPhotos = await casasService.getPhotoListByCasaId(casaId);
      
      // Call the onUpload callback if provided
      if (onUpload) {
        onUpload(updatedPhotos);
      }
      
    } catch (error) {
      console.error("Error uploading photos:", error);
      alert("Falha ao enviar fotos. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  // If there are no photos, show a placeholder
  if (photos.length === 0) {
    return (
      <div className={`relative h-48 bg-gray-100 flex flex-col items-center justify-center ${className}`}>
        <div className="text-gray-400 mb-2">Sem fotos</div>
        {casaId && (
          <label className="cursor-pointer">
            <div className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700">
              <Upload size={16} />
              <span>Adicionar fotos</span>
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <div className={`relative h-48 ${className}`}>
      <img 
        src={photos[currentIndex]} 
        alt={`Foto ${currentIndex + 1}`}
        className="w-full h-full object-cover"
      />
      
      {/* Navigation buttons */}
      {photos.length > 1 && (
        <>
          <button 
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
            aria-label="Foto anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 transition-colors"
            aria-label="Próxima foto"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
      
      {/* Photo counter */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/30 text-white px-2 py-0.5 rounded-full text-xs">
        {currentIndex + 1} / {photos.length}
      </div>
      
      {/* Upload button */}
      {casaId && (
        <div className="absolute top-2 right-2">
          <label className="cursor-pointer bg-white/80 p-1 rounded-full hover:bg-white transition-colors">
            <Upload size={16} className="text-emerald-600" />
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      )}
      
      {/* Loading state */}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
          <div className="bg-white p-3 rounded-lg text-sm">Enviando fotos...</div>
        </div>
      )}
    </div>
  );
}
