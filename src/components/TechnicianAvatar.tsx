import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

interface TechnicianAvatarProps {
  fullName?: string;
  photoUrl?: string | null;
  className?: string;
  imageClassName?: string;
}

const initials = (value: string) => value
  .replace(/^(นาย|นางสาว|นาง)\s*/, '')
  .trim()
  .slice(0, 2) || 'MT';

export const TechnicianAvatar: React.FC<TechnicianAvatarProps> = ({
  fullName = '', photoUrl = '', className = '', imageClassName = '',
}) => {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  const fallback = useMemo(() => initials(fullName), [fullName]);

  useEffect(() => {
    let active = true;
    setSrc('');
    setFailed(false);
    if (!photoUrl) return () => { active = false; };
    api.getTechnicianPhotoUrl(photoUrl)
      .then((url) => { if (active) setSrc(url); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [photoUrl]);

  return <span className={`relative overflow-hidden bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black shrink-0 ${className}`} aria-label={`รูป ${fullName || 'ช่าง'}`}>
    {src && !failed
      ? <img src={src} onError={() => setFailed(true)} alt={fullName ? `รูป ${fullName}` : 'รูปช่าง'} className={`absolute inset-0 w-full h-full object-cover ${imageClassName}`}/>
      : <span>{fallback}</span>}
  </span>;
};
