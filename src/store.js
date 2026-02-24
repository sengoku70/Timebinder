import { configureStore, createSlice } from "@reduxjs/toolkit";

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    username: null,
    theme: "dark",
    profileimg: null,
  },
  reducers: {
    setUsername: (state, action) => {
      state.username = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setProfileimg: (state, action) => {
      state.profileimg = action.payload;
    },
  },
});

export const { setUsername, setTheme, setProfileimg } = profileSlice.actions;

const store = configureStore({
  reducer: {
    profile: profileSlice.reducer,
  },
});

export default store;
