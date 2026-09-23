export function formatLastSeen(dateStr){
    if(!dateStr) return "a while ago"
    const date=new Date(dateStr)
    const now= new Date()
    const diffMin=Math.floor((now-date)/60000)

    if(diffMin<1)return "just now"
     if(diffMin<60)return `${diffMin}m ago`

     const diffHr=Math.floor(diffMin/60)
     if(diffHr<24) return `${diffHr}h ago`

     return date.toLocaleDateString("en-In",{
        day:"numeric",month:"short",
        hour:"2-digit",minute:"2-digit"
     })

}

export function formateDateTime(dateStr){
   if(!dateStr) return ""
   // const normalized=dateStr.endsWith("Z")||dateStr.includes("+")
   // ?dateStr:dateStr + "Z";
   const date=new Date(dateStr)
   return date.toLocaleDateString("en-IN",{
      day:"numeric",
      month:"short",
      year:"numeric",
      hour:"2-digit",
      minute:"2-digit",
      second:"2-digit"
   })
}