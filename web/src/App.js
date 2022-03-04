import "./App.css";
import React, { Component, useEffect, useRef, useState } from "react";

import io from "socket.io-client";
import Video from "./components/Video";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { localStream: null, remoteStream: null };

    // this.localVideoref = React.createRef();
    // this.remoteVideoref = React.createRef();
    this.textRef = React.createRef();
    this.socket = null;
    this.candidates = [];
  }

  componentDidMount() {
    this.socket = io("https://5cea-196-47-128-163.ngrok.io/webrtcPeer", {
      path: "/webrtc",
      query: {},
    });

    this.socket.on("connection-success", (success) => {
      console.log("Connection success", success);
    });

    this.socket.on("offerOrAnswer", (sdp) => {
      this.textRef.value = JSON.stringify(sdp);
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    this.socket.on("candidate", (candidate) => {
      // this.candidates = [...this.candidates, candidate];
      this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    const pc_config = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    this.pc = new RTCPeerConnection(pc_config);

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        // console.log(JSON.stringify(e.candidate));
        this.sendToPeer("candidate", e.candidate);
      }
    };

    this.pc.oniceconnectionstatechange = (e) => {
      console.log(JSON.stringify(e));
    };

    this.pc.onaddstream = (e) => {
      // this.remoteVideoref.current.srcObject = e.stream;
      this.setState({ remoteStream: e.stream });
    };

    const success = (stream) => {
      window.localStream = stream;
      // this.localVideoref.current.srcObject = stream;
      this.pc.addStream(stream);
      this.setState({ localStream: stream });
    };

    const failure = (e) => {
      console.error("getUserMedia Error: ", e);
    };

    navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then(success)
      .catch(failure);
  }

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, { socketID: this.socket.id, payload });
  };

  createOffer = () => {
    console.log("Offer");
    this.pc.createOffer({ offerToReceiveVideo: 1 }).then(
      (sdp) => {
        // console.log(JSON.stringify(sdp));
        this.pc.setLocalDescription(sdp);
        this.sendToPeer("offerOrAnswer", sdp);
      },
      (e) => {}
    );
  };

  // setRemoteDescription = () => {
  //   const desc = JSON.parse(this.textRef.value);
  //   this.pc.setRemoteDescription(new RTCSessionDescription(desc));
  // };

  createAnswer = () => {
    console.log("Answer");
    this.pc.createAnswer({ offerToReceiveVideo: 1 }).then((sdp) => {
      // console.log(JSON.stringify(sdp));
      this.pc.setLocalDescription(sdp);
      this.sendToPeer("offerOrAnswer", sdp);
    });
  };

  // addCandidate = () => {
  //   // const candidate = JSON.parse(this.textRef.value);
  //   // console.log("Adding candidate.", candidate);
  //   // this.pc.addIceCandidate(new RTCIceCandidate(candidate));

  //   this.candidates.forEach((candidate) => {
  //     console.log(candidate);
  //     this.pc.addIceCandidate(new RTCIceCandidate(candidate));
  //   });
  // };

  render() {
    return (
      <div>
        <Video
          videoStyle={{
            zIndex: 2,
            position: "fixed",
            right: 0,
            width: 200,
            height: 200,
            margin: 5,
            backgroundColor: "black",
          }}
          videoStream={this.state.localStream}
          autoPlay
          muted
        />
        <Video
          videoStyle={{
            zIndex: 1,
            position: "fixed",
            bottom: 0,
            minWidth: "100%",
            minHeight: "100%",
            backgroundColor: "black",
          }}
          videoStream={this.state.remoteStream}
          autoPlay
        />
        <div style={{ zIndex: 1, position: "fixed" }}>
          <button onClick={this.createOffer}>Offer</button>
          <button onClick={this.createAnswer}>Answer</button>
          <br />
          <textarea
            ref={(ref) => {
              this.textRef = ref;
            }}
          />
        </div>
      </div>
    );
  }
}

export default App;
