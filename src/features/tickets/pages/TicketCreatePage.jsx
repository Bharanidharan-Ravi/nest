import EntityFormPage from "../../../packages/crud/pages/EntityFormPage";
import { TicketFormConfig } from "../config/ticketForm.config";
const TicketCreatePage = () => {    
    return (
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-6 pb-2 border-b border-ghBorder">
            <h2 className="text-2xl font-semibold text-ghText">
              Create Ticket
            </h2>
          </div>
    
          <EntityFormPage mode="Create" config={TicketFormConfig} module="Ticket" />
        </div>
      );
}   
export default TicketCreatePage;    