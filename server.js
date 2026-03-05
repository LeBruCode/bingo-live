
import Fastify from "fastify"
import { Server } from "socket.io"
import http from "http"
import dotenv from "dotenv"
import { createClient } from "@supabase/supabase-js"
import fastifyStatic from "@fastify/static"
import path from "path"
import { fileURLToPath } from "url"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const fastify = Fastify({ logger:true })
const server = http.createServer(fastify.server)
const io = new Server(server,{cors:{origin:"*"}})

const supabase = createClient(process.env.SUPABASE_URL,process.env.SUPABASE_KEY)

const GRID_ROWS = 4
const GRID_COLS = 5
const CARD_SIZE = GRID_ROWS * GRID_COLS
const MAX_CARDS = 5000

const LIMITS = {
  one:20,
  two:10,
  three:5,
  full:1
}

let gameState = {
  triggered:[],
  winners:{
    one:0,
    two:0,
    three:0,
    full:0
  }
}

let cards = []

function generateCards(events){
  for(let i=0;i<MAX_CARDS;i++){
    const shuffled = [...events].sort(()=>Math.random()-0.5)
    cards.push(shuffled.slice(0,CARD_SIZE))
  }
}

function countLines(card,completed){

  let lines = 0

  for(let r=0;r<GRID_ROWS;r++){
    const row = card.slice(r*GRID_COLS,(r+1)*GRID_COLS)
    if(row.every(e=>completed.includes(e))) lines++
  }

  return lines
}

io.on("connection",(socket)=>{

  const card = cards[Math.floor(Math.random()*cards.length)]

  socket.emit("card",card)
  socket.emit("state",gameState)

})

fastify.get("/api/events", async ()=>{

  const {data,error} = await supabase.from("events").select("*").order("id")
  if(error) return {error}

  if(cards.length===0) generateCards(data.map(e=>e.name))

  return data
})

fastify.post("/api/events", async (req)=>{

  const {name} = req.body

  const {data,error} = await supabase
    .from("events")
    .insert([{name}])
    .select()

  if(error) return {error}

  return data
})

fastify.put("/api/events/:id", async (req)=>{

  const {id} = req.params
  const {name} = req.body

  const {data,error} = await supabase
    .from("events")
    .update({name})
    .eq("id",id)
    .select()

  if(error) return {error}

  return data
})

fastify.post("/api/trigger", async (req)=>{

  const {event} = req.body

  gameState.triggered.push(event)

  io.emit("state",gameState)

  return {ok:true}
})

fastify.register(fastifyStatic,{
  root:path.join(__dirname,"dist"),
  prefix:"/"
})

fastify.get("*",(req,reply)=>{
  reply.sendFile("index.html")
})

server.listen({port:process.env.PORT||3000,host:"0.0.0.0"})
