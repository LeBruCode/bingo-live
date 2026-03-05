
import Fastify from "fastify"
import { Server } from "socket.io"
import http from "http"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import fastifyStatic from "@fastify/static"
import path from "path"
import { fileURLToPath } from "url"
import { v4 as uuidv4 } from "uuid"

dotenv.config()

const fastify = Fastify({ logger:true })
const server = http.createServer(fastify.server)
const io = new Server(server,{cors:{origin:"*"}})

const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROWS=4
const COLS=5
const SIZE=ROWS*COLS
const MAX_CARDS=5000

const LIMITS={one:20,two:10,three:5,full:1}

let events=[]
let cards=[]
let eventIndex={}
let players={}  
let triggered=[]
let winners={one:[],two:[],three:[],full:[]}
let participants={one:[],two:[],three:[],full:[]}

function shuffle(a){return [...a].sort(()=>Math.random()-0.5)}

function generateCards(){
 for(let i=0;i<MAX_CARDS;i++){
   const card=shuffle(events).slice(0,SIZE)
   cards.push(card)
   card.forEach(ev=>{
     if(!eventIndex[ev]) eventIndex[ev]=[]
     eventIndex[ev].push(i)
   })
 }
}

function countLines(card){
 let lines=0
 for(let r=0;r<ROWS;r++){
  const row=card.slice(r*COLS,(r+1)*COLS)
  if(row.every(e=>triggered.includes(e))) lines++
 }
 return lines
}

function checkCard(index){
 const token = Object.keys(players).find(t=>players[t].cardIndex===index)
 if(!token) return

 const card=cards[index]
 const lines=countLines(card)

 if(lines>=1 && winners.one.length<LIMITS.one && !winners.one.includes(token))
   winners.one.push(token)

 if(lines>=2 && winners.two.length<LIMITS.two && !winners.two.includes(token))
   winners.two.push(token)

 if(lines>=3 && winners.three.length<LIMITS.three && !winners.three.includes(token))
   winners.three.push(token)

 if(lines>=4 && winners.full.length<LIMITS.full && !winners.full.includes(token))
   winners.full.push(token)
}

io.on("connection",(socket)=>{

 let token=socket.handshake.auth?.token
 if(!token) token=uuidv4()

 if(!players[token]){
   const index=Math.floor(Math.random()*cards.length)
   players[token]={cardIndex:index}
 }

 socket.emit("token",token)
 socket.emit("card",cards[players[token].cardIndex])
 socket.emit("state",{triggered,winners})
})

fastify.get("/api/events", async()=>{
 const {data}=await supabase.from("events").select("*").order("id")
 events=data.map(e=>e.name)
 if(cards.length===0) generateCards()
 return data
})

fastify.post("/api/trigger", async(req)=>{
 const {event}=req.body
 if(!triggered.includes(event)) triggered.push(event)

 const affected = eventIndex[event] || []
 affected.forEach(checkCard)

 io.emit("state",{triggered,winners})
 return {ok:true}
})

fastify.post("/api/participate", async(req)=>{
 const {token,stage,name,email}=req.body

 if(!winners[stage].includes(token)){
   return {error:"not eligible"}
 }

 const {data}=await supabase
  .from("contributors")
  .select("email")
  .eq("email",email)
  .single()

 if(!data){
   return {error:"email not contributor"}
 }

 if(!participants[stage].includes(token)){
   participants[stage].push(token)
 }

 await supabase.from("participations").insert({
   token,
   name,
   email,
   stage
 })

 return {ok:true}
})

fastify.get("/api/stats",()=>{
 return{
  players:Object.keys(players).length,
  winners,
  participants
 }
})

fastify.register(fastifyStatic,{
 root:path.join(__dirname,"dist"),
 prefix:"/"
})

fastify.get("*",(req,reply)=>{
 reply.sendFile("index.html")
})

server.listen({port:process.env.PORT||3000,host:"0.0.0.0"})
