let messageContainer = document.getElementById('messages')
messageContainer.scrollTop = messageContainer.scrollHeight

let appID = '4c457fa47f72419d81e9a8a34b901cbb'
let token = null
let uid = String(Math.floor(Math.random() * 232))

let urlParams = new URLSearchParams(window.location.search)

let displayName = sessionStorage.getItem('display_name')


let room = urlParams.get('room')
if(room === null || displayName === null){
    window.location = `join.html?room=${room}`
}

let myAvatar = sessionStorage.getItem('avatar')


let initiate = async () => {

    let rtmClient = await AgoraRTM.createInstance(appID)
    await rtmClient.login({uid, token})

    const channel = await rtmClient.createChannel(room)
    await channel.join()

    await rtmClient.addOrUpdateLocalUserAttributes({'name': displayName})
    
    
    channel.on('ChannelMessage', async (messageData,memberId) => {
        let data = JSON.parse(messageData.text)
        let name = data.displayName
        let avatar = data.avatar
        addMessageToDOM(data.message, memberId,name, avatar)
    
        let participants = await channel.getMembers()
        updateParticipantTotal(participants)
    })

    channel.on('MemberJoined', async (memberId) => {
        addParticipantToDOM(memberId)

        let participants = await channel.getMembers()
        updateParticipantTotal(participants)
    })

    channel.on('MemberLeft', async (memberId)=>{
        removeParticipantFromDOM(memberId)

        let participants = await channel.getMembers()
        updateParticipantTotal(participants)
    })



    let addParticipantToDOM = async (memberId) =>{
        let {name} = await rtmClient.getUserAttributesByKeys(memberId, ['name'])
        
        
        let membersWrapper = document.getElementById('participants__container')
        let memberItem = `<div id='member__${memberId}__wrapper' class="member__wrapper">
                                <span class="green__dot"></span>
                                <p>${name}</p>
                            </div>`

        membersWrapper.innerHTML += memberItem
    }

    let sendMessage = async (e) => {
        e.preventDefault()
        let message = e.target.message.value
        channel.sendMessage({text:JSON.stringify({'message' : message, 'displayName' : displayName, 'avatar': myAvatar})})
        addMessageToDOM(message,uid, displayName,myAvatar)
        e.target.reset()
    }


    let updateParticipantTotal = async (participants) =>{
        let total = document.getElementById('member__count')
        total.innerText = participants.length
    }

    let getParticipants = async () => {
        let participants = await channel.getMembers()
        updateParticipantTotal(participants)
        for(let i=0; participants.length > i;i++){
            addParticipantToDOM(participants[i])
        }
    }


    let removeParticipantFromDOM = (memberId) => {
        document.getElementById(`member__${memberId}__wrapper`).remove()
    }

   let leaveChannel = async () => {
        await channel.leave()
        rtmClient.logout()
    }
    window.addEventListener("beforeunload", leaveChannel)

    getParticipants()


    let addMessageToDOM = (messageData,memberId, displayName, avatar) =>{
        let created = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
        
        if(created.startsWith("0")){
            created = created.substring(1)
        }


        let messageWrapper = document.getElementById('messages')
        let messageItem = `<div class="message__container">
                                    <div>
                                        <img src="${avatar}" class="avatar__option"> 
                                    </div>
                                <div class="message__wrapper">
                                    <div>
                                        <strong>${displayName}</strong>
                                        <small>${created}</small>                   
                                        <p class="message">${messageData}</p>
                                    </div>
                                </div>
                    </div>`
                    
        messageWrapper.insertAdjacentHTML('beforeend', messageItem)
        // messageContainer.scrollTop = messageContainer.scrollHeight
        let lastMesssage = document.querySelector('#messages .message__container:last-child')
        lastMesssage.scrollIntoView()

    }



    let messageForm = document.getElementById('message__form')
    messageForm.addEventListener('submit', sendMessage)
}


let rtcUid = Math.floor(Math.random()* 256)
let config = {
    appId:appID,
    token:null,
    uid: rtcUid,
    channel:room,
}

let localTracks = []
let localScreenTracks;

let rtcClient = AgoraRTC.createClient({mode:'live', codec:'vp8'})
let streaming = false
let shareScreen = false


let initiateRtc = async () => {
    await rtcClient.join(config.appId, config.channel, config.token, config.uid)

    rtcClient.on('user-published', handleUserPublished)
}


let startStream = async () => {
    if(!streaming){
        streaming = true
        document.getElementById('stream-btn').innerText = 'stop streaming'
        toggleVideoStream()
    }else{
        streaming = false
        document.getElementById('stream-btn').innerText = 'start streaming'
        
        for(let i= 0;localTracks.length > 0; i++){
            localTracks[i].stop()
            localTracks[i].close()
        }

        await rtcClient.unpublish([localTracks[0], localTracks[1]])
    
    }
}




let toggleVideoStream = async () => {

     rtcClient.setClientRole('host')

     localTracks = await AgoraRTC.createMicrophoneAndCameraTracks()

    document.getElementById('user-streams').innerHTML = ''

    let player = ` <div class="video-container" id="video-wrapper-${rtcUid}">
                        <div class="video-player player" id="stream-${rtcUid}"></div>
                    </div>`


    document.getElementById('user-streams').insertAdjacentHTML('before', player)
    localTracks[1].play(`user-${rtcUid}`)

    await rtcClient.publish([localTracks[0], localTracks[1]])


}


let handleUserPublished = async () => {
    await rtcClient.subscribe(user, mediaType)

    if(mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        if(player != null){
            player.remove()
        }

        player = player = `<div class="video-container" id="video-wrapper-${rtcUid}">
                                    <div class="video-player player" id="stream-${rtcUid}"></div>
                            </div>`
        document.getElementById('video-stream').insertAdjacentHTML('beforeend', player)
        user.videoTrack.play(`stream-${user.uid}`)
    }

    if(mediaType === 'audio'){
        user.audioTrack.play(`stream-${user.uid}`)
    }
}
  

document.getElementById('stream-btn').addEventListener('click', startStream )
document.getElementById('mic-btn')
document.getElementById('camera-btn')
document.getElementById('leave-btn')




initiate()
initiateRtc()
