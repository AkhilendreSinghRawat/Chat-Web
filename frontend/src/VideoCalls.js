import React, { useEffect, useRef, useState } from 'react'
import { FcEndCall, FcCallTransfer } from 'react-icons/fc'
import { BsCameraVideoOffFill, BsCameraVideo } from 'react-icons/bs'
import { AiFillAudio, AiOutlineAudioMuted } from 'react-icons/ai'
import Peer from 'simple-peer'

const VideoCalls = ({
  socket,
  recipients,
  username,
  setVideoCallInitialize,
  videoCallInitialize,
}) => {
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()
  const alreadyInCallRef = useRef()

  const socketRef = useRef()
  socketRef.current = socket

  const [videoState, setVideoState] = useState({
    stream: null,
    receivingCall: false,
    caller: '',
    callerSignal: null,
    callAccepted: false,
    callEnded: false,
    name: '',
    sentCall: false,
    alreadyInCall: false,
    alreadyInCallUsername: '',
    videoStreamON: true,
    audioStreamOn: true,
  })

  useEffect(() => {
    navigator?.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setVideoState((prev) => {
          return { ...prev, stream: stream }
        })
      })
      .catch((err) => console.log(err))

    socketRef.current.on('callUser', (data) => {
      if (
        alreadyInCallRef.current &&
        (userVideo.current ||
          alreadyInCallRef.current.receivingCall ||
          alreadyInCallRef.current.sentCall)
      ) {
        socketRef.current.emit('alreadyInCall', {
          id: data?.from,
          username: username,
        })
      } else {
        setVideoState((prev) => {
          return {
            ...prev,
            receivingCall: true,
            caller: data?.from,
            name: data?.name,
            callerSignal: data?.signal,
          }
        })
        alreadyInCallRef.current = { receivingCall: true, sentCall: false }
      }
    })

    socketRef.current.on('alreadyInCall', (username) => {
      setVideoState((prev) => {
        return { ...prev, alreadyInCall: true, alreadyInCallUsername: username }
      })
    })

    socketRef.current.on('callAccepted', (signal) => {
      setVideoState((prev) => {
        return { ...prev, callAccepted: true }
      })
      connectionRef.current.signal(signal)
    })

    socketRef.current.on('callDisconnected', () => {
      setVideoCallInitialize(false)
      setVideoState((prev) => {
        return {
          ...prev,
          receivingCall: false,
          caller: '',
          callerSignal: null,
          callAccepted: false,
          callEnded: false,
          name: '',
          sentCall: false,
        }
      })
      alreadyInCallRef.current = { receivingCall: false, sentCall: false }
      if (connectionRef.current) {
        connectionRef.current.destroy()
      }
    })

    return () => {
      socketRef.current.disconnect()
    }
  }, [])

  const callUser = (id, name) => {
    setVideoState((prev) => {
      return { ...prev, sentCall: true }
    })
    alreadyInCallRef.current = { receivingCall: false, sentCall: true }

    myVideo.current.srcObject = videoState?.stream
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: videoState?.stream,
    })
    connectionRef.current = peer

    peer.on('signal', (data) => {
      socketRef.current.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: socket.id,
        name: name,
      })
    })

    peer.on('stream', (stream) => {
      userVideo.current.srcObject = stream
    })
  }

  if (videoState?.receivingCall) {
    myVideo.current.srcObject = videoState?.stream
  }

  const acceptCall = () => {
    setVideoState((prev) => {
      return { ...prev, callAccepted: true, receivingCall: false }
    })
    alreadyInCallRef.current = { receivingCall: false, sentCall: false }

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: videoState?.stream,
    })

    peer.on('signal', (data) => {
      socketRef.current.emit('acceptCall', {
        signal: data,
        to: videoState?.caller,
      })
    })

    peer.on('stream', (stream) => {
      userVideo.current.srcObject = stream
    })
    peer.signal(videoState?.callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    if (videoState?.alreadyInCall) {
      setVideoState((prev) => {
        return { ...prev, alreadyInCall: false, alreadyInCallUsername: '' }
      })
      connectionRef.current.destroy()
      setVideoCallInitialize(false)
      return
    }
    const data = videoState?.callAccepted
      ? [videoState?.name, socket.id]
      : [recipients[0]?.username, socket.id]
    socketRef.current.emit('callDisconnect', data)
  }

  const videoCallPressed = () => {
    callUser(recipients[0]?.id, username)
    setVideoState((prev) => {
      return { ...prev, name: recipients[0]?.username }
    })
  }

  useEffect(() => {
    if (videoState?.receivingCall) {
      setVideoCallInitialize(true)
    }
  }, [videoState?.receivingCall])

  useEffect(() => {
    if (videoCallInitialize && !videoState?.receivingCall) {
      videoCallPressed()
    }
  }, [videoCallInitialize])

  const toggleVideo = () => {
    const videoTrack = videoState?.stream
      .getTracks()
      .find((track) => track.kind === 'video')
    if (videoTrack.enabled) {
      videoTrack.enabled = false
      setVideoState((prev) => {
        return { ...prev, videoStreamON: false }
      })
    } else {
      videoTrack.enabled = true
      setVideoState((prev) => {
        return { ...prev, videoStreamON: true }
      })
    }
  }

  const toggleAudio = () => {
    const audioTrack = videoState?.stream
      .getTracks()
      .find((track) => track.kind === 'audio')
    if (audioTrack.enabled) {
      audioTrack.enabled = false
      setVideoState((prev) => {
        return { ...prev, audioStreamOn: false }
      })
    } else {
      audioTrack.enabled = true
      setVideoState((prev) => {
        return { ...prev, audioStreamOn: true }
      })
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        margin: '1% 1%',
        borderRadius: '1%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {videoState?.stream ? (
          <div
            style={{
              backgroundColor: '#ddd',
              width: '48%',
              paddingBottom: '1%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
                backgroundColor: 'white',
                textAlign: 'center',
                marginRight: '1%',
                marginLeft: '1%',
              }}
            >
              You
            </div>
            <video
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'rotateY(180deg)',
                backgroundColor: '#ddd',
                width: '90%',
                paddingRight: '5%',
                height: '90%',
              }}
              playsInline
              ref={myVideo}
              muted
              autoPlay
            />
          </div>
        ) : null}
        {videoState?.callAccepted && !videoState?.callEnded ? (
          <div
            style={{
              backgroundColor: '#ddd',
              width: '48%',
              paddingBottom: '1%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
                backgroundColor: 'white',
                textAlign: 'center',
                marginRight: '1%',
                marginLeft: '1%',
              }}
            >
              {videoState?.name}
            </div>
            <video
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                transform: 'rotateY(180deg)',
                paddingRight: '5%',
                width: '90%',
                height: '90%',
              }}
              playsInline
              ref={userVideo}
              autoPlay
            />
          </div>
        ) : null}
      </div>
      {videoState?.callAccepted && !videoState?.callEnded ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            margin: '-1% 0%',
          }}
        >
          {videoState?.videoStreamON ? (
            <BsCameraVideo
              style={{
                backgroundColor: 'white',
                width: '225%',
                height: '225%',
                borderRadius: '50%',
                marginRight: '2%',
              }}
              onClick={toggleVideo}
            />
          ) : (
            <BsCameraVideoOffFill
              style={{
                backgroundColor: 'white',
                width: '225%',
                height: '225%',
                borderRadius: '50%',
                marginRight: '2%',
              }}
              onClick={toggleVideo}
            />
          )}
          <FcEndCall
            style={{
              backgroundColor: 'white',
              width: '225%',
              height: '225%',
              borderRadius: '50%',
            }}
            onClick={leaveCall}
          />
          {videoState?.audioStreamOn ? (
            <AiFillAudio
              style={{
                backgroundColor: 'white',
                width: '225%',
                height: '225%',
                borderRadius: '50%',
                marginLeft: '2%',
              }}
              onClick={toggleAudio}
            />
          ) : (
            <AiOutlineAudioMuted
              style={{
                backgroundColor: 'white',
                width: '225%',
                height: '225%',
                borderRadius: '50%',
                marginLeft: '2%',
              }}
              onClick={toggleAudio}
            />
          )}
        </div>
      ) : null}
      {!videoState?.callAccepted && !videoState?.receivingCall ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          {videoState?.alreadyInCall ? (
            <div style={{ color: 'white', fontSize: '150%' }}>
              {videoState?.alreadyInCallUsername} is already in call...
            </div>
          ) : (
            <div style={{ color: 'white', fontSize: '150%' }}>
              Calling {recipients[0]?.username}...
            </div>
          )}
          <div
            style={{
              marginRight: '2%',
              width: '15%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
            }}
          >
            {videoState?.videoStreamON ? (
              <BsCameraVideo
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '50%',
                  borderRadius: '50%',
                  marginRight: '1%',
                }}
                onClick={toggleVideo}
              />
            ) : (
              <BsCameraVideoOffFill
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '50%',
                  borderRadius: '50%',
                  marginRight: '1%',
                }}
                onClick={toggleVideo}
              />
            )}
            <FcEndCall
              style={{
                backgroundColor: 'white',
                width: '50%',
                height: '50%',
                borderRadius: '50%',
              }}
              onClick={leaveCall}
            />
            {videoState?.audioStreamOn ? (
              <AiFillAudio
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '50%',
                  borderRadius: '50%',
                  marginLeft: '1%',
                }}
                onClick={toggleAudio}
              />
            ) : (
              <AiOutlineAudioMuted
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '50%',
                  borderRadius: '50%',
                  marginLeft: '1%',
                }}
                onClick={toggleAudio}
              />
            )}
          </div>
        </div>
      ) : null}
      {videoState?.receivingCall && !videoState?.callAccepted ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '15%',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: '150%',
            }}
          >
            {videoState?.name} is calling...
          </div>
          <div
            style={{
              display: 'flex',
              width: '10%',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            <FcCallTransfer
              style={{
                backgroundColor: 'white',
                width: '35%',
                height: '90%',
                borderRadius: '50%',
                transform: 'rotate(270deg)',
              }}
              onClick={acceptCall}
            />
            <FcEndCall
              style={{
                backgroundColor: 'white',
                width: '40%',
                height: '80%',
                borderRadius: '50%',
              }}
              onClick={leaveCall}
            />
          </div>
          <div
            style={{
              display: 'flex',
              width: '8%',
              justifyContent: 'space-around',
              alignItems: 'center',
            }}
          >
            {videoState?.videoStreamON ? (
              <BsCameraVideo
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '60%',
                  borderRadius: '50%',
                  marginRight: '3%',
                }}
                onClick={toggleVideo}
              />
            ) : (
              <BsCameraVideoOffFill
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '60%',
                  borderRadius: '50%',
                  marginRight: '3%',
                }}
                onClick={toggleVideo}
              />
            )}
            {videoState?.audioStreamOn ? (
              <AiFillAudio
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '60%',
                  borderRadius: '50%',
                  marginRight: '3%',
                }}
                onClick={toggleAudio}
              />
            ) : (
              <AiOutlineAudioMuted
                style={{
                  backgroundColor: 'white',
                  width: '50%',
                  height: '60%',
                  borderRadius: '50%',
                  marginRight: '3%',
                }}
                onClick={toggleAudio}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default VideoCalls
