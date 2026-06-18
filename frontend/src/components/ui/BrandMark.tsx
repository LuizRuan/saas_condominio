import { Building2 } from 'lucide-react';

interface BrandMarkProps {
  inverted?: boolean;
  compact?: boolean;
}

const BrandMark = ({ compact = false, inverted = false }: BrandMarkProps) => (
  <div className="flex items-center">
    <img 
      src={inverted ? "/logo-white.png" : "/logo.png"} 
      alt="Domus Logo" 
      className={`object-contain ${compact ? 'h-8' : 'h-10'}`} 
    />
  </div>
);

export default BrandMark;
