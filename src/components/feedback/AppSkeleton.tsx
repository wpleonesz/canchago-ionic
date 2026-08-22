import { IonItem, IonLabel, IonList, IonSkeletonText } from '@ionic/react';

interface AppSkeletonProps {
  rows?: number;
}

const AppSkeleton: React.FC<AppSkeletonProps> = ({ rows = 5 }) => (
  <IonList aria-hidden="true" className="app-skeleton">
    {Array.from({ length: rows }, (_, index) => (
      <IonItem key={index} lines="full">
        <IonLabel>
          <IonSkeletonText animated style={{ width: '60%' }} />
          <IonSkeletonText animated style={{ width: '40%' }} />
        </IonLabel>
      </IonItem>
    ))}
  </IonList>
);

export default AppSkeleton;
