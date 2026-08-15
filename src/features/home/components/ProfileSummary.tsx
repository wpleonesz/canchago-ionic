import { IonChip } from '@ionic/react';
import type { SessionUser } from '../../../types/api/auth';

interface ProfileSummaryProps {
  user: SessionUser;
}

const getInitials = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return '?';
  }

  return words
    .slice(0, 2)
    .map(word => word[0]?.toLocaleUpperCase() ?? '')
    .join('');
};

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ user }) => (
  <section className="profile-summary" aria-labelledby="profile-title">
    <div className="profile-summary__avatar" aria-hidden="true">
      {getInitials(user.name)}
    </div>
    <div className="profile-summary__identity">
      <p className="profile-summary__label">Tu cuenta</p>
      <h2 id="profile-title">{user.name}</h2>
      <p>{user.email}</p>
    </div>
    <div className="profile-summary__roles" aria-label="Roles asignados">
      {user.roles.length > 0 ? (
        user.roles.map(role => <IonChip key={role.id}>{role.name}</IonChip>)
      ) : (
        <p className="profile-summary__empty">Aún no tienes roles asignados.</p>
      )}
    </div>
  </section>
);

export default ProfileSummary;
