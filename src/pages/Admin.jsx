
import {useEffect,useState} from "react"

export default function Admin(){

const [events,setEvents]=useState([])

async function load(){
 const r=await fetch("/api/events")
 setEvents(await r.json())
}

useEffect(()=>{load()},[])

async function trigger(name){
 await fetch("/api/trigger",{
 method:"POST",
 headers:{"Content-Type":"application/json"},
 body:JSON.stringify({event:name})
 })
}

return(
<div style={{padding:40,fontFamily:"Inter"}}>

<h1>Admin</h1>

{events.map(e=>(
<div key={e.id}>
{e.name}
<button onClick={()=>trigger(e.name)}>trigger</button>
</div>
))}

</div>
)
}
