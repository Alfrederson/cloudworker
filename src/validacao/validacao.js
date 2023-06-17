/**
 * @typedef  {Object} CriteriosNumericos
 * @property {boolean | undefined} positivo
 * @property {number  | undefined} minimo
 * @property {number  | undefined} maximo
 */
/**
 * @typedef {Object} CriteriosString
 * @property {number | undefined} minimo
 * @property {number | undefined} maximo
 * @property {number | undefined} exato
 */
const validar = {
    email(email){
        if(!email)
            throw new Error("sem email")
        if(email.length<1)
            throw new Error("email curto demais")
        const emailPattern = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
        if(!emailPattern.test(email))
            throw new Error("email não parece válido")
        return validar
    },
    senha(senha){
        if(!senha)
            throw new Error("sem senha")
        if(senha.length<6)
            throw new Error("senha menor do que 6 caracteres")
        if(senha.length>70)
            throw new Error("senha maior do que 70 caracteres")
        return validar
    },
    nome(nome){
        if(!nome)
            throw new Error("sem nome")
        if(nome.length<3)
            throw new Error("nome mais curto do que o meu")
        if(nome.length>64)
            throw new Error("sistema não aceita nomes da realeza (>64 caracteres)")
        return validar
    },
    apelidoForm(apelido){
        if(!apelido)
            throw new Error("sem apelido")
        if(apelido.length < 3)
            throw new Error("apelido curto demais")
        if(apelido.length > 128)
            throw new Error("apelido comprido demais")
        return validar
    },
    /**
     * @param {number} n
     * @param {string} nome
     * @param {CriteriosNumericos} criterios
     * */
    numero(n, nome, criterios){
        if(isNaN(n) || n === undefined || n === null)
            throw new Error(nome + " não é um número")
        if(criterios.positivo && n <= 0)
            throw new Error(nome + " deve ser maior que zero")
        if(criterios.minimo   && n < criterios.minimo)
            throw new Error(nome + " deve ser maior que "+criterios.minimo)
        if(criterios.maximo   && n > criterios.maximo)
            throw new Error(nome + " deve ser menor que "+criterios.maximo)
        return validar
    },

    /**
     * 
     * @param {string} s 
     * @param {string} nome 
     * @param {CriteriosString} criterios 
     */
    string(s, nome, criterios){
        if(!s || s === undefined || s === null)
            throw new Error(nome +" vazio")
        if(criterios.exato && s.length !== criterios.exato)
            throw new Error(nome + " deve ter "+criterios.exato+" caracteres")
        if(criterios.minimo && s.length < criterios.minimo)
            throw new Error(nome + " deve ter pelo menos "+criterios.minimo+" caracteres")
        if(criterios.maximo && s.length > criterios.maximo)
            throw new Error(nome + " deve ter até "+criterios.maximo+" caracteres")
        return validar
    }
}

export default validar

