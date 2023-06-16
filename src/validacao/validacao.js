const validar = {
    email(email){
        if(email.length<1)
            throw new Error("email curto demais")
        const emailPattern = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
        if(!emailPattern.test(email))
            throw new Error("email não parece válido")
    },
    senha(senha){
        if(senha.length<6)
            throw new Error("senha menor do que 6 caracteres")
        if(senha.length>70)
            throw new Error("senha maior do que 70 caracteres")
    },
    nome(nome){
        if(nome.length<3)
            throw new Error("nome mais curto do que o meu")
        if(nome.length>64)
            throw new Error("sistema não aceita nomes da realeza (>64 caracteres)")
    }
}

export default validar

