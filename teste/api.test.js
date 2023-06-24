const URL = "http://127.0.0.1:8787/"

function delay(tempo){
    return new Promise( (resolve,reject)=>{
        setTimeout( resolve, tempo)
    })
}
function falhou(...msg){
    console.error("ERRO: ",msg)
    process.exit()
}
function testar(nome){
    console.log("TESTANDO ",nome)
}


function post(path, data, token){
    let headers = new Headers()
    if(token){
        headers.append("Authorization","Bearer "+token)
    }
    if(data){
        headers.append("Content-Type","application/json")
    }
    let requestOptions = {
        method  : 'POST',
        headers : headers
    }
    if(data){
        requestOptions.body = JSON.stringify(data)
    }
    return fetch(URL + path,requestOptions)
}
function get(path, token){
    return fetch(URL + path,{
        method : "GET",
        headers :  token ? {
            "Authorization" : "Bearer "+token
        } : {}
    })
}

await delay(2500)

let response, obj, tok

{testar("se está vivo...")
    response = await fetch(URL)
    if(response.status !== 200)
        falhou("status code não é 200", response.status)
}

{testar("login com usuário inválido...")
    response = await post("auth/signin",{
            email : "blablabla@naoeiste.com",
            password : "senha que ninguem usa"
        })
    if(response.status != 400){
        falhou("deveria responder com 400")
    }
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("err"))
        falhou("resposta deveria ter campo err")
}

{testar("criacação de conta inválida...")
    response = await post("auth/signup",{
        email : "isso não é um email",
        name : "fulanosvaldo da silva",
        password : "123456"
    })
    if(response.status != 400)
        falhou("deveria ter dado 400")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("err"))
        falhou("resposta deveria ter campo err")
}

{testar("criação de conta válida...")
    response = await post("auth/signup",{
        name : "Teste Maneiro",
        email: "teste@maneiro.com",
        password: "123456"
    })
    if(response.status !== 200)
        falhou("deveria ter dado 200")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("tok"))
        falhou("resposta deveria ter um token de autenticação")
}

{testar("login da conta recém-criada")
    response = await post("auth/signin",{
        email : "teste@maneiro.com",
        password: "123456"
    })
    if(response.status !== 200)
        falhou("deveria ter dado 200")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("tok"))
        falhou("resposta deveria ter enviado um token de autenticação")
    tok = obj.tok
}
{testar("refresh de token inválido")
    response = await post("auth/refresh",undefined,"TOKEN MUITO INVÁLIDO")
    if(response.status !== 400)
        falhou("deveria ter dado 400")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("err"))
        falhou("resposta deveria ter campo err")
}
{testar("refresh de token válido")
    response = await post("auth/refresh",undefined, tok )
    if(response.status !== 200)
        falhou("deveria ter dado 200")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("tok"))
        falhou("resposta deveria ter token renovado")
    tok = obj.tok
}

{testar("ver forms sem mandar o token")
    response = await get("forms")
    if(response.status !== 400)
        falhou("deveria ter dado 400")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("err"))
        falhou("resposta deveria ter campo err")
}
{testar("ver forms mandando o token")
    response = await get("forms",tok)
    if(response.status !== 200)
        falhou("deveria ter dado 200")
    obj = await response.json()
    console.log(obj)
    if(!obj.hasOwnProperty("length"))
        falhou("deveria ter length")
}

{testar("criar form")

}

// TODO:criação de form
// TODO:ver form
// TODO:editar form
// TODO:apagar form

// TODO:responder form
// TODO:apagar resposta do form
// TODO:ver todas respostas de um form público
// TODO:ver todas respostas de um form privado estando logado
// TODO:ver todas respostas de um form privado não estando logado
// sei lá o que mais

await delay(1000)