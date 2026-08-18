type Props = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

export function RirSelect({ value, onChange }: Props) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-600">RIR</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="">-</option>
        <option value="0">0</option>
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
      </select>
    </div>
  );
}
