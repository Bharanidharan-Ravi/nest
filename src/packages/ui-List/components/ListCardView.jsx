import { useList } from "../context/ListContext";

export function ListCardView() {
  const { data, config } = useList();

  const theme = config.theme || {};
  
  // Added w-full to guarantee it respects parent width
  const containerClasses = theme.cardContainer || "flex flex-col w-full";
  
  // Added overflow-hidden and break-words to prevent long titles/URLs from stretching the card
  const itemClasses = theme.cardItem || "p-3 border-b border-ghBorder bg-white hover:bg-ghHover transition-colors duration-150 last:border-b-0 w-full overflow-hidden break-words";

  return (
    <div className={containerClasses}>
      {data.map(item => (
        <div key={item.id} className={itemClasses}>
           {config.cardRenderer(item)}
        </div>
      ))}
    </div>
  );
}