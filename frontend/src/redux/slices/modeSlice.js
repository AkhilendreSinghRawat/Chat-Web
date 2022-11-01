import { createSlice } from '@reduxjs/toolkit'

export const darkModeSlice = createSlice({
  name: 'darkmode',
  initialState: {
    value: false,
  },
  reducers: {
    changeMode: (state) => {
      state.value = state.value ? false : true
    },
  },
})

export const { changeMode } = darkModeSlice.actions

export default darkModeSlice.reducer
