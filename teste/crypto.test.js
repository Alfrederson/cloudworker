import { calcularHash, verificarSenha } from "../src/crypto/crypto.js";


let hash = await calcularHash("senha qualquer")

console.log("Hash: ",hash)

console.log("Bora ver se bate...")

let bateu
console.log(
    bateu = await verificarSenha("senha qualquer",hash)
)

if(bateu){
    console.log("PASSOU!")
}else{
    console.log("FALHOU!")
}