import { useState, useEffect } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function useAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const [groupsSnap, usersSnap] = await Promise.all([
          getCountFromServer(collection(db, 'groups')),
          getCountFromServer(collection(db, 'users'))
        ]);
        const countData = {
          groups: groupsSnap.data().count,
          members: usersSnap.data().count
        };
        
        // Mocked engagement data for Recharts visualization
        const engagementData = [
           { name: 'Mon', active: 400, signals: 240 },
           { name: 'Tue', active: 300, signals: 139 },
           { name: 'Wed', active: 200, signals: 980 },
           { name: 'Thu', active: 278, signals: 390 },
           { name: 'Fri', active: 189, signals: 480 },
           { name: 'Sat', active: 239, signals: 380 },
           { name: 'Sun', active: 349, signals: 430 },
        ];

        setData({
          totalUsers: countData.members || 0,
          totalGroups: countData.groups || 0,
          engagementPath: engagementData,
          lastSync: new Date()
        });
      } catch (err) {
        console.error("Analytics aggregation failure:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
}
