// src/stores/slices/postSlice.js
// 예시: 게시글 상태를 관리하는 postSlice

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  posts: [],         // 전체 게시글 목록
  selectedPost: null // 선택된 게시글
};

const postSlice = createSlice({
  name: 'post',
  initialState,
  reducers: {
    setPosts(state, action) {
      state.posts = action.payload;
    },
    selectPost(state, action) {
      state.selectedPost = action.payload;
    },
    clearSelectedPost(state) {
      state.selectedPost = null;
    },
    addPost(state, action) {
      state.posts.push(action.payload);
    },
    deletePost(state, action) {
      state.posts = state.posts.filter(post => post.id !== action.payload);
    },
  },
});

export const {
  setPosts,
  selectPost,
  clearSelectedPost,
  addPost,
  deletePost
} = postSlice.actions;

export default postSlice.reducer;
