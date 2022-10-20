import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import io from 'socket.io-client'
import React from 'react'
import Home from './Home'
import Welcome from './Welcome'

const socket = io.connect(process.env.REACT_APP_SERVER_URL)

const App = () => {
  return (
    <div className="App">
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
