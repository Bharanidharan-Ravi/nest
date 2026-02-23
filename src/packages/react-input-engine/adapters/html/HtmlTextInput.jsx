// HtmlTextInput.jsx
const HtmlTextInput = ({ name, label, value, error, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      // Automatically applies your global config class!
      className={theme?.input || "w-full border p-2"}
    />
    {error && <div style={{ color: "red" }}>{error}</div>}
  </div>
);
export default HtmlTextInput;
