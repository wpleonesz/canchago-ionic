import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IonIcon, IonContent, IonItem, IonLabel, IonList, IonListHeader, IonMenu, IonMenuToggle } from '@ionic/react';
import { chevronDownOutline, chevronForwardOutline, gridOutline } from 'ionicons/icons';
import type { AdminNavigationGroup } from '../navigation/admin-navigation';
import { findActiveAdminItem, isAdminPathActive } from '../navigation/admin-capabilities';

interface AdminNavigationProps {
  groups: AdminNavigationGroup[];
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({ groups }) => {
  const location = useLocation();
  const activeItem = findActiveAdminItem(groups, location.pathname);
  const activeGroup = groups.find(group => group.items.some(item => item.id === activeItem?.id));
  const activeGroupId = activeGroup?.id;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(activeGroup ? [activeGroup.id] : groups.map(group => group.id)),
  );

  useEffect(() => {
    if (!activeGroupId) return;
    setExpandedGroups(current => new Set(current).add(activeGroupId));
  }, [activeGroupId]);

  const toggleGroup = (groupId: string): void => {
    setExpandedGroups(current => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return (
    <IonMenu menuId="admin-menu" contentId="admin-content" type="overlay" className="admin-menu">
      <IonContent>
        <nav className="admin-navigation" aria-label="Navegación administrativa">
          <header className="admin-navigation__brand">
            <span className="admin-navigation__brand-icon" aria-hidden="true">
              <IonIcon icon={gridOutline} />
            </span>
            <span>
              <strong>canchago</strong>
              <small>Administración</small>
            </span>
          </header>

          <IonList lines="none" className="admin-navigation__list">
            <IonMenuToggle autoHide={false}>
              <IonItem
                routerLink="/admin"
                routerDirection="root"
                detail={false}
                className={
                  location.pathname === '/admin' ? 'admin-navigation__item is-active' : 'admin-navigation__item'
                }
                aria-current={location.pathname === '/admin' ? 'page' : undefined}
                aria-label="Inicio administrativo"
              >
                <IonIcon slot="start" icon={gridOutline} aria-hidden="true" />
                <IonLabel>Inicio administrativo</IonLabel>
              </IonItem>
            </IonMenuToggle>

            {groups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              return (
                <section key={group.id} className="admin-navigation__group">
                  <IonListHeader>
                    <button
                      type="button"
                      className="admin-navigation__group-button"
                      aria-expanded={isExpanded}
                      aria-controls={`admin-group-${group.id}`}
                      onClick={() => toggleGroup(group.id)}
                    >
                      <span>{group.label}</span>
                      <IonIcon icon={isExpanded ? chevronDownOutline : chevronForwardOutline} aria-hidden="true" />
                    </button>
                  </IonListHeader>
                  {isExpanded && (
                    <div id={`admin-group-${group.id}`}>
                      {group.items.map(item => {
                        const isActive = isAdminPathActive(location.pathname, item.path);
                        return (
                          <IonMenuToggle key={item.id} autoHide={false}>
                            <IonItem
                              routerLink={item.path}
                              routerDirection="root"
                              detail={false}
                              className={isActive ? 'admin-navigation__item is-active' : 'admin-navigation__item'}
                              aria-current={isActive ? 'page' : undefined}
                              aria-label={item.label}
                            >
                              <IonIcon slot="start" icon={item.icon} aria-hidden="true" />
                              <IonLabel>{item.label}</IonLabel>
                            </IonItem>
                          </IonMenuToggle>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </IonList>
        </nav>
      </IonContent>
    </IonMenu>
  );
};

export default AdminNavigation;
