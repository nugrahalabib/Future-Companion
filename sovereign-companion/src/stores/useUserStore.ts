import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserState {
  userId: string | null;
  fullName: string;
  nickname: string;
  email: string;
  age: number;
  profession: string;
  relationshipStatus: string;
  _hasHydrated: boolean;
  setUser: (data: {
    userId: string;
    fullName: string;
    nickname: string;
    email: string;
    age: number;
    profession: string;
    relationshipStatus: string;
  }) => void;
  clearUser: () => void;
}

const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  key: () => null,
  length: 0,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      fullName: "",
      nickname: "",
      email: "",
      age: 0,
      profession: "",
      relationshipStatus: "",
      _hasHydrated: false,
      setUser: (data) => set(data),
      clearUser: () =>
        set({
          userId: null,
          fullName: "",
          nickname: "",
          email: "",
          age: 0,
          profession: "",
          relationshipStatus: "",
        }),
    }),
    {
      name: "sovereign-user",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      partialize: (s) => ({
        userId: s.userId,
        fullName: s.fullName,
        nickname: s.nickname,
        email: s.email,
        age: s.age,
        profession: s.profession,
        relationshipStatus: s.relationshipStatus,
      }),
      // Flip _hasHydrated once persist finishes rehydrating. Route guards
      // wait for this flag so refresh doesn't bounce to /register during
      // the tick between mount and hydration.
      onRehydrateStorage: () => () => {
        useUserStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
