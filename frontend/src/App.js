import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import io from 'socket.io-client'
import React from 'react'
import Home from './Home'
import Welcome from './Welcome'
import { useSelector } from 'react-redux'

const socket = io.connect(process.env.REACT_APP_SERVER_URL)

const App = () => {
  const isDarkMode = useSelector((state) => state.darkMode.value)
  return (
    <div style={{ backgroundColor: isDarkMode ? '#0c2d48' : 'lightblue' }}>
      <Router>
        <Routes>
          <Route path="/" exact element={<Home socket={socket} />} />
          <Route
            path="/welcome/username:username"
            element={<Welcome socket={socket} />}
          />
        </Routes>
      </Router>
    </div>
  )
}

export default App
