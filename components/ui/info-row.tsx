export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[#666] text-xs mb-0.5">{label}</div>
      <div className="text-[#ccc] break-all">{value}</div>
    </div>
  );
}
