import { Router } from "cloudworker-router"
import jwt from "@tsndr/cloudflare-worker-jwt"
import { calcularHash, verificarSenha } from "./crypto/crypto"

/**
 * Criar conta, fazer login.
 * @param {Router} router 
 */
export function auth( router ){
    // validação de JWT.
    router.use( async (ctx, next) =>{
        let auth = ctx.request.headers.get("authorization")
        if( !auth ||
            !auth.startsWith("Bearer ") ||
            (auth.length >= 256 + 7)   ||
            (auth.length <= 7))              // token vazio
            return next();
        const tok = auth.substring(7)
        let valid = await jwt.verify(tok, ctx.env.JWT_SECRET)
        if(!valid)
            return next();
        let claims = jwt.decode(tok).payload
        ctx.claims = claims
        return next()
    })

    // criar conta
    router.post("/auth/signup", async ctx =>{
        const { name, email, password } = ctx.body
        if([
            !name     || name.length < 5      || name.length > 30,
            !email    || email.length < 5     || email.length > 30,
            !password || password.length < 6  || password.length > 70,
        ].some( x => x )){
            throw new Error("requisição inválida. checar campos: name, email, password")
        }        
        // isso falha se violar a constraint unique do email.
        try{
            const hashedPassword = await calcularHash(password)
            const result = await ctx.env.conn.execute(
                "INSERT INTO user (name,email,password) VALUES(?,?,?)",
                [name,email.toLowerCase(),hashedPassword]
            )    
            // envia um token de autenticação se der certo.
            let user = { id: result.insertId, name, email}
            let tok = await jwt.sign(
                user,
                ctx.env.JWT_SECRET
            )
            return { tok }            
        }catch(e){
            console.log(e.message)
            throw new Error("provavelmente já existe uma conta com esse email ou com essa senha.")
        }
    })

    // fazer login
    router.post("/auth/signin", async ctx =>{
        const { email, password } = ctx.body
        if([
            !email || email.length < 5 || email.length > 30,
            !password || password.length < 6 || password.length > 70
        ].some( x => x)){
            throw new Error("requisição inválida. checar campos: email, password")
        }
        const result = await ctx.env.conn.execute(
            "SELECT id,name,email,password FROM user WHERE (email = ?)",
            [email]
        )
        if(result.rows.length == 0)
            throw new Error("email não encontrado ou senha incorreta.");
        let user = result.rows[0]

        const bate = await verificarSenha(password, user.password)
        if(!bate)
            throw new Error("email não encontrado ou senha incorreta.")
        user.password = undefined
        let tok = await jwt.sign(
            user,
            ctx.env.JWT_SECRET
        )
        return { tok }
    })

    // renovar o token
    router.post("/auth/refresh", async ctx => {
        const { claims } = ctx
        if( !claims )
            throw new Error("não autenticado")
        claims.iat = undefined
        let tok = await jwt.sign(
            claims,
            ctx.env.JWT_SECRET
        )
        return {tok}
    })

    router.get("/auth/hash/:oque", async ctx =>{
        let hash = await calcularHash(ctx.params.oque)
        return hash
    })
}