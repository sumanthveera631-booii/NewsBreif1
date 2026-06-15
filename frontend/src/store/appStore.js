import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set) => ({
      examPreference: 'UPSC', // Default fallback
      setExamPreference: (exam) => set({ examPreference: exam }),
      
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      
      bookmarkedIds: [],
      setBookmarks: (ids) => set({ bookmarkedIds: ids }),
      toggleBookmark: (id) => set((state) => ({
        bookmarkedIds: state.bookmarkedIds.includes(id)
          ? state.bookmarkedIds.filter(bId => bId !== id)
          : [...state.bookmarkedIds, id]
      })),

      // Theme UI toggles
      focusMode: false,
      setFocusMode: (val) => set({ focusMode: val }),

      // Local gamification state (syncs with backend on load)
      addXp: (amount) => set((state) => ({
        userProfile: state.userProfile 
          ? { ...state.userProfile, xp: (state.userProfile.xp || 0) + amount }
          : null
      }))
    }),
    {
      name: 'newsbrief-storage',
      partialize: (state) => ({ 
        examPreference: state.examPreference,
        bookmarkedIds: state.bookmarkedIds,
        focusMode: state.focusMode
      })
    }
  )
);
