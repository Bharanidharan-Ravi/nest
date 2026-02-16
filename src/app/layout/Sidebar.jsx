import { Link } from "react-router-dom"
import { getAllFeatures } from "../../core/registry/featureRegistry"

export default function Sidebar() {
  const features = getAllFeatures()

  const items = features.flatMap(f => f.sidebar || [])

  return (
    <div style={{ width: 200, background: "#f5f5f5", padding: 20 }}>
      {items.map((item, index) => (
        <div key={index}>
          <Link to={item.path}>{item.label}</Link>
        </div>
      ))}
    </div>
  )
}
