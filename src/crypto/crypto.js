//import crypto from "crypto"

const COMPRIMENTO_SAL = 32
function gerarSal() {
    const array = new Uint8Array(COMPRIMENTO_SAL);
    crypto.getRandomValues(array);
    return array;
}
function base64toUint8Array(base64String) {
    const binaryString = atob(base64String);
    const length = binaryString.length;
    const uint8Array = new Uint8Array(length);
    for ( let i = 0; i < length; uint8Array[i] = binaryString.charCodeAt(i++) );
    return uint8Array;
}

/**
 * Calcula a hash de uma senha.
 * @param {string} senha 
 * @param {string|undefined} sal
 */
async function calcularHash(senha,sal){
    // gerar o salzinho
    let salzinho = sal ?? gerarSal()
    const encodada = (new TextEncoder()).encode(senha) // into the garbage it goes
    const concatenada = new Uint8Array(salzinho.length + encodada.length)
    concatenada.set(salzinho,0)
    concatenada.set(encodada,salzinho.length)
    const hashBuffer = await crypto.subtle.digest('SHA-256',concatenada)
    return btoa( String.fromCharCode.apply(null, new Uint8Array(hashBuffer))) + "." +
           btoa( String.fromCharCode.apply(null, new Uint8Array(salzinho)))
}

/**
 * Verifica se uma senha produz a mesma hash que uma referencia.
 * @param {string} senha
 * @param {string} hashReferencia
 */

async function verificarSenha(senha,hashReferencia){
    try{
        let partes = hashReferencia.split(".")
        if(partes.length !== 2)
            return false
        let salDecodificado = base64toUint8Array(partes[1])
        if(salDecodificado.length !== COMPRIMENTO_SAL)
            return false
        let hashCalculado = await calcularHash(senha,salDecodificado)
        if(hashCalculado === hashReferencia)
            return true
    }catch(e){
        console.log(e)
    }
    return false
}

export { calcularHash, verificarSenha }