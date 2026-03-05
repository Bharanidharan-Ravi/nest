import { useState, useRef, useEffect, useCallback } from "react"
import { TextField, InputAdornment, Tooltip, Popover } from "@mui/material"

const SWATCHES = [
  "#ef4444","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6","#8b5cf6","#ec4899",
  "#f87171","#fb923c","#fde047","#4ade80","#2dd4bf","#60a5fa","#a78bfa","#f472b6",
  "#ffffff","#d1d5db","#9ca3af","#6b7280","#374151","#1f2937","#111827","#000000",
]

const hsvToRgb = (h, s, v) => {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const map = [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]]
  const [r,g,b] = map[i]
  return [Math.round(r*255), Math.round(g*255), Math.round(b*255)]
}

const rgbToHex = (r, g, b) =>
  "#" + [r,g,b].map(x => x.toString(16).padStart(2,"0")).join("")

const hexToHsv = (hex) => {
  const r = parseInt(hex.slice(1,3),16)/255
  const g = parseInt(hex.slice(3,5),16)/255
  const b = parseInt(hex.slice(5,7),16)/255
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min
  let h = 0
  if (d !== 0) {
    if      (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else                h = 60 * ((r - g) / d + 4)
  }
  if (h < 0) h += 360
  const s = max === 0 ? 0 : d / max
  return [h, s, max]
}

const isValidHex = (v) => /^#([0-9A-Fa-f]{6})$/.test(v)

// Gradient canvas with sliding cursor
const GradientCanvas = ({ hue, sx, sy, onChange }) => {
  const canvasRef = useRef()
  const dragging  = useRef(false)
  const W = 240, H = 150

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
    ctx.fillRect(0, 0, W, H)
    const wGrad = ctx.createLinearGradient(0, 0, W, 0)
    wGrad.addColorStop(0, "rgba(255,255,255,1)")
    wGrad.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = wGrad
    ctx.fillRect(0, 0, W, H)
    const bGrad = ctx.createLinearGradient(0, H, 0, 0)
    bGrad.addColorStop(0, "rgba(0,0,0,1)")
    bGrad.addColorStop(1, "rgba(0,0,0,0)")
    ctx.fillStyle = bGrad
    ctx.fillRect(0, 0, W, H)
  }, [hue])

  useEffect(() => { draw() }, [draw])

  const pick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, W - 1))
    const y = Math.max(0, Math.min(e.clientY - rect.top,  H - 1))
    onChange(x / W, 1 - y / H, x / W, y / H)
  }, [onChange])

  const onMouseDown = (e) => { dragging.current = true; pick(e) }
  const onMouseMove = (e) => { if (dragging.current) pick(e) }
  const onMouseUp   = ()  => { dragging.current = false }

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp)
    return () => window.removeEventListener("mouseup", onMouseUp)
  }, [])

  return (
    <div style={{ position:"relative", width:W, height:H, borderRadius:6, overflow:"hidden", cursor:"crosshair" }}>
      <canvas
        ref={canvasRef} width={W} height={H}
        style={{ display:"block" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
      />
      <div style={{
        position:"absolute", left: sx * W - 7, top: sy * H - 7,
        width:14, height:14, borderRadius:"50%",
        border:"2px solid white", boxShadow:"0 0 0 1px rgba(0,0,0,0.4)",
        pointerEvents:"none",
      }} />
    </div>
  )
}

// Hue slider
const HueSlider = ({ hue, onChange }) => {
  const trackRef = useRef()
  const dragging = useRef(false)

  const pick = useCallback((e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    onChange(Math.round((x / rect.width) * 360))
  }, [onChange])

  const onMouseDown = (e) => { dragging.current = true; pick(e) }
  const onMouseMove = (e) => { if (dragging.current) pick(e) }
  const onMouseUp   = ()  => { dragging.current = false }

  useEffect(() => {
    window.addEventListener("mouseup", onMouseUp)
    return () => window.removeEventListener("mouseup", onMouseUp)
  }, [])

  return (
    <div
      ref={trackRef}
      style={{
        position:"relative", height:12, borderRadius:6, cursor:"pointer",
        background:"linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
    >
      <div style={{
        position:"absolute", top:"50%", left:`${(hue/360)*100}%`,
        transform:"translate(-50%,-50%)",
        width:16, height:16, borderRadius:"50%",
        background:`hsl(${hue},100%,50%)`,
        border:"2px solid white", boxShadow:"0 0 0 1px rgba(0,0,0,0.3)",
        pointerEvents:"none",
      }} />
    </div>
  )
}

// Main component — same props as MuiTextInput
const MuiColorInput = ({ name, label, value, error, onChange, required, disabled, theme = {} }) => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [hexInput, setHexInput] = useState(value || "")
  const [hue, setHue] = useState(0)
  const [sx, setSx]   = useState(1)
  const [sy, setSy]   = useState(0)

  useEffect(() => { setHexInput(value || "") }, [value])

  const openPicker = (e) => {
    if (disabled) return
    if (isValidHex(value)) {
      const [h, s, v] = hexToHsv(value)
      setHue(h); setSx(s); setSy(1 - v)
    }
    setAnchorEl(e.currentTarget)
  }

  const handleGradientChange = useCallback((s, v, newSx, newSy) => {
    setSx(newSx); setSy(newSy)
    const hex = rgbToHex(...hsvToRgb(hue, s, v))
    setHexInput(hex)
    onChange(name, hex, hex)
  }, [hue, name, onChange])

  const handleHueChange = useCallback((newHue) => {
    setHue(newHue)
    const hex = rgbToHex(...hsvToRgb(newHue, sx, 1 - sy))
    setHexInput(hex)
    onChange(name, hex, hex)
  }, [sx, sy, name, onChange])

  const handleHexType = (e) => {
    const raw = e.target.value
    setHexInput(raw)
    if (isValidHex(raw)) {
      const [h, s, v] = hexToHsv(raw)
      setHue(h); setSx(s); setSy(1 - v)
      onChange(name, raw, raw)
    }
  }

  const handleSwatch = (hex) => {
    setHexInput(hex)
    const [h, s, v] = hexToHsv(hex)
    setHue(h); setSx(s); setSy(1 - v)
    onChange(name, hex, hex)
  }

  const displayColor = isValidHex(value) ? value : "#e5e7eb"

  return (
    <>
      <TextField
        fullWidth variant="outlined" size="small"
        className={theme.input || "wg-mui-input"}
        label={label}
        value={value || ""}
        error={!!error}
        required={required}
        disabled={disabled}
        helperText={error || "Click to pick a color"}
        placeholder="#FF5733"
        inputProps={{ readOnly: true, style: { cursor: "pointer" } }}
        onClick={openPicker}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Tooltip title="Pick a color">
                <span onClick={openPicker} style={{
                  width:22, height:22, borderRadius:4,
                  backgroundColor: displayColor,
                  border:"1px solid #ccc", display:"inline-block",
                  cursor: disabled ? "default" : "pointer", flexShrink:0,
                }} />
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical:"bottom", horizontal:"left" }}
        transformOrigin={{ vertical:"top", horizontal:"left" }}
        PaperProps={{ style:{
          padding:12, borderRadius:8,
          boxShadow:"0 8px 24px rgba(0,0,0,0.18)",
          width:264, display:"flex", flexDirection:"column", gap:10,
        }}}
      >
        {/* Gradient canvas */}
        <GradientCanvas hue={hue} sx={sx} sy={sy} onChange={handleGradientChange} />

        {/* Hue slider */}
        <HueSlider hue={hue} onChange={handleHueChange} />

        {/* Preview + hex input */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{
            width:32, height:32, borderRadius:6, flexShrink:0,
            backgroundColor: displayColor, border:"1px solid #ccc",
          }} />
          <input
            value={hexInput}
            onChange={handleHexType}
            placeholder="#FF5733"
            maxLength={7}
            style={{
              flex:1, border:"1px solid #d1d5db", borderRadius:6,
              padding:"6px 10px", fontSize:13, fontFamily:"monospace",
              outline:"none", backgroundColor:"#f9fafb",
            }}
          />
        </div>

        {/* Swatches */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(8, 1fr)", gap:4 }}>
          {SWATCHES.map((hex) => (
            <button key={hex} onClick={() => handleSwatch(hex)} title={hex} style={{
              width:24, height:24, borderRadius:4, backgroundColor:hex, padding:0,
              border: value === hex ? "2px solid #3b82f6" : "1px solid #d1d5db",
              cursor:"pointer",
            }} />
          ))}
        </div>
      </Popover>
    </>
  )
}

export default MuiColorInput