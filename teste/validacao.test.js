import validar from "../src/validacao/validacao.js";

// valor e se eu espero uma exceção.
[
    ["",true],
    ["a",true],
    [undefined,true],
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

try{
    validar  .email("astolfo@bol.com")
             .nome("Rodeirico")
             .senha("qwertyoi")
}catch(e){
    console.log("FALHOU! Não deveria ter dado throw.")
}

try{
    validar .email(undefined)
            .nome(undefined)
            .senha(undefined)
}catch(e){
    console.log(e.message)
}

try{
    validar .email("arnaldo@bol.com")
            .nome(undefined)
            .senha(undefined)
}catch(e){
    console.log(e.message)
}

try{
    validar .numero(-4, )
}

