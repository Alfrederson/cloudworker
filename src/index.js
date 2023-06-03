import { Router, bodyparser } from "cloudworker-router"
import { connect, DatabaseError } from '@planetscale/database';

import { formulario } from "./form"
import { auth } from "./auth"

const
	router = new Router()

router.use( bodyparser )

router.use( async (ctx,next)=>{
	let response
	try{
		response = await next()
	}catch(e){
		if(e instanceof DatabaseError){
			console.log(e)
			e.message = "erro no banco de dados. mande o suporte checar o log."
		}
		response = new Response(JSON.stringify(e.message),{
			status: 400,
			headers : {
				"content-type": "application/json"
			}
		})
	}
	response.headers.set('Access-Control-Max-Age','84600')
	response.headers.set('Access-Control-Allow-Origin',"*")
	response.headers.append('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization')
	return response
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
		env.conn = connect(config)
		return await router.handle(req,env,ctx)
	}
}