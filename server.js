
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

const fastify = Fastify({ logger: true })
const server = http.createServer(fastify.server)
const io = new Server(server,{cors:{origin:"*"}})

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)

let gameState = {
  triggered: []
}

io.on("connection",(socket)=>{
  socket.emit("state",gameState)
})

fastify.get("/api/events", async ()=>{
  const {data,error} = await supabase.from("events").select("*").order("id")
  if(error) return {error}
  return data
})

fastify.post("/api/events", async (req)=>{
  const {name} = req.body
  const {data,error} = await supabase.from("events").insert([{name}]).select()
  if(error) return {error}
  return data
})

fastify.put("/api/events/:id", async (req)=>{
  const {id} = req.params
  const {name} = req.body

  const {data,error} = await supabase.from("events").update({name}).eq("id",id).select()
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
