import { Router, bodyparser } from "cloudworker-router"
import { connect, DatabaseError } from '@planetscale/database';

import { formulario } from "./form"
import { auth } from "./auth"

const
	router = new Router()

router.use( bodyparser )
router.use( async (ctx,next)=>{
	try{
		return await next()
	}catch(e){
		if(e instanceof DatabaseError){
			console.log(e)
			e.message = "erro no banco de dados. mande o suporte checar o log."
		}
		return new Response(e.message,{
			status: 500
		})
	}
})

auth( router )
formulario( router )

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
		return router.handle(req, env, ctx)
	}
}