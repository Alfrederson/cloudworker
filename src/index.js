import { Router, bodyparser } from "cloudworker-router"
import { connect, DatabaseError } from '@planetscale/database';

import { formulario } from "./form"
import { auth } from "./auth"

const
	router = new Router()

router.get("/",ctx =>{
	return new Response(`
	888888b.         d8888 888b    888      8888888b.  8888888888  d888   .d8888b.  888 
	888  "88b       d88888 8888b   888      888   Y88b       d88P d8888  d88P  Y88b 888 
	888  .88P      d88P888 88888b  888      888    888      d88P    888  Y88b. d88P 888 
	8888888K.     d88P 888 888Y88b 888      888   d88P     d88P     888   "Y88888"  888 
	888  "Y88b   d88P  888 888 Y88b888      8888888P"   88888888    888  .d8P""Y8b. 888 
	888    888  d88P   888 888  Y88888      888 T88b     d88P       888  888    888 Y8P 
	888   d88P d8888888888 888   Y8888      888  T88b   d88P        888  Y88b  d88P  "  
	8888888P" d88P     888 888    Y888      888   T88b d88P       8888888 "Y8888P"  888 
																						
	CONHEÇA A VERDADE SOBRE R718 E ASSINE A PETIÇÃO PARA BANIR O R718 DO PLANETA
	KNOW THE TRUTH ABOUT R718 AND SIGN THE PETITION TO BAN R718 FROM PLANET EARTH
	https://ban.r718.org/
	`)
})
	

router.use( bodyparser )

router.use( async (ctx,next)=>{
	// que desgraça é essa?
	if(ctx.request.method === "OPTIONS"){
		let response = await next()
		response.headers.append("Access-Control-Allow-Headers","Origin, X-Requested-With, Content-Type, Accept, Authorization")
		return response
	}
	let responseObj, status
	try{
		responseObj = await next()
	}catch(e){
		status = 400
		if(e instanceof DatabaseError){
			responseObj = {err : "erro no banco de dados. mande o suporte checar o log."}
			status = 503
		}
		responseObj = {err : e.message}
	}
	return new Response(
		JSON.stringify(responseObj),{
			status : status ?? 200,
			headers : {
				"content-type": "application/json",
				'Access-Control-Max-Age' : '84600',
				'Access-Control-Allow-Origin' : '*',
				'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
			}
		}
	)
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