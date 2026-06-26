import { useList } from "../../../packages/ui-List/context/ListContext";

export function TicketsHeader({ onCreate }) {
  const { total } = useList();

  return (
    <div className="flex justify-between items-center mb-4 flex-none px-2">
      <h2 className="text-2xl font-bold text-gray-800">
        Tickets
        <span className="ml-2 text-gray-500 font-medium">
          ({total})
        </span>
      </h2>

      <button
        onClick={onCreate}
        className="bg-brand-yellow text-white px-4 py-2 rounded-md font-medium hover:bg-yellow-500 transition-colors"
      >
        Create New Tickets
      </button>
    </div>
  );
}
