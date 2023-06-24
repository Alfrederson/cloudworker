import { Router } from "cloudworker-router"

import { randomString, E } from "./util.js"
import validar from "./validacao/validacao.js";

const COMPRIMENTO_ID_FORM = 20

function extrairForm(ctx){
    if(!ctx.body)
        E("sem body");
    let
        { name, visibility } = ctx.body
    validar .apelidoForm( name )

    if(!visibility)
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

        const form_id = randomString(COMPRIMENTO_ID_FORM)
        await ctx.env.conn.execute(
            "INSERT INTO forms (id,user_id,visibility,name) VALUES(?,?,?,?)",
            [form_id, ctx.claims.id, visibility, name]
        )

        return {
            msg : "forminho criado",
            id  : form_id
        }
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
            form_id = ctx.params.form_id

        validar . string ( form_id, "id do form",{exato : COMPRIMENTO_ID_FORM})

        const
            result = await ctx.env.conn.execute(
                'UPDATE forms SET visibility = ?, name = ? WHERE id = ? AND user_id = ?',
                [visibility, name, form_id, ctx.claims.id]
            )

        if(result.rowsAffected < 1)
            E("form inexistente ou não pertence ao usuário");
        return {
            msg       : "ok!",
            id        : form_id,
            visibility,
            name
        }
    })
    // ver meus forms
    router.get("/forms", async ctx => {
        if(!ctx.claims)
            E("não autenticado")
        const formList = await ctx.env.conn.execute(
            `SELECT forms.id, forms.name, forms.visibility, COUNT(answers.answer_id) AS answer_count
            FROM forms LEFT JOIN answers
            ON forms.id = answers.form_id
            WHERE forms.user_id=?
            GROUP BY forms.id`,
            [ctx.claims.id]
        )
        return formList.rows
    })
    // apaga um form
    router.delete("/form/:form_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        const form_id = ctx.params.form_id
        validar . string( form_id , "id do form",{exato : COMPRIMENTO_ID_FORM} )
        // apaga o form
        const deletionResult = await ctx.env.conn.execute(
            'DELETE FROM forms WHERE id=? AND user_id=?',
            [form_id, ctx.claims.id]
        )
        if (deletionResult.rowsAffected < 1){
            E("form inexistente ou a operação falhou por outro motivo")
        }
        // apaga as respostas
        const answerDeletionResult = await ctx.env.conn.execute(
            'DELETE FROM answers WHERE form_id=?',
            [form_id]
        )
        return {
            msg : "forminho apagado",
            extra: answerDeletionResult.rowsAffected + " respostas apagadas"
        }
    })

    // lista as respostas de um form.
    // isso mostra as mensagens apenas de forma abreviada.
    router.get("/form/:form_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        const
            form_id = ctx.params.form_id
        validar . string( form_id, "id do form", {exato : COMPRIMENTO_ID_FORM})
        // pega o form
        const formRecord = await ctx.env.conn.execute('SELECT * FROM forms WHERE id=? AND user_id=? LIMIT 1',
            [form_id, ctx.claims.id]
        )
        if(formRecord.rows.length == 0)
            E("forminho inexistente ou ele não é seu.")
        // pega as respostas.
        const answers = await ctx.env.conn.execute(`SELECT answer_id,ip,name,email, CONCAT(LEFT(message, 35),CASE WHEN LENGTH(message) > 35 THEN '...' ELSE '' END) as message FROM answers WHERE form_id=?`,[ctx.params.form_id])
        return {
            form    : formRecord.rows[0],
            answers : answers.rows
        }
    })      
    // ve as respostas de um form público
    // lasagna architecture
    router.get("/form/public/:form_id/:count/:from", async ctx =>{    // camada de queijo
        const
            form_id = ctx.params.form_id,
            from = parseInt(ctx.params.from),
            count= parseInt(ctx.params.count)
        validar 
            .string(form_id  , "id do form"    , {exato  : COMPRIMENTO_ID_FORM})
            .numero(from     , "inicio"        , {minimo : 0} )  
            .numero(count    , "quantidade"    , {minimo : 1,maximo : 20})

        const                                              // camada de azeitona
            formRecord = await ctx.env.conn.execute('SELECT * FROM forms WHERE id=? AND visibility="public" LIMIT 1', // molho de tomate
            [form_id])                                     // camada de maionese

        if(formRecord.rows.length == 0)
            E("forminho inexistente ou não é público.")    // camada de massa
        const 
            answers = await ctx.env.conn.execute(
                "SELECT name,message FROM answers WHERE form_id = ? ORDER BY answer_id DESC LIMIT ?, ?",
                [form_id, from, count]
            )
        return answers.rows
    })

    // le uma resposta do formulário
    router.get("/answer/:form_id/:answer_id", async ctx =>{
        if(!ctx.claims)
            E("não autenticado")
        validar
            .string( ctx.params.form_id  , "id do form"    , {exato : COMPRIMENTO_ID_FORM})
            .numero( ctx.params.answer_id, "id da resposta", {minimo:0})
        const
            answer = await ctx.env.conn.execute(`
            SELECT a.ip, a.name, a.email, a.message
            FROM answers AS a JOIN forms AS f
            ON f.id = a.form_id
            WHERE f.id = ? AND f.user_id = ? AND a.answer_id = ?
            LIMIT 1;                    
            `,[ctx.params.form_id, ctx.claims.id, ctx.params.answer_id]
            )
        if(answer.rows.length==0){
            E("resposta ou form não localizado.")
        }
        return answer.rows[0]
    })

    // deleta resposta do formulário
    router.delete("/answer/:form_id/:answer_id", async ctx => {
        if (!ctx.claims)
            E("não autenticado");
        validar
            .string( ctx.params.form_id  , "id do form"    , {exato : COMPRIMENTO_ID_FORM})
            .numero( ctx.params.answer_id, "id da resposta", {minimo:0})
        const
            result = await ctx.env.conn.execute(
            `DELETE FROM answers
            WHERE form_id=?
            AND answer_id=?
            AND form_id IN (SELECT id FROM forms WHERE id=? AND user_id=?)`,
            [ctx.params.form_id, ctx.params.answer_id, ctx.params.form_id, ctx.claims.id]
            );
    
        if (result.rowsAffected < 1)
            E("nenhum registro removido");
        
        return {"msg": "resposta removida"};
    });
  
    // coloca resposta no formulário.
    router.post("/answer/:form_id", async ctx => {
        // isso é pra contonrnar a falta de foreign key do planetscale.
        const { name, email, message } = ctx.body
        validar .string(ctx.params.form_id,"id do form",{exato:20})
                .email (email) 
                .nome  (name)
                .string(message, "mensagem", {minimo : 8, maximo : 2048})
        const result = await ctx.env.conn.execute(`
            INSERT INTO answers(form_id, name, email, message, ip)
            SELECT id, ?, ?, ?, ? FROM forms WHERE id = ? LIMIT 1
            `,[name, email, message, ctx.ip, ctx.params.form_id]);

        if (result.rowsAffected<1)
            E("form inexistente")

        return {"msg" : "resposta inserida! "+result.insertId}
    })
}