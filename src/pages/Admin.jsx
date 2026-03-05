
import {useEffect,useState} from "react"

export default function Admin(){

const [events,setEvents]=useState([])

async function load(){

 const r = await fetch("/api/debug")
 const data = await r.json()
 setEvents([data])

}

useEffect(()=>{load()},[])

return(
<div style={{padding:40,fontFamily:"Inter"}}>

<h1>Admin Debug</h1>

<pre>{JSON.stringify(events,null,2)}</pre>

</div>
)
}
