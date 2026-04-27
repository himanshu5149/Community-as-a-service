import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface SearchResult {
  id: string;
  type: 'group' | 'message' | 'member' | 'event';
  title: string;
  subtitle: string;
  link: string;
  data: any;
}

export function useSearch(searchTerm: string) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      const output: SearchResult[] = [];

      try {
        // Search Groups
        const groupsPath = 'groups';
        const groupsSnap = await getDocs(query(
          collection(db, groupsPath),
          limit(5)
        ));
        groupsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            output.push({
              id: doc.id,
              type: 'group',
              title: data.name,
              subtitle: data.description,
              link: `/groups/${doc.id}`,
              data
            });
          }
        });

        // Search Members
        const usersPath = 'users';
        const usersSnap = await getDocs(query(
          collection(db, usersPath),
          limit(5)
        ));
        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.displayName?.toLowerCase().includes(searchTerm.toLowerCase())) {
            output.push({
              id: doc.id,
              type: 'member',
              title: data.displayName,
              subtitle: 'Active Operator',
              link: `/members`,
              data
            });
          }
        });

        setResults(output);
      } catch (error) {
        // We don't want to throw here as it might crash the search UI, but we log it correctly.
        try {
           handleFirestoreError(error, OperationType.GET, 'search');
        } catch(e) {
           console.error("Search error:", e);
        }
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return { results, loading };
}
