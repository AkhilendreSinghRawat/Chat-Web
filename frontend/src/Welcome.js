import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ChatInput from './ChatInput'
import { useLongPress } from 'use-long-press'
import Modal from 'react-modal'
import { FiChevronsDown } from 'react-icons/fi'
import { GiCrossedBones } from 'react-icons/gi'
import VideoCalls from './VideoCalls'
import { useSelector } from 'react-redux'
import DarkModeNav from './darkModeNav'

const Welcome = ({ socket }) => {
  const isDarkMode = useSelector((state) => state.darkMode.value)
  const { state } = useLocation()
  const [allState, setAllState] = useState({
    modalIsOpen: false,
    selectedItem: null,
  })
  const [chatMessages, setChatMessage] = useState([])
  const [videoCall, setVideoCall] = useState(false)
  const [recipients, setRecipients] = useState([])

  const ref = useRef()
  const stateRef = useRef()
  stateRef.current = chatMessages

  const useIsInViewport = (ref) => {
    const [isIntersecting, setIsIntersecting] = useState(false)

    const observer = useMemo(
      () =>
        new IntersectionObserver(([entry]) =>
          setIsIntersecting(entry.isIntersecting)
        ),
      []
    )

    useEffect(() => {
      observer.observe(ref.current)

      return () => {
        observer.disconnect()
      }
    }, [ref, observer])

    return isIntersecting
  }

  const bind = useLongPress((_, item) => {
    setAllState((prev) => {
      return { ...prev, modalIsOpen: true, selectedItem: item?.context }
    })
  })

  const closeModal = () => {
    setAllState((prev) => {
      return { ...prev, modalIsOpen: false, selectedItem: null }
    })
  }

  const deleteMessage = (id) => {
    stateRef.current.forEach((item) => {
      if (item?.id === id) {
        item?.deleted
          ? setChatMessage(stateRef.current.filter((item) => item?.id !== id))
          : setChatMessage(
              stateRef.current.map((item) => {
                if (item?.id === id) {
                  item.deleted = true
                }
                return item
              })
            )
      }
    })
    closeModal()
  }

  const deleteForEveryone = () => {
    socket.emit('delete.message', allState?.selectedItem?.id)
  }
  const isInViewport = useIsInViewport(ref)

  useEffect(() => {
    if (isInViewport) {
      ref.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatMessages])

  const customStyles = {
    content: {
      width: 'fit-content',
      height: 'fit-content',
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: isDarkMode ? '#0074B7' : 'white',
      color: isDarkMode ? 'white' : 'black',
    },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div
        style={{
          display: videoCall ? 'flex' : 'none',
          flex: 3,
          backgroundColor: '#ddd',
        }}
      >
        <VideoCalls
          socket={socket}
          username={state.username}
          videoCallInitialize={videoCall}
          recipients={recipients}
          setVideoCallInitialize={setVideoCall}
        />
      </div>
      <div
        style={{ display: 'flex', flex: 1 }}
        className="welcomeContainer height100"
      >
        <Modal
          isOpen={allState.modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Options</span>
              <GiCrossedBones
                onClick={() =>
                  setAllState((prev) => {
                    return { ...prev, modalIsOpen: false }
                  })
                }
              />
            </div>
            {allState?.selectedItem?.deleted ? null : (
              <span
                style={{ padding: '1vh 1vw' }}
                className={isDarkMode ? 'modalHoverDark' : 'modalHover'}
                onClick={() => {
                  navigator.clipboard.writeText(allState?.selectedItem?.msg)
                  closeModal()
                }}
              >
                Copy Message
              </span>
            )}
            <span
              style={{ padding: '1vh 1vw' }}
              className={isDarkMode ? 'modalHoverDark' : 'modalHover'}
              onClick={() => deleteMessage(allState?.selectedItem?.id)}
            >
              Delete For Me
            </span>
            {allState?.selectedItem?.deleted ||
            !allState?.selectedItem?.type ? null : (
              <span
                style={{ padding: '1vh 1vw' }}
                className={isDarkMode ? 'modalHoverDark' : 'modalHover'}
                onClick={deleteForEveryone}
              >
                Delete For Everyone
              </span>
            )}
          </div>
        </Modal>
        <DarkModeNav width={videoCall ? '25vw' : '100vw'} />
        <div className="chatMessageContainer">
          {chatMessages?.map((item, index) => {
            return (
              <div
                {...bind(item)}
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'rgb(0,100,100)',
                  width: 'fit-content',
                  color: '#D9EEE1',
                  padding: '1vh 1vw',
                  margin: '1vh 1vw',
                  flexWrap: 'wrap',
                  wordWrap: 'break-word',
                  wordBreak: 'break-word',
                  maxWidth: '78%',
                  borderRadius: '0vw 1vw 1vw 1vw',
                  ...(item?.type === 'self'
                    ? {
                        alignSelf: 'flex-end',
                        color: isDarkMode ? 'white' : '#1D2A35',
                        backgroundColor: isDarkMode ? '#0074B7' : '#D9EEE1',
                        borderRadius: '1vw 0vw 1vw 1vw',
                      }
                    : {}),
                }}
                className="elevation"
              >
                <span style={{ fontSize: '1.5vh' }}>
                  {item?.broadcast ? 'Broadcasted' : 'Private Message'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                  <span style={{ fontWeight: 'bold', wordBreak: 'normal' }}>
                    {item?.type === 'self' ? 'You' : `@${item.username}`}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {item?.selectedFile && !item?.deleted ? (
                      <a
                        download
                        href={`${process.env.REACT_APP_SERVER_URL}/${item?.selectedFile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item?.selectedFileType?.[0] === 'image' ? (
                          <img
                            src={`${process.env.REACT_APP_SERVER_URL}/${item?.selectedFile}`}
                            alt="Images"
                            style={{
                              width: videoCall ? '12vw' : '20vw',
                              height: '25vh',
                              borderRadius: '1vw',
                              marginLeft: '1vw',
                              marginBottom: '1vh',
                              marginTop: '1vh',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              padding: '0vh 1vw',
                              ...(item?.type
                                ? {
                                    color: 'black',
                                    textDecorationColor: 'black',
                                  }
                                : {
                                    color: '#D9EEE1',
                                    textDecoration: 'underline',
                                    textDecorationColor: '#D9EEE1',
                                  }),
                            }}
                          >
                            {item?.originalName}
                          </div>
                        )}
                      </a>
                    ) : null}
                    <span
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        marginLeft: '1vw',
                      }}
                    >
                      {item?.deleted ? 'This message was deleted' : item?.msg}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {chatMessages?.length && !isInViewport ? (
            <FiChevronsDown
              onClick={() => {
                ref.current?.scrollIntoView({ behavior: 'smooth' })
              }}
              style={{
                backgroundColor: '#ddd',
                padding: '0.5% 0.5%',
                borderRadius: '50%',
                position: 'absolute',
                right: '1.5%',
                bottom: '7%',
              }}
            />
          ) : null}
          <div ref={ref} />
        </div>
        <ChatInput
          socket={socket}
          username={state.username}
          recipients={recipients}
          setVideoCall={setVideoCall}
          deleteMessage={deleteMessage}
          setChatMessage={setChatMessage}
          setRecipients={setRecipients}
        />
      </div>
    </div>
  )
}

export default Welcome
