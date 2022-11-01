import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'

const Home = ({ socket }) => {
  const isDarkMode = useSelector((state) => state.darkMode.value)
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [userExistVisible, setUserExistVisible] = useState(false)
  const sendData = () => {
    if (username !== '') {
      socket.emit('joinUser', username)
    } else {
      alert('username are must !')
      window.location.reload()
    }
  }

  const showUserExist = () => {
    setUserExistVisible(true)
    setTimeout(() => setUserExistVisible(false), 1000)
  }

  useEffect(() => {
    socket.on('user.status', (data) => {
      const { userExist } = data
      if (userExist === false) {
        navigate(`/welcome/username:${username}`, {
          state: { username: username },
        })
      } else {
        showUserExist()
      }
    })
  }, [navigate, socket, username])

  return (
    <div className="center height100 homeContainer">
      {userExistVisible && (
        <div style={{ color: isDarkMode ? 'white' : 'darkRed' }}>
          UserName Already Exist...
        </div>
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <input
          style={{
            outline: 'none',
            width: '20vw',
            padding: '1vh 1vw',
            marginBottom: '1vh',
            borderRadius: '10vh',
            border: '0',
          }}
          onKeyDown={(e) => {
            if (e.code === 'Enter') sendData()
          }}
          placeholder="Input Your Name"
          value={username}
          onChange={(e) => {
            if (e.target.value !== ' ') {
              setUsername(e.target.value)
            }
          }}
          autoFocus="autofocus"
        />
        <button
          style={{
            width: '10vw',
            padding: '1vh 1vw',
            backgroundColor: 'beige',
            borderRadius: '10vh',
            border: '1px solid black',
          }}
          onClick={sendData}
        >
          Join
        </button>
      </div>
    </div>
  )
}

export default Home
