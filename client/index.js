const socket = io();

        const localVideo = document.getElementById('localVideo');
        
        let localStream;
        let peerConnection;

        const configuration = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };

        async function startStreaming() {
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                localVideo.srcObject = localStream;

                peerConnection = new RTCPeerConnection(configuration);

                localStream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, localStream);
                });

                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        console.log('Sending ICE candidate:', event.candidate);
                        socket.emit('candidate', event.candidate);
                    }
                };

                peerConnection.ontrack = event => {
                    remoteVideo.srcObject = event.streams[0];
                };

                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                console.log('Sending offer:', offer);
                socket.emit('offer', offer);

            } catch (error) {
                console.error('Error starting streaming:', error);
            }
        }

        socket.on('offer', async (offer) => {
            console.log('Received offer:', offer);
            if (!peerConnection) {
                peerConnection = new RTCPeerConnection(configuration);

                peerConnection.onicecandidate = event => {
                    if (event.candidate) {
                        console.log('Sending ICE candidate:', event.candidate);
                        socket.emit('candidate', event.candidate);
                    }
                };

                peerConnection.ontrack = event => {
                    remoteVideo.srcObject = event.streams[0];
                };

                try {
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                    const answer = await peerConnection.createAnswer();
                    await peerConnection.setLocalDescription(answer);
                    console.log('Sending answer:', answer);
                    socket.emit('answer', answer);
                } catch (error) {
                    console.error('Error handling offer:', error);
                }
            }
        });

        socket.on('answer', async (answer) => {
            console.log('Received answer:', answer);
            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (error) {
                console.error('Error handling answer:', error);
            }
        });

        socket.on('candidate', async (candidate) => {
            console.log('Received ICE candidate:', candidate);
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('Error adding received ICE candidate:', error);
            }
        });

        startStreaming();