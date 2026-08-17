import { useEffect, useState } from 'react';
import { presenceService } from '../services/presenceService';

export function useGlobalPresence(currentUser) {
  const [onlineUserIds, setOnlineUserIds] = useState(() => presenceService.getOnlineUserIds());

  useEffect(() => {
    if (currentUser?.id) {
      presenceService.track(currentUser);
    } else {
      presenceService.untrack();
    }
  }, [currentUser?.id, currentUser?.name, currentUser?.role, currentUser?.avatar]);

  useEffect(() => {
    const unsubscribe = presenceService.subscribe((ids) => {
      setOnlineUserIds(ids);
    });
    return unsubscribe;
  }, []);

  const isUserOnline = (userId) => {
    return presenceService.isUserOnline(userId);
  };

  return {
    onlineUserIds,
    isUserOnline
  };
}
