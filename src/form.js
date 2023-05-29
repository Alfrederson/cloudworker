import { Router } from "cloudworker-router"

/**
 * Formulário para aceitar respostas.
 * @param {Router} router 
 */
export function formulario( router ){
    // - requisição só pode ser respondida caso o usuário autenticado tenha id = tenant_id .
    router.get("/form/:tenant_id", async ctx => {
        if(!ctx.claims)
            throw new Error("não autenticado")
        const
            tenant_id = ctx.params.tenant_id
        if(ctx.claims.id != tenant_id)
            throw new Error("forminho não é seu")

        const data = await ctx.env.conn.execute('SELECT * FROM contact_form WHERE tenant_id=?', [tenant_id])
        return new Response(
            JSON.stringify(data.rows,1," ")
        )
    })

    // coloca resposta no formulário.
    router.post("/form/:tenant_id", async ctx => {
            // isso é pra contonrnar a falta de foreign key do planetscale.
            const tenant_id = ctx.params.tenant_id
            const { name, email, message } = ctx.body
            if([
                !tenant_id,
                !name    || name.length < 5     || name.length > 30,
                !email   || email.length < 5    || email.length > 30,
                !message || message.length < 10 || message.length > 500,
            ].some( x => x )){
                throw new Error("resposta inválida. checar campos name, email e message.")
            }
            // planetscale anunciou que ia ter foreign key constraint.
            // enquanto não tem, fica assim.
            const owner = await ctx.env.conn.execute('SELECT id FROM user WHERE id = ? LIMIT(1)', [ tenant_id ])
            if(owner.rows.length == 0)
                throw new Error("forminho inexistente.")

            const result = await ctx.env.conn.execute(
                'INSERT INTO contact_form(tenant_id, name, email, message) VALUES(?,?,?,?)',
                [tenant_id, name, email, message]
            )
            return new Response(
                JSON.stringify({"msg" : "registro inserido"},1," ")
            )
    })

    // deleta resposta do formulário
    router.delete("/form/:tenant_id/:contact_id", async ctx =>{
        if(!ctx.claims)
            throw new Error("não autenticado")
        const
            tenant_id = ctx.params.tenant_id,
            contact_id = ctx.params.contact_id
            
        if(ctx.claims.id != tenant_id)
            throw new Error("forminho não é seu")            

        const result = await ctx.env.conn.execute(
            'DELETE FROM contact_form WHERE tenant_id=? AND id=?',
            [tenant_id,contact_id]
        )

        if(result.rowsAffected < 1)
            throw new Error("nenhum registro removido");

        return new Response(
            JSON.stringify({"msg" : "registro removido"},1," ")
        )
    })
}