import { formatDateTime } from "./dateFormat"

export function formatLastSeen(dateStr){
    if(!dateStr) return "a while ago"
    const date=new Date(dateStr)
    const now= new Date()
    const diffMin=Math.floor((now-date)/60000)

    if(diffMin<1)return "just now"
     if(diffMin<60)return `${diffMin}m ago`

     const diffHr=Math.floor(diffMin/60)
     if(diffHr<24) return `${diffHr}h ago`

     return formatDateTime(date)

}

export function formateDateTime(dateStr){
   if(!dateStr) return ""
   // const normalized=dateStr.endsWith("Z")||dateStr.includes("+")
   // ?dateStr:dateStr + "Z";
   return formatDateTime(dateStr, "Invalid Date")
}
