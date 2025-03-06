const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')

const { upload } = require('./utils/multer')
const bodyParser = require('body-parser')

const cors = require('cors')
app.use(
  cors({
    origin: '*',
  })
)
app.use(bodyParser.json({ limit: 1024 * 1024 * 100, type: 'application/json' }))
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: 1024 * 1024 * 100,
    type: 'application/x-www-form-urlencoded',
  })
)

const { v4: uuidv4 } = require('uuid')

const io = new Server(server, {
  cors: {
    origin: '*',
  },
})
const color = require('colors')

const port = 8001

app.use('/public', express.static('./public'))

app.post('/uploads', upload.single('file'), async (req, res) => {
  try {
    res.status(201).json({
      message: 'File uploaded successfully',
      file: req.file,
    })
  } catch (err) {
    res.status(500).json({
      message: 'Error creating product',
      error: err,
    })
  }
})

io.on('connection', (socket) => {
  console.log('Someone Connecting')
  socket.on('joinUser', (username) => {
    const userExist = USERS.find((item) => item.username === username)
    if (!userExist) {
      const user = joinUser(socket.id, username)
    }
    console.log('New User'.bgCyan, username)
    console.log('Socket Id'.bgCyan, socket.id)
    io.to(socket.id).emit('user.status', { userExist: userExist || false })
  })

  socket.on('message.send', (data) => {
    const toSendData = {
      username: data?.username,
      msg: data?.msg,
      socketId: socket.id,
      msgId: uuidv4(),
      ...(data?.selectedFile
        ? {
            selectedFile: data?.selectedFile,
            selectedFileType: data?.selectedFileType,
            originalName: data?.originalName,
          }
        : {}),
    }
    if (data?.recipients?.length) {
      for (let i = 0; i < data?.recipients?.length; i++) {
        io.to(data?.recipients[i]?.id).emit('message.listen', {
          broadcast: false,
          ...toSendData,
        })
      }
    } else {
      socket.broadcast.emit('message.listen', {
        broadcast: true,
        ...toSendData,
      })
    }
    io.to(socket.id).emit('message.listen', {
      type: 'self',
      broadcast: data?.recipients?.length ? false : true,
      ...(data?.recipients?.length ? { recipients: data?.recipients } : {}),
      ...toSendData,
    })
  })

  socket.on('getData', (username) => {
    const id = getRecipientId(username)
    io.to(id).emit(
      'getData',
      USERS.filter((item) => item.username !== username)
    )
  })

  socket.on('delete.message', (id) => {
    io.emit('listen.delete', id)
  })

  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    })
  })

  socket.on('alreadyInCall', (data) => {
    io.to(data.id).emit('alreadyInCall', data.username)
  })

  socket.on('acceptCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal)
  })

  socket.on('callDisconnect', (data) => {
    data[0] = getRecipientId(data[0])
    for (let i = 0; i < data.length; i++) {
      io.to(data[i]).emit('callDisconnected')
    }
  })

  socket.on('disconnect', () => {
    const user = userDisconnect(socket.id)
    console.log(` ${user} Disconnected`.red)
  })
})

const USERS = []

const joinUser = (id, username) => {
  const room = null
  const user = { id, username, room }
  USERS.push(user)

  return user
}

const getRecipientId = (name) => {
  const data = USERS.find((user) => user.username === name)
  return data?.id
}

const userDisconnect = (id) => {
  const index = USERS.findIndex((user) => user.id === id)

  if (index !== -1) {
    return USERS.splice(index, 1)[0]?.username
  }
}

server.listen(
  port,
  console.log(`Server is running on the port no: ${port} `.yellow)
)
