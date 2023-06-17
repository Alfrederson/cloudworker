import { Router } from "cloudworker-router"
import jwt from "@tsndr/cloudflare-worker-jwt"
import validar from "./validacao/validacao"
import { calcularHash, verificarSenha } from "./crypto/crypto"
import { E } from "./util"

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
        validar .email(email)
                .senha(password)
                .nome (name) 
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
            E("provavelmente já existe uma conta com esse email ou com essa senha.")
        }
    })

    // fazer login
    router.post("/auth/signin", async ctx =>{
        const { email, password } = ctx.body
        validar .email(email) .senha(password)
        const result = await ctx.env.conn.execute(
            "SELECT id,name,email,password FROM user WHERE (email = ?)",
            [email]
        )
        let user = result.rows[0]
        if(!user || !await verificarSenha(password, user.password) )
            E("email não encontrado ou senha incorreta.")
        user.password = undefined
        return { tok : await jwt.sign(user, ctx.env.JWT_SECRET) }
    })

    // renovar o token
    router.post("/auth/refresh", async ctx => {
        const { claims } = ctx
        if( !claims )
            E("não autenticado")
        claims.iat = undefined
        return {tok : await jwt.sign( claims, ctx.env.JWT_SECRET) }
    })

    router.get("/auth/hash/:oque", async ctx =>{
        return await calcularHash(ctx.params.oque)
    })
}