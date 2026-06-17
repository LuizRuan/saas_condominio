import React from 'react';

interface PhotoGridProps {
  photos?: string[];
  title: string;
  className?: string;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ photos = [], title, className = '' }) => {
  if (photos.length === 0) return null;

  const visiblePhotos = photos.slice(0, 3);
  const extraPhotos = photos.length - visiblePhotos.length;

  return (
    <div className={`mt-4 grid grid-cols-3 gap-2 ${className}`}>
      {visiblePhotos.map((photo, index) => (
        <div key={`${photo.slice(0, 32)}-${index}`} className="relative overflow-hidden rounded-2xl border border-violet-100 bg-slate-100">
          <img
            src={photo}
            alt={`${title} - foto ${index + 1}`}
            className="h-24 w-full object-cover"
            loading="lazy"
          />
          {index === visiblePhotos.length - 1 && extraPhotos > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-black text-white">
              +{extraPhotos}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PhotoGrid;
