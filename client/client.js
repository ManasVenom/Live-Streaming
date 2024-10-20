const socket = io();
        const remoteVideo = document.getElementById('remoteVideo');
        let peerConnection;
        const configuration = { iceServers: [] }; 
        const pendingCandidates = [];
        const addTrackButton = document.getElementById('addTrackButton');

        addTrackButton.addEventListener('click', () => {
            showAvailableTracks();
        });

        socket.on('offer', async offer => {
            console.log(`Offer received from host: ${JSON.stringify(offer)}`);
            peerConnection = new RTCPeerConnection(configuration);

            peerConnection.onicecandidate = event => {
                if (event.candidate) {
                    console.log(`ICE candidate created: ${JSON.stringify(event.candidate)}`);
                    socket.emit('candidate', event.candidate);
                }
            };

            try {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer', answer);
                console.log('Answer sent:', answer);
            } catch (error) {
                console.error('Error handling offer:', error);
            }

            peerConnection.ontrack = event => {
                console.log('Track event triggered');
                const remoteStream = event.streams[0];  // The stream containing the received track
                remoteVideo.srcObject = remoteStream;  // Set the remote video element's source to the stream
                console.log('Receiving remote video stream');
            }
        });

        function showAvailableTracks() {
            const receivers = peerConnection.getReceivers(); // Get available receivers
            if (receivers.length > 0) {
                console.log('Available tracks:');
                
                // Create a new MediaStream to hold the tracks
                const newStream = new MediaStream();

                receivers.forEach(receiver => {
                    console.log(`Track ID: ${receiver.track.id}, Kind: ${receiver.track.kind}, Label: ${receiver.track.label}`);
                    if (receiver.track.kind === 'video' && receiver.track.readyState === 'live') {
                        newStream.addTrack(receiver.track); // Add the track to the new stream
                    }
                });

                // Set the new stream as the source for the remote video element
                remoteVideo.srcObject = newStream;
                console.log('Displaying available video tracks in remote video element');
            } else {
                console.log('No available tracks.');
            }
        }

        socket.on('candidate', async candidate => {
            console.log(`ICE candidate received from host: ${JSON.stringify(candidate)}`);
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                console.log(`Successfully added ICE candidate: ${JSON.stringify(candidate)}`);
            } catch (error) {
                console.error('Error adding received ICE candidate:', error);
            }
        });