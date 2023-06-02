import { Router } from "cloudworker-router"

import { randomString, J, E } from "./util.js"

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
            { form_name, is_public } = ctx.body;
        if(!form_name)
            E("sem form_name");
        if(form_name.length < 5)
            E("form_name curto demais")
        if(form_name.length > 30)
            E("form_name longo demais")
        if(!is_public)
            E("sem is_public")
        if(!["true","false"].includes(is_public))
            E("is_public deve ser true ou false")

        const form_id = randomString(20)

        const result = await ctx.env.conn.execute(
            "INSERT INTO forms (id,user_id,is_public,name) VALUES(?,?,?,?)",
            [form_id, ctx.claims.id, is_public === "true", form_name]
        )

        return J({
            "msg" : "forminho criado",
            "id"  : form_id
        })
    })
    // ver meus forms
    router.get("/forms", async ctx => {
        if(!ctx.claims)
            E("não autenticado")
        const formList = await ctx.env.conn.execute(
            'SELECT id,name,is_public FROM forms WHERE user_id=?',
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

    // TODO: alterar um form.

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
            formRecord = await ctx.env.conn.execute('SELECT * FROM forms WHERE id=? AND is_public=1 LIMIT 1', // molho de tomate
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