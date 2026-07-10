const ListCheckBox = ({
  options = [],
  value = [],
  onChange,
}) => {
  const handleToggle = (item, checked) => {
    if (checked) {
      onChange?.([...value, item]);
    } else {
      onChange?.(value.filter((v) => v.id !== item.id));
    }
  };

  return (
    <div className="flex flex-col">
      {options.map((opt) => {
        const isChecked = Array.isArray(value) && value.some((v) => v.id === opt.value.id);

        return (
          <label
            key={opt.value.id}
            className="flex items-center gap-2"
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) =>
                handleToggle(opt.value, e.target.checked)
              }
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
};

export default ListCheckBox;