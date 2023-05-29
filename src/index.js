import { Router, bodyparser } from "cloudworker-router"
import { connect, DatabaseError } from '@planetscale/database';

import { formulario } from "./form"
import { auth } from "./auth"

const
	router = new Router()

router.use( bodyparser )

router.use( async (ctx,next)=>{
	try{
		let response = await next()
		response.headers.set('Access-Control-Allow-Origin',ctx.request.headers.get("origin"))
		return response
	}catch(e){
		if(e instanceof DatabaseError){
			console.log(e)
			e.message = "erro no banco de dados. mande o suporte checar o log."
		}
		return new Response(JSON.stringify(e.message),{
			status: 400,
			headers : {
				"content-type": "application/json"
			}
		})
	}
})

auth( router )
formulario( router )

router.use(router.allowedMethods());

export default {
	async fetch(req, env, ctx){		
		const config = {
				host    : env.DATABASE_HOST,
				username: env.DATABASE_USERNAME,
				password: env.DATABASE_PASSWORD,
				fetch: (url, init) => {
					delete (init)["cache"];
					return fetch(url, init);
				}				
			}	
		// quando botei o bodyparser, colocar a conexão
		// dentro do router não deu mais certo,
		// então coloco dentro do env, que vai aparecer dentro
		// do context.

		env.conn = connect(config)
		return await router.handle(req,env,ctx)
	}
}