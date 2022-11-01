import React from 'react'
import DarkModeToggle from 'react-dark-mode-toggle'
import { useDispatch, useSelector } from 'react-redux'
import { changeMode } from './redux/slices/modeSlice'

const DarkModeNav = ({ width = '100vw' }) => {
  const dispatch = useDispatch()
  const isDarkMode = useSelector((state) => state.darkMode.value)

  const onToggle = () => {
    dispatch(changeMode(isDarkMode ? false : true))
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        backgroundColor: '#256D85',
        width: width,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '1vh 2vw',
        }}
      >
        <DarkModeToggle
          onChange={onToggle}
          checked={isDarkMode}
          size={'10vh'}
        />
      </div>
    </div>
  )
}

export default DarkModeNav
