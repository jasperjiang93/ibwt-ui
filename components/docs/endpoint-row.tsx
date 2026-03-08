export function EndpointRow({
  method,
  path,
  auth,
  description,
}: {
  method: string;
  path: string;
  auth: boolean;
  description: string;
}) {
  const methodColor =
    method === "GET"
      ? "text-green-400"
      : method === "POST"
        ? "text-blue-400"
        : method === "PUT"
          ? "text-yellow-400"
          : method === "DELETE"
            ? "text-red-400"
            : "text-[#ccc]";

  return (
    <tr className="border-b border-gray-800/50">
      <td className="py-3 px-4 font-mono text-[#ccc]">{path}</td>
      <td className={`py-3 px-4 font-mono text-xs font-semibold ${methodColor}`}>{method}</td>
      <td className="py-3 px-4">{auth ? "✓" : "-"}</td>
      <td className="py-3 px-4">{description}</td>
    </tr>
  );
}
