
import Fastify from "fastify"
import { Server } from "socket.io"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import fastifyStatic from "@fastify/static"
import path from "path"
import { fileURLToPath } from "url"
import { v4 as uuidv4 } from "uuid"

dotenv.config()

const fastify = Fastify({ logger:true })

const io = new Server(fastify.server,{
  cors:{origin:"*"}
})

const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROWS = 4
const COLS = 5
const SIZE = ROWS * COLS
const MAX_CARDS = 5000

let events = []
let cards = []
let eventIndex = {}
let players = {}
let triggered = []
let winners = {one:[],two:[],three:[],full:[]}

function shuffle(a){
 return [...a].sort(()=>Math.random()-0.5)
}

function generateCards(){
 for(let i=0;i<MAX_CARDS;i++){
   const card = shuffle(events).slice(0,SIZE)
   cards.push(card)

   card.forEach(ev=>{
     if(!eventIndex[ev]) eventIndex[ev] = []
     eventIndex[ev].push(i)
   })
 }
}

function countLines(card){
 let lines = 0
 for(let r=0;r<ROWS;r++){
  const row = card.slice(r*COLS,(r+1)*COLS)
  if(row.every(e=>triggered.includes(e))) lines++
 }
 return lines
}

function checkCard(index){
 const token = Object.keys(players).find(t=>players[t].cardIndex===index)
 if(!token) return

 const card = cards[index]
 const lines = countLines(card)

 if(lines>=1 && !winners.one.includes(token)) winners.one.push(token)
 if(lines>=2 && !winners.two.includes(token)) winners.two.push(token)
 if(lines>=3 && !winners.three.includes(token)) winners.three.push(token)
 if(lines>=4 && !winners.full.includes(token)) winners.full.push(token)
}

/* simple burst protection */
let connectionCount = 0
const MAX_CONNECTIONS_PER_SECOND = 200

setInterval(()=>{
 connectionCount = 0
},1000)

io.on("connection",(socket)=>{

 connectionCount++
 if(connectionCount > MAX_CONNECTIONS_PER_SECOND){
   socket.disconnect(true)
   return
 }

 let token = socket.handshake.auth?.token
 if(!token) token = uuidv4()

 if(!players[token]){
   const index = Math.floor(Math.random()*cards.length)
   players[token] = {cardIndex:index}
 }

 socket.emit("token",token)
 socket.emit("card",cards[players[token].cardIndex])
 socket.emit("state",{triggered,winners})

})

fastify.get("/api/events", async()=>{

 const {data} = await supabase.from("events").select("*").order("id")

 events = data.map(e=>e.name)

 if(cards.length===0) generateCards()

 return data
})

fastify.post("/api/trigger", async(req)=>{

 const {event} = req.body

 if(!triggered.includes(event)) triggered.push(event)

 const affected = eventIndex[event] || []
 affected.forEach(checkCard)

 io.emit("state",{triggered,winners})

 return {ok:true}
})

fastify.get("/api/health", async()=>{
 return {
  status:"ok",
  players:Object.keys(players).length
 }
})

/* static files */
fastify.register(fastifyStatic,{
 root:path.join(__dirname,"dist"),
 prefix:"/",
 wildcard:false
})

/* SPA fallback */
fastify.get("/*",(req,reply)=>{
 reply.sendFile("index.html")
})

const start = async()=>{
 try{
   const port = process.env.PORT || 3000
   await fastify.listen({port,host:"0.0.0.0"})
   console.log("Server listening on",port)
 }catch(err){
   fastify.log.error(err)
   process.exit(1)
 }
}

start()
