let avatar

let lobbyForm = document.getElementById('lobby__form')
lobbyForm.addEventListener('submit',(e) => {
    e.preventDefault()
    
    if(!avatar){
        alert('you must select an avatar')
        return
    }

    let roomId = String(Math.floor(Math.random() * 500000000))

    sessionStorage.setItem('display_name', e.target.name.value)
    sessionStorage.setItem('room_name', e.target.room.value)
    window.location = `room.html?room=${roomId}`
})


let avatarOptions = document.getElementsByClassName('avatar__option')
for (let i = 0; avatarOptions.length > i; i++){
    avatarOptions[i].addEventListener('click', (e) => {

        for(let i = 0; avatarOptions.length > i; i++){

            avatarOptions[i].classList.remove('avatar__option__selected')

        }

        e.target.classList.add('avatar__option__selected')
        
        avatar = e.target.src
        sessionStorage.setItem('avatar', avatar)
    })

    

}
