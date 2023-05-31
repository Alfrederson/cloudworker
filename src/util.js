const letras = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890QUEIJOMINASBEMGOSTOSINHO"

function randomString(length){
    return Array.from({length}, x => letras[ (Math.random() * letras.length) | 0]).join("")
}

function J(obj){
    return new Response(JSON.stringify(obj,1," "))
}

function E(msg){
    throw new Error(msg)
}
export { randomString, J, E }