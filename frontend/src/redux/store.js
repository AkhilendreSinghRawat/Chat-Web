import { configureStore } from '@reduxjs/toolkit'
import darkModeSliceReducer from './slices/modeSlice'

export default configureStore({
  reducer: {
    darkMode: darkModeSliceReducer,
  },
})
