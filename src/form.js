import { Router } from "cloudworker-router"

import { randomString, J, E } from "./util.js"



function extrairForm(ctx){
    if(!ctx.body)
        E("sem body");
    let
        { name, visibility } = ctx.body
    if(name == undefined)
        E("sem name");
    if(name.length < 5)
        E("name menor que 5 caracteres")
    if(name.length > 128)
        E("name maior que 128 caracteres")
    if(visibility == undefined)
        E("sem visibility")

    visibility = visibility.toLowerCase()
    if(!["public","private"].includes(visibility))
        E("visibility deve ser private ou public")

    return { name, visibility }
}
/**
 * Formulário para aceitar respostas.
 * @param {Router} router 
 */
export function formulario( router ){

    // cria um form
    router.post("/form", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        const
            { name, visibility } = extrairForm(ctx);

        const form_id = randomString(20)
        const result = await ctx.env.conn.execute(
            "INSERT INTO forms (id,user_id,visibility,name) VALUES(?,?,?,?)",
            [form_id, ctx.claims.id, visibility, name]
        )

        return J({
            "msg" : "forminho criado",
            "id"  : form_id
        })
    })
    // editar um form
    //
    // body:
    // {
    //    "name" : nome do form,    
    //    "visibility" : "public" ou "private"
    // }
    router.put("/form/:form_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        const
            { name, visibility } = extrairForm(ctx),

            form_id = ctx.params.id,

            result = await ctx.env.conn.execute(
                'UPDATE forms SET visibility = ?, name = ? WHERE id = ? AND user_id = ?',
                [visibility, name, form_id, ctx.claims.id]
            )

        if(result.rowsAffected == 0)
            E("form inexistente ou não pertence ao usuário");
        return J({
            "msg"       : "ok!",
            "id"        : id,
            "visibility": visibility,
            "name"      : name
        })
    })

    // ver meus forms
    router.get("/forms", async ctx => {
        if(!ctx.claims)
            E("não autenticado")
        const formList = await ctx.env.conn.execute(
            'SELECT id,name,visibility FROM forms WHERE user_id=?',
            [ctx.claims.id]
        )
        return J( formList.rows )
    })
    // apaga um form
    router.delete("/form/:form_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        // apaga o form
        const deletionResult = await ctx.env.conn.execute(
            'DELETE FROM forms WHERE id=? AND user_id=?',
            [ctx.params.form_id, ctx.claims.id]
        )
        if (deletionResult.rowsAffected == 0){
            E("form inexistente ou a operação falhou por outro motivo")
        }
        // apaga as respostas
        const answerDeletionResult = await ctx.env.conn.execute(
            'DELETE FROM answers WHERE form_id=?',
            [ctx.params.form_id]
        )
        return J({
            "msg" : "forminho apagado",
            "extra": answerDeletionResult.rowsAffected + " respostas apagadas"
        })
    })

    // ve as respostas de um form
    router.get("/form/:form_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        const formRecord = await ctx.env.conn.execute('SELECT * FROM forms WHERE id=? AND user_id=? LIMIT 1',
            [ctx.params.form_id, ctx.claims.id]
        )
        if(formRecord.rows.length == 0)
            E("forminho inexistente ou ele não é seu.")
        // pega as respostas.
        const answers = await ctx.env.conn.execute('SELECT answer_id,name,email,message FROM answers WHERE form_id=?',[ctx.params.form_id])
        return J({
            form : formRecord.rows[0],
            answers : answers.rows
        })
    })

    // ve as respostas de um form público
    // lasagna architecture
    router.get("/form/public/:form_id/:count/:from", async ctx =>{    // camada de queijo
        const                                                         // camada de azeitona
            formRecord = await ctx.env.conn.execute('SELECT * FROM forms WHERE id=? AND visibility="public" LIMIT 1', // molho de tomate
            [ctx.params.form_id])                                     // camada de maionese

        if(formRecord.rows.length == 0)
            E("forminho inexistente ou não é público.")               // camada de massa

        const 
            answers = await ctx.env.conn.execute(
                "SELECT name,message FROM answers WHERE form_id = ? ORDER BY answer_id DESC LIMIT ?, ?",
                [ctx.params.form_id, parseInt(ctx.params.from), parseInt(ctx.params.count)]
            )
        return J( answers.rows )
    })

    // deleta resposta do formulário
    router.delete("/answer/:form_id/:answer_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        // pega o dono.
        const 
            formRecord = await ctx.env.conn.execute('SELECT * FROM forms WHERE id=? AND user_id=?',[ctx.params.form_id, ctx.claims.id])
        if(formRecord.rows.length==0)
            E("forminho inexistente ou não é seu.")
        
        const result = await ctx.env.conn.execute(
            'DELETE FROM answers WHERE form_id=? AND answer_id=?',
            [ctx.params.form_id,ctx.params.answer_id]
        )
        if(result.rowsAffected < 1)
            E("nenhum registro removido");
        return J({"msg" : "resposta removida"})
    })

    // coloca resposta no formulário.
    router.post("/answer/:form_id", async ctx => {
        // isso é pra contonrnar a falta de foreign key do planetscale.
        const { name, email, message } = ctx.body
        if([
            !name    || name.length < 5     || name.length > 30,
            !email   || email.length < 5    || email.length > 30,
            !message || message.length < 10 || message.length > 500,
        ].some( x => x )){
            E("resposta inválida. checar campos name, email e message.")
        }
        // planetscale anunciou que ia ter foreign key constraint.
        // enquanto não tem, fica assim.
        const form = await ctx.env.conn.execute('SELECT id FROM forms WHERE id = ? LIMIT(1)', [ ctx.params.form_id ])
        if(form.rows.length == 0)
            E("forminho inexistente.")

        const result = await ctx.env.conn.execute(
            'INSERT INTO answers(form_id, name, email, message) VALUES(?,?,?,?)',
            [ctx.params.form_id, name, email, message]
        )

        return J({"msg" : "resposta inserida!"})
    })
}