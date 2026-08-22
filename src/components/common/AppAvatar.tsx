import { useState } from 'react';

interface AppAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

const initials = (name: string): string =>
  name.trim().split(/\s+/u).filter(Boolean).slice(0, 2).map(word => word[0]?.toLocaleUpperCase() ?? '').join('') || '?';

const AppAvatar: React.FC<AppAvatarProps> = ({ name, src, className = '' }) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src && failedSrc !== src);

  return (
    <div className={`app-avatar ${className}`.trim()} aria-label={`Fotografía de ${name}`}>
      {showImage ? <img src={src ?? undefined} alt="" onError={() => setFailedSrc(src ?? null)} /> : <span aria-hidden="true">{initials(name)}</span>}
    </div>
  );
};

export default AppAvatar;
