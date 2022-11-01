import React, { useEffect, useRef, useState } from 'react'
import { GrAttachment } from 'react-icons/gr'
import { GiCrossedBones } from 'react-icons/gi'
import { FcVideoCall } from 'react-icons/fc'
import $ from 'jquery'
import axios from 'axios'
import { useSelector } from 'react-redux'

const ChatInput = ({
  socket,
  username,
  setChatMessage,
  deleteMessage,
  setVideoCall,
  recipients,
  setRecipients,
}) => {
  const isDarkMode = useSelector((state) => state.darkMode.value)
  const ref = useRef()
  const attachFileRef = useRef()
  const chatInputRef = useRef()
  const scrollRef = useRef()
  const [allState, setAllState] = useState({
    selectedFile: null,
    selectedFileName: null,
  })
  const [cursor, setCursor] = useState(0)
  const [message, setMessage] = useState([])
  const [word, setWord] = useState('')
  const [users, setUsers] = useState([])
  const [showUsers, setShowUsers] = useState(false)

  const socketRef = useRef()
  socketRef.current = socket

  const handleFocus = (e) => {
    chatInputRef.current.classList.add('active')
  }

  const handleBlur = (e) => {
    chatInputRef.current.classList.remove('active')
  }

  useEffect(() => {
    socketRef.current.on('message.listen', (receivedData) => {
      setChatMessage((prev) => [
        ...prev,
        {
          type: receivedData?.type,
          msg: receivedData?.msg,
          username: receivedData?.username,
          id: receivedData?.msgId,
          broadcast: receivedData?.broadcast,
          sendersID: receivedData?.socketId,
          deleted: false,
          ...(receivedData?.selectedFile
            ? {
                selectedFile: receivedData?.selectedFile,
                selectedFileType: receivedData?.selectedFileType.split('/'),
                originalName: receivedData?.originalName,
              }
            : {}),
        },
      ])
    })

    socketRef.current.on('listen.delete', (id) => {
      deleteMessage(id)
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  useEffect(() => {
    if (word[0] === '@') {
      setCursor(() => {
        if (recipients.length === 0) {
          return 0
        } else {
          for (let i = 0; i < users.length; i++) {
            let flag = false
            for (let j = 0; j < recipients.length; j++) {
              if (users[i]?.id === recipients[j]?.id) {
                flag = true
              }
            }
            if (!flag) {
              return i
            }
          }
          return 0
        }
      })
      socket.emit('getData', username)
      socket.once('getData', (data) => {
        setUsers(data)
        setShowUsers(true)
        if (word.slice(1).length > 0) {
          setUsers(
            users.filter((item) =>
              String(item.username).startsWith(word.slice(1))
            )
          )
        }
      })
    } else {
      setShowUsers(false)
    }
  }, [word, message])

  const createMessage = (e) => {
    if (showUsers && (e.code === 'ArrowUp' || e.code === 'ArrowDown')) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
      e.preventDefault()
      setCursor((prev) => {
        if (
          (cursor === users.length - 1 && e.code === 'ArrowUp') ||
          (cursor === 0 && e.code === 'ArrowDown')
        ) {
          return prev
        } else {
          let count = 1
          if (e.code === 'ArrowUp') {
            for (let i = cursor + 1; i < users.length; i++) {
              let flag = false
              for (let j = 0; j < recipients.length; j++) {
                if (recipients[j].id === users[i].id) {
                  flag = true
                }
              }
              if (!flag) {
                return prev + count
              } else {
                count++
              }
            }
            return prev
          } else if (e.code === 'ArrowDown') {
            for (let i = cursor - 1; i >= 0; i--) {
              let flag = false
              for (let j = 0; j < recipients.length; j++) {
                if (recipients[j].id === users[i].id) {
                  flag = true
                }
              }
              if (!flag) {
                return prev - count
              } else {
                count++
              }
            }
            return prev
          }
        }
      })
      return
    }
    if (
      showUsers &&
      (e.code === 'Space' || e.code === 'Tab' || e.code === 'Enter')
    ) {
      for (let i = 0; i < users?.length; i++) {
        let flag = true
        for (let j = 0; j < recipients.length; j++) {
          if (recipients[j]?.id === users[i]?.id) {
            flag = false
            break
          }
        }
        if (flag) {
          setMessage((prev) => [
            ...prev,
            { word: '@' + users?.[cursor]?.username, type: 'pill' },
          ])
          setRecipients((prev) => [...prev, users?.[cursor]])
          break
        }
      }
      ref.current?.focus()
      setWord('')
      e.preventDefault()
      return
    }
    if (e.code === 'Enter') {
      sendText()
      return
    }
    if (e.code === 'Space') {
      let type = 'normal'
      setMessage((prev) => [...prev, { word, type }])
      setWord('')
    }
    if (e.code === 'Backspace' && word === '') {
      if (word.length === 0 && message.length) {
        if (message[message.length - 1]['type'] !== 'pill') {
          setWord(message[message.length - 1].word)
        }
        setMessage((prev) => {
          const newMessage = prev.slice(0, -1)
          return newMessage
        })
        setRecipients((prev) => {
          return prev.slice(0, -1)
        })
      }
    }
  }

  const sendText = () => {
    let msg = ''
    message.forEach((item) => {
      return item.type !== 'pill' ? (msg += item.word + ' ') : ''
    })
    msg = msg + word
    if (msg !== '' || allState?.selectedFile) {
      if (allState?.selectedFile) {
        axios
          .post(
            `${process.env.REACT_APP_SERVER_URL}/uploads`,
            allState?.selectedFile
          )
          .then((res) => {
            socket.emit('message.send', {
              username,
              recipients,
              msg,
              ...(allState?.selectedFile
                ? {
                    selectedFile: res?.data?.file?.path,
                    selectedFileType: res?.data?.file?.mimetype,
                    originalName: res?.data?.file?.originalname,
                  }
                : {}),
            })
          })
          .catch((err) => console.log(err))
      } else {
        socket.emit('message.send', {
          username,
          recipients,
          msg,
        })
      }
      setRecipients([])
      setMessage([])
      setWord('')
      setAllState((prev) => {
        return { ...prev, selectedFile: null, selectedFileName: null }
      })
    } else {
      alert('Empty Message!')
    }
  }

  const Item = (props) => {
    return (
      <li
        ref={props.scroll}
        className={`listContent ${props.className}`}
        onClick={() => {
          setMessage((prev) => [
            ...prev,
            { word: '@' + props.value.username, type: 'pill' },
          ])
          setRecipients((prev) => [...prev, props.value])
          setWord('')
          ref?.current?.focus()
        }}
      >
        {props.value.username}
      </li>
    )
  }

  return (
    <div>
      {showUsers && (
        <div>
          <ul
            style={
              allState?.selectedFile
                ? { marginBottom: '-2.5vh' }
                : { marginBottom: '-0.05vh' }
            }
            className="welcomeUserList"
          >
            {users.map((item, index) =>
              recipients.some(
                (reciItem) => reciItem?.id === item?.id
              ) ? null : (
                <Item
                  scroll={cursor === index ? scrollRef : null}
                  className={cursor === index ? 'listContentActive' : null}
                  key={item.id}
                  value={item}
                  index={index}
                />
              )
            )}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flex: 3 }} />
        {allState?.selectedFile ? (
          <div
            style={{
              backgroundColor: '#ddd',
              height: 'fit-content',
              display: 'flex',
              flexDirection: 'row',
              padding: '0.5vh 0.5vw',
              borderRadius: '2vh',
            }}
            className=""
          >
            <span>
              Selected File:
              {allState?.selectedFileName}
            </span>
            <GiCrossedBones
              style={{
                display: 'flex',
                margin: '0vh 0.3vw',
              }}
              onClick={() =>
                setAllState((prev) => {
                  return { ...prev, selectedFile: null, selectedFileName: null }
                })
              }
            />
          </div>
        ) : null}
        <div
          style={{
            display: 'flex',
            flex: 1,
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: isDarkMode ? 'skyblue' : 'white',
            flex: 3,
            flexWrap: 'wrap',
            height: 'fit-content',
            minHeight: '6vh',
            maxWidth: '75%',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
          }}
          className=""
          onClick={() => ref.current?.focus()}
        >
          {message?.map((item, index) => {
            return (
              <span key={index} className={`inputText ${item.type}`}>
                {item.word}
              </span>
            )
          })}
          <span className={'inputText normal'}>{word}</span>
          <span ref={chatInputRef} />
        </div>
        {recipients.length === 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            <FcVideoCall
              onClick={() => setVideoCall(true)}
              style={{
                display: 'flex',
                backgroundColor: isDarkMode ? 'skyblue' : 'white',
                height: '6vh',
                padding: '0vh 0.5vw',
                flex: 1,
              }}
            />
          </div>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <GrAttachment
            onClick={() => {
              $('#imgupload').trigger('click')
              return false
            }}
            id="OpenImgUpload"
            style={{
              display: 'flex',
              backgroundColor: isDarkMode ? 'skyblue' : 'white',
              height: '6vh',
              padding: '0vh 0.5vw',
              flex: 1,
            }}
          />
        </div>
        <input
          id="imgupload"
          className="ChatInputBox"
          type="file"
          ref={attachFileRef}
          onChange={(e) => {
            const formData = new FormData()
            formData.append('file', e?.target?.files?.[0])
            setAllState((prev) => {
              return {
                ...prev,
                selectedFile: formData,
                selectedFileName: e?.target?.files?.[0]?.name,
              }
            })
          }}
        />
        <input
          className="ChatInputBox"
          ref={ref}
          type="text"
          value={word}
          onKeyDown={(e) => createMessage(e)}
          onChange={(e) => setWord(e.target.value)}
          autoFocus="autofocus"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <button
          style={{
            display: 'flex',
            flex: 1,
            minHeight: '6vh',
            justifyContent: 'center',
            alignItems: 'center ',
            backgroundColor: isDarkMode ? '#059DC0' : '#04AA6D',
            border: 0,
            color: 'white',
            alignSelf: 'flex-end',
          }}
          className=""
          onClick={sendText}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatInput
