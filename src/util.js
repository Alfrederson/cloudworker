const letras = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890QUEIJOMINASBEMGOSTOSINHO"

function randomString(length){
    return Array.from({length}, x => letras[ (Math.random() * letras.length) | 0]).join("")
}

function E(msg){
    throw new Error(msg)
}
export { randomString, E }