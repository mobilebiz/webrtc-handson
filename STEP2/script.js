$(function(){

    let localStream = null;
    let videoRoom = null;

    navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then(stream => {
            $('#myStream').get(0).srcObject = stream;
            localStream = stream;
        }).catch(error => {
            console.error(`mediaDevice.getUserMedia() error: ${error}`);
            return;
        });
    
    $('#make-call').submit((e) => {
        e.preventDefault();
        
        $.getJSON(`../video-token`, function (tokenResponse) {
            console.log(tokenResponse.token);

            // ルームに接続
            Twilio.Video.connect(tokenResponse.token, {
                name: 'videoRoom',
            })
            .then(room => {
                console.log(`Connected to Room ${room.name}`);
                $('#my-id').text(room.localParticipant.identity);
                videoRoom = room;

                room.participants.forEach(participantConnected);
        
                room.on('participantConnected', participantConnected);
                room.on('participantDisconnected', participantDisconnected);
                room.once('disconnected', error => room.participants.forEach(participantDisconnected));

                $('#make-call').hide();
                $('#end-call').show();            
            });
        });
    });
    
    $('#end-call').click(() => {
        videoRoom.disconnect();
        console.log(`Disconnected to Room ${videoRoom.name}`);
        $('#make-call').show();
        $('#end-call').hide();   
    });

    function participantConnected(participant) {
        console.log(`Participant ${participant.identity} connected'`);

        const videoDom = document.createElement('div');
        videoDom.id = participant.sid;
        videoDom.className = 'videoDom';
        participant.on('trackAdded', track => trackAdded(videoDom, track));
        participant.tracks.forEach(track => trackAdded(videoDom, track));
        participant.on('trackRemoved', trackRemoved);

        $('.videosContainer').append(videoDom);
        
    }

    function trackAdded(videoDom, track) {
        videoDom.appendChild(track.attach());
    }

    function trackRemoved(track) {
        track.detach().forEach(element => element.remove());
    }

    function participantDisconnected(participant) {
        console.log(`Participant ${participant.identity} disconnected.`);

        participant.tracks.forEach(trackRemoved);
        document.getElementById(participant.sid).remove();
    }

});