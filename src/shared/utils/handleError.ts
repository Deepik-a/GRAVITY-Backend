
import {Response} from "express"

 export function HandleError(res:Response,error:unknown,status=400){
if(error instanceof Error){
    res.status(status).json({error:error.message})
}else{

  res.status(status).json({error:"Unexpected error occurred"})  
}
}