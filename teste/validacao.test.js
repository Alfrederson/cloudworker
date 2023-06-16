import validar from "../src/validacao/validacao.js";

// valor e se eu espero uma exceção.
[
    ["",true],
    ["a",true],
    ["a@b.c",false],
    ["fulano@bol.com",false],
    ["banr718@r718.co m",true],
    ["caca@baba.com.ccc",false],
    ["fuf@bob.com.br",false]
].forEach( caso =>{
    const [email,esperaExcecao] = caso
    console.log("testando ("+email+")")
    let resultado = false
    try{
        validar.email(email)
    }catch(e){
        console.log(e.message)
        resultado=true
    }
    if(resultado!==esperaExcecao){
        console.log("FALHOU! Eu esperava que " + (esperaExcecao ? "desse" : "não desse") + "exceção")
    }
})