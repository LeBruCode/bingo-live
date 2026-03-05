
import {useEffect,useState} from "react"

export default function Admin(){

const [events,setEvents] = useState([])
const [name,setName] = useState("")

async function load(){
const r = await fetch("/api/events")
const d = await r.json()
setEvents(d)
}

useEffect(()=>{load()},[])

async function add(){
await fetch("/api/events",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name})
})
setName("")
load()
}

async function edit(id,current){
const n = prompt("Modifier",current)
if(!n) return

await fetch("/api/events/"+id,{
method:"PUT",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({name:n})
})
load()
}

async function trigger(name){
await fetch("/api/trigger",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({event:name})
})
}

return(
<div style={{fontFamily:"sans-serif",padding:40}}>

<h1>Admin</h1>

<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nouvel événement"/>
<button onClick={add}>Ajouter</button>

<div style={{marginTop:30}}>

{events.map(e=>(
<div key={e.id} style={{marginBottom:10}}>

{e.name}

<button onClick={()=>edit(e.id,e.name)}>edit</button>

<button onClick={()=>trigger(e.name)}>trigger</button>

</div>
))}

</div>

</div>
)

}
